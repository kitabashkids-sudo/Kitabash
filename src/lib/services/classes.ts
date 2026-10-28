// Batches (cohorts) and live-class scheduling.
// A batch = one course + one teacher + a group of students + a schedule.
// Students see only their batches' classes; teachers see only the batches they teach;
// admins see everything.
import { all, get, run, id, tx, audit } from '../db/index.ts';
import { HttpError } from '../validate.ts';
import type { User } from '../auth.ts';

const isAdmin = (u: User) => u.role === 'admin';

async function getBatch(batchId: string) {
  const b = await get(
    `SELECT b.*, c.title course_title, c.slug course_slug, c.theme, u.name instructor_name
     FROM batches b JOIN courses c ON c.id=b.course_id LEFT JOIN users u ON u.id=b.instructor_id WHERE b.id=?`,
    batchId,
  );
  if (!b) throw new HttpError(404, 'Class group not found');
  return b;
}

export async function batchRole(user: User, batchId: string): Promise<'admin' | 'teacher' | 'student'> {
  const b = await getBatch(batchId);
  if (isAdmin(user)) return 'admin';
  if (user.role === 'instructor' && b.instructor_id === user.id) return 'teacher';
  if (user.role === 'student' && (await get('SELECT 1 FROM batch_members WHERE batch_id=? AND user_id=?', batchId, user.id))) return 'student';
  throw new HttpError(403, 'You are not part of this class group.');
}

export async function listBatches(user: User) {
  const where = isAdmin(user) ? '' : user.role === 'instructor' ? 'WHERE b.instructor_id = ?' : 'WHERE b.id IN (SELECT batch_id FROM batch_members WHERE user_id = ?)';
  const rows = await all(
    `SELECT b.*, c.title course_title, c.slug course_slug, c.theme, u.name instructor_name,
       (SELECT COUNT(*) FROM batch_members m WHERE m.batch_id=b.id) member_count,
       (SELECT MIN(s.starts_at) FROM live_sessions s WHERE s.batch_id=b.id AND s.status IN ('scheduled','live') AND s.starts_at >= ?) next_session
     FROM batches b JOIN courses c ON c.id=b.course_id LEFT JOIN users u ON u.id=b.instructor_id
     ${where} ORDER BY b.status, c.title, b.name`,
    new Date(Date.now() - 3 * 3600_000).toISOString(),
    ...(isAdmin(user) ? [] : [user.id]),
  );
  return rows;
}

export interface BatchInput {
  course_id: string;
  name: string;
  instructor_id?: string | null;
  schedule_note?: string;
  capacity?: number | null;
  starts_on?: string;
}

export async function createBatch(input: BatchInput, adminId: string) {
  if (!(await get('SELECT 1 FROM courses WHERE id=?', input.course_id))) throw new HttpError(400, 'Choose a course.');
  if (input.instructor_id && !(await get("SELECT 1 FROM users WHERE id=? AND role IN ('instructor','admin')", input.instructor_id))) throw new HttpError(400, 'Choose a teacher account.');
  const bid = id('b_');
  await run(
    'INSERT INTO batches (id,course_id,name,instructor_id,schedule_note,capacity,starts_on) VALUES (?,?,?,?,?,?,?)',
    bid, input.course_id, input.name, input.instructor_id || null, input.schedule_note || '', input.capacity || 10, input.starts_on || '',
  );
  await audit(adminId, 'create', 'batch', bid, input.name);
  return bid;
}

export async function updateBatch(batchId: string, patch: Partial<BatchInput> & { status?: 'active' | 'archived' }) {
  await getBatch(batchId);
  if (patch.instructor_id && !(await get("SELECT 1 FROM users WHERE id=? AND role IN ('instructor','admin')", patch.instructor_id))) throw new HttpError(400, 'Choose a teacher account.');
  await run(
    `UPDATE batches SET name=COALESCE(?,name), instructor_id=COALESCE(?,instructor_id), schedule_note=COALESCE(?,schedule_note),
       capacity=COALESCE(?,capacity), starts_on=COALESCE(?,starts_on), status=COALESCE(?,status) WHERE id=?`,
    patch.name || null, patch.instructor_id || null, patch.schedule_note ?? null, patch.capacity ?? null, patch.starts_on ?? null, patch.status || null, batchId,
  );
}

export async function deleteBatch(batchId: string, adminId: string) {
  await getBatch(batchId);
  await run('DELETE FROM batches WHERE id=?', batchId);
  await audit(adminId, 'delete', 'batch', batchId);
}

/** Replace the student list. Adds course enrolments automatically. */
export async function setMembers(batchId: string, userIds: string[], adminId: string) {
  const b = await getBatch(batchId);
  const unique = [...new Set(userIds)];
  if (unique.length > b.capacity) throw new HttpError(400, `This group has room for ${b.capacity} students. Increase the capacity or choose fewer students.`);
  await tx(async () => {
    for (const uid of unique) if (!(await get("SELECT 1 FROM users WHERE id=? AND role='student'", uid))) throw new HttpError(400, 'Only student accounts can join a class group.');
    await run('DELETE FROM batch_members WHERE batch_id=?', batchId);
    for (const uid of unique) {
      await run('INSERT INTO batch_members (batch_id,user_id) VALUES (?,?)', batchId, uid);
      await run('INSERT OR IGNORE INTO enrolments (id,user_id,course_id) VALUES (?,?,?)', id('e_'), uid, b.course_id);
    }
  });
  await audit(adminId, 'members', 'batch', batchId, `${unique.length} students`);
}

