import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, useRoute, match, navigate } from './lib/router.tsx';
import { SessionProvider, useSession } from './lib/session.tsx';
import { Shell } from './components/Shell.tsx';
import { Spinner, Toaster, Empty } from './components/ui.tsx';
import { Login } from './pages/Login.tsx';
import { Setup } from './pages/Setup.tsx';
import { StudentHome, Catalog, CoursePage } from './pages/Learner.tsx';
import { LessonPlayer } from './pages/LessonPlayer.tsx';
import { TeachHome, TeachLesson, CourseReport } from './pages/Teach.tsx';
import { GuardianHome } from './pages/Guardian.tsx';
import { AdminHome } from './pages/admin/AdminHome.tsx';
import { Studio } from './pages/admin/Studio.tsx';
import { Library, Platform } from './pages/admin/Platform.tsx';
import { ClassesPage, ClassDetail } from './pages/Classes.tsx';
import { LivePage, LiveReport } from './pages/Live.tsx';

function Redirect({ to }: { to: string }) {
  useEffect(() => {
    navigate(to, true);
  }, [to]);
  return null;
}

function Routes() {
  const { path } = useRoute();
  const { me } = useSession();
  useEffect(() => {
    if (me && !me.user && path !== '/login' && path !== '/setup') navigate('/login', true);
  }, [me, path]);
  if (!me) return <Spinner label="Starting Kitabash" />;
  if (path === '/login') return <Login />;
  if (path === '/setup') return <Setup />;
  if (!me.user) return null;
  const role = me.user.role;
  const staff = role === 'admin' || role === 'instructor';
  let m: Record<string, string> | null;

  if (path === '/') {
    if (role === 'admin') return <Redirect to="/admin" />;
    if (role === 'instructor') return <Redirect to="/teach" />;
    return <Shell>{role === 'guardian' ? <GuardianHome /> : <StudentHome />}</Shell>;
  }
  if (path === '/catalog') return <Shell><Catalog /></Shell>;
  if ((m = match('/courses/:id', path))) return <Shell><CoursePage id={m.id} /></Shell>;
  if ((m = match('/lessons/:id', path))) return <Shell><LessonPlayer id={m.id} /></Shell>;
  if (path === '/classes') return <Shell><ClassesPage /></Shell>;
  if ((m = match('/classes/:id', path))) return <Shell><ClassDetail id={m.id} /></Shell>;
  if (role !== 'guardian' && (m = match('/live/:id/report', path))) return <Shell><LiveReport id={m.id} /></Shell>;
  if (role !== 'guardian' && (m = match('/live/:id', path))) return <Shell wide><LivePage id={m.id} /></Shell>;
  if (staff && path === '/teach') return <Shell><TeachHome /></Shell>;
  if (staff && (m = match('/teach/lessons/:id', path))) return <Shell wide><TeachLesson id={m.id} /></Shell>;
  if (staff && (m = match('/teach/courses/:id/report', path))) return <Shell><CourseReport id={m.id} /></Shell>;
  if (role === 'admin') {
    if (path === '/admin') return <Shell><AdminHome /></Shell>;
    if ((m = match('/admin/courses/:id', path))) return <Shell wide><Studio id={m.id} /></Shell>;
    if (path === '/admin/library') return <Shell><Library /></Shell>;
    if (path === '/admin/platform') return <Shell><Platform /></Shell>;
  }
  return (
    <Shell>
      <Empty title="Page not found">That page doesn’t exist or you don’t have access.</Empty>
    </Shell>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider>
      <SessionProvider>
        <Routes />
        <Toaster />
      </SessionProvider>
    </RouterProvider>
  </StrictMode>,
);
