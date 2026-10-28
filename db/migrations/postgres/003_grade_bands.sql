-- K-12 structure: every course can sit in a grade band (K-2, 3-5, 6-8, 9-12) and a level
-- (beginner, intermediate, advanced). Courses on the same subject + band form a "pathway"
-- that learners climb, which powers the level ladder and "next course" suggestions.
ALTER TABLE courses ADD COLUMN grade_band TEXT NOT NULL DEFAULT '';
ALTER TABLE courses ADD COLUMN level TEXT NOT NULL DEFAULT '';
ALTER TABLE courses ADD COLUMN pathway TEXT NOT NULL DEFAULT '';
CREATE INDEX idx_courses_pathway ON courses(pathway);
CREATE INDEX idx_courses_band ON courses(grade_band);