export async function batchDetail(user: User, batchId: string) {
  const role = await batchRole(user, batchId);
  const b = await getBatch(batchId);
  const sessions = await all('SELECT * FROM live_sessions WHERE batch_id=? ORDER BY starts_at', batchId);
  const lessons = await all(
    `SELECT l.id, l.title FROM lessons l JOIN modules m ON m.id=l.module_id WHERE l.course_id=? AND l.status='approved' ORDER BY m.position, l.position`,
    b.course_id,
  );
  let roster: any[] = [];
  if (role !== 'student') {
    roster = await all(
      `SELECT u.id, u.name, u.email,
         (SELECT COUNT(*) FROM lesson_progress p WHERE p.user_id=u.id AND p.course_id=? AND p.status='completed') lessons_done,
         (SELECT COALESCE(SUM(score),0) FROM lesson_progress p WHERE p.user_id=u.id AND p.course_id=?) score,
         (SELECT COALESCE(SUM(max_score),0) FROM lesson_progress p WHERE p.user_id=u.id AND p.course_id=?) max_score,
         (SELECT COUNT(*) FROM live_attendance a JOIN live_sessions s ON s.id=a.session_id WHERE a.user_id=u.id AND s.batch_id=?) classes_attended
       FROM batch_members m JOIN users u ON u.id=m.user_id WHERE m.batch_id=? ORDER BY u.name`,
      b.course_id, b.course_id, b.course_id, batchId, batchId,
    );
  }
  return { batch: b, role, sessions, lessons, roster, lessonCount: lessons.length };
}

export interface SessionInput {
  title: string;
  lesson_id?: string | null;
  starts_at: string; // ISO
  duration_min?: number | null;
  repeat_weeks?: number | null; // 1 = just this one
  external_url?: string;
}

async function assertHost(user: User, batchId: string) {
  const role = await batchRole(user, batchId);
  if (role === 'student') throw new HttpError(403, 'Only the teacher or an admin can manage live classes.');
}

function checkUrl(u?: string) {
  if (!u) return '';
  try {
    const x = new URL(u);
    if (x.protocol !== 'https:') throw new Error();
    return x.toString();
  } catch {
    throw new HttpError(400, 'The meeting link must be a full https:// address (e.g. a Zoom or Google Meet link).');
  }
}

export async function scheduleSessions(user: User, batchId: string, input: SessionInput) {
  await assertHost(user, batchId);
  const b = await getBatch(batchId);
  const start = new Date(input.starts_at);
  if (isNaN(start.getTime())) throw new HttpError(400, 'Choose a valid date and time.');
  if (input.lesson_id && !(await get('SELECT 1 FROM lessons WHERE id=? AND course_id=?', input.lesson_id, b.course_id))) throw new HttpError(400, 'That lesson is not in this course.');
  const weeks = Math.max(1, Math.min(52, input.repeat_weeks || 1));
  const url = checkUrl(input.external_url);
  const ids: string[] = [];
  await tx(async () => {
    for (let w = 0; w < weeks; w++) {
      const sid = id('ls_');
      const at = new Date(start.getTime() + w * 7 * 864e5).toISOString();
      await run(
        'INSERT INTO live_sessions (id,batch_id,course_id,lesson_id,title,starts_at,duration_min,external_url,created_by) VALUES (?,?,?,?,?,?,?,?,?)',
        sid, batchId, b.course_id, input.lesson_id || null, weeks > 1 ? `${input.title} (week ${w + 1})` : input.title, at, input.duration_min || 60, url, user.id,
      );
      ids.push(sid);
    }
  });
  return ids;
}

export async function getSession(sessionId: string) {
  const s = await get(
    `SELECT s.*, b.name batch_name, b.instructor_id, c.title course_title, c.slug course_slug, c.theme, l.title lesson_title, u.name instructor_name
     FROM live_sessions s JOIN batches b ON b.id=s.batch_id JOIN courses c ON c.id=s.course_id
     LEFT JOIN lessons l ON l.id=s.lesson_id LEFT JOIN users u ON u.id=b.instructor_id WHERE s.id=?`,
    sessionId,
  );
  if (!s) throw new HttpError(404, 'Live class not found');
  return s;
}

/** Who may do what in a session: host = teacher of the batch or admin; student = batch member. */
export async function sessionAccess(user: User, sessionId: string) {
  const s = await getSession(sessionId);
  const role = await batchRole(user, s.batch_id);
  return { session: s, role: role === 'student' ? ('student' as const) : ('host' as const) };
}

export async function updateSession(user: User, sessionId: string, patch: { title?: string; starts_at?: string; duration_min?: number | null; external_url?: string; lesson_id?: string | null; status?: 'cancelled' | 'scheduled' }) {
  const { session } = await sessionAccess(user, sessionId).then((a) => {
    if (a.role !== 'host') throw new HttpError(403, 'Only the teacher or an admin can change this class.');
    return a;
  });
  if (session.status === 'ended') throw new HttpError(409, 'This class has already ended.');
  if (patch.starts_at && isNaN(new Date(patch.starts_at).getTime())) throw new HttpError(400, 'Choose a valid date and time.');
  await run(
    `UPDATE live_sessions SET title=COALESCE(?,title), starts_at=COALESCE(?,starts_at), duration_min=COALESCE(?,duration_min),
       external_url=COALESCE(?,external_url), lesson_id=COALESCE(?,lesson_id), status=COALESCE(?,status) WHERE id=?`,
    patch.title || null, patch.starts_at ? new Date(patch.starts_at).toISOString() : null, patch.duration_min ?? null,
    patch.external_url === undefined ? null : checkUrl(patch.external_url), patch.lesson_id || null, patch.status || null, sessionId,
  );
}

export async function setSessionStatus(sessionId: string, status: 'live' | 'ended') {
  if (status === 'live') await run("UPDATE live_sessions SET status='live', started_at=COALESCE(started_at, datetime('now')) WHERE id=?", sessionId);
  else await run("UPDATE live_sessions SET status='ended', ended_at=datetime('now') WHERE id=?", sessionId);
}

/** Upcoming + in-progress classes relevant to this user. */
export async function upcoming(user: User, limit = 20) {
  const since = new Date(Date.now() - 3 * 3600_000).toISOString();
  let where: string;
  let args: any[] = [];
  if (user.role === 'admin') where = '1=1';
  else if (user.role === 'instructor') (where = 'b.instructor_id = ?'), (args = [user.id]);
  else if (user.role === 'student') (where = 'b.id IN (SELECT batch_id FROM batch_members WHERE user_id = ?)'), (args = [user.id]);
  else (where = 'b.id IN (SELECT m.batch_id FROM batch_members m JOIN guardian_links g ON g.student_id=m.user_id WHERE g.guardian_id = ?)'), (args = [user.id]);
  return all(
    `SELECT s.id, s.title, s.starts_at, s.duration_min, s.status, s.external_url, s.lesson_id, b.name batch_name, c.title course_title, c.theme, u.name instructor_name
     FROM live_sessions s JOIN batches b ON b.id=s.batch_id JOIN courses c ON c.id=s.course_id LEFT JOIN users u ON u.id=b.instructor_id
     WHERE ${where} AND s.status IN ('scheduled','live') AND s.starts_at >= ? ORDER BY s.status='live' DESC, s.starts_at LIMIT ?`,
    ...args, since, limit,
  );
}

export async function addAttendance(sessionId: string, userId: string, seconds: number, newJoin: boolean) {
  await run(
    `INSERT INTO live_attendance (session_id,user_id,seconds) VALUES (?,?,?)
     ON CONFLICT(session_id,user_id) DO UPDATE SET seconds = live_attendance.seconds + excluded.seconds,
       last_seen = datetime('now'), joins = live_attendance.joins + ?`,
    sessionId, userId, Math.max(0, Math.round(seconds)), newJoin ? 1 : 0,
  );
}

export async function saveMessage(sessionId: string, userId: string, body: string) {
  const mid = id('lm_');
  await run('INSERT INTO live_messages (id,session_id,user_id,body) VALUES (?,?,?,?)', mid, sessionId, userId, body);
  return mid;
}

export async function sessionReport(user: User, sessionId: string) {
  const { session, role } = await sessionAccess(user, sessionId);
  if (role !== 'host') throw new HttpError(403, 'Only the teacher or an admin can see the class report.');
  const attendance = await all(
    `SELECT u.id, u.name, a.first_join, a.last_seen, a.seconds, a.joins FROM batch_members m JOIN users u ON u.id=m.user_id
     LEFT JOIN live_attendance a ON a.session_id=? AND a.user_id=u.id WHERE m.batch_id=? ORDER BY u.name`,
    sessionId, session.batch_id,
  );
  const messages = await all('SELECT m.body, m.created_at, u.name FROM live_messages m LEFT JOIN users u ON u.id=m.user_id WHERE m.session_id=? ORDER BY m.created_at', sessionId);
  return { session, attendance, messages };
}

export async function guardianClasses(guardianId: string) {
  return all(
    `SELECT u.name child, s.title, s.starts_at, s.status, c.title course_title, a.seconds
     FROM guardian_links g JOIN users u ON u.id=g.student_id JOIN batch_members m ON m.user_id=u.id
     JOIN live_sessions s ON s.batch_id=m.batch_id JOIN courses c ON c.id=s.course_id
     LEFT JOIN live_attendance a ON a.session_id=s.id AND a.user_id=u.id
     WHERE g.guardian_id=? AND s.status != 'cancelled' AND s.starts_at >= ? ORDER BY s.starts_at DESC LIMIT 30`,
    guardianId, new Date(Date.now() - 30 * 864e5).toISOString(),
  );
}
