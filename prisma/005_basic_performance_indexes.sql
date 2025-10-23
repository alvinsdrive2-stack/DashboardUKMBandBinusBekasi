-- BASIC PERFORMANCE INDEXES FOR UKM BAND BEKASI DASHBOARD
-- Simple indexes tanpa predicate yang kompleks

-- ===============================
-- EVENT TABLE OPTIMIZATIONS
-- ===============================

-- Primary index untuk event filtering (sangat sering digunakan)
CREATE INDEX IF NOT EXISTS idx_event_status_date_created ON "Event"(status, date DESC, "createdAt" DESC);

-- Index untuk event filtering by date dan status
CREATE INDEX IF NOT EXISTS idx_event_date_status ON "Event"(date, status);

-- Index untuk event by location dan status
CREATE INDEX IF NOT EXISTS idx_event_location_status ON "Event"(location, status);

-- Index untuk submitted events
CREATE INDEX IF NOT EXISTS idx_event_submitted_created ON "Event"("isSubmittedByPublic", "createdAt" DESC);

-- ===============================
-- EVENT PERSONNEL TABLE OPTIMIZATIONS
-- ===============================

-- Index untuk user participation history
CREATE INDEX IF NOT EXISTS idx_event_personnel_user_status ON "EventPersonnel"("userId", status);

-- Index untuk event personnel by event dan status
CREATE INDEX IF NOT EXISTS idx_event_personnel_event_status ON "EventPersonnel"("eventId", status);

-- Index untuk user ranking queries
CREATE INDEX IF NOT EXISTS idx_event_personnel_user_approved ON "EventPersonnel"("userId", status, "eventId")
WHERE status = 'APPROVED';

-- Index untuk pending approvals
CREATE INDEX IF NOT EXISTS idx_event_personnel_status_created ON "EventPersonnel"(status, "createdAt" DESC);

-- ===============================
-- USER TABLE OPTIMIZATIONS
-- ===============================

-- Index untuk organization level filtering
CREATE INDEX IF NOT EXISTS idx_user_org_level ON "User"("organizationLvl");

-- Index untuk user search
CREATE INDEX IF NOT EXISTS idx_user_name ON "User"(name);

-- Index untuk user name dan organization
CREATE INDEX IF NOT EXISTS idx_user_name_org ON "User"(name, "organizationLvl");

-- ===============================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ===============================

-- Index untuk dashboard queries
CREATE INDEX IF NOT EXISTS idx_event_status_date_loc ON "Event"(status, date DESC, location);

-- Index untuk user participation analytics
CREATE INDEX IF NOT EXISTS idx_event_personnel_user_event ON "EventPersonnel"("userId", "eventId", status);

-- Index untuk monthly statistics
CREATE INDEX IF NOT EXISTS idx_event_date_status_desc ON "Event"(date DESC, status);

-- ===============================
-- UNIQUE INDEXES (sudah ada di schema)
-- ===============================

-- Sudah ada di schema:
-- @@unique([userId, eventId]) di EventPersonnel
-- @@unique([nim]) di User
-- @@unique([email]) di User

-- ===============================
-- MAINTENANCE COMMANDS
-- ===============================

-- Update table statistics untuk query optimizer
ANALYZE "Event";
ANALYZE "EventPersonnel";
ANALYZE "User";

-- ===============================
-- PERFORMANCE NOTES
-- ===============================

-- Index ini akan membantu query-query berikut:
-- 1. Dashboard event loading: WHERE status = 'PUBLISHED' ORDER BY date DESC
-- 2. Member future events: WHERE status = 'PUBLISHED' AND date >= NOW() ORDER BY date ASC
-- 3. User participation: SELECT * FROM "EventPersonnel" WHERE "userId" = ? AND status = 'APPROVED'
-- 4. Event personnel: SELECT * FROM "EventPersonnel" WHERE "eventId" = ? ORDER BY status
-- 5. User search: SELECT * FROM "User" WHERE name LIKE ? AND "organizationLvl" = 'TALENT'
-- 6. Statistics queries: COUNT queries dengan WHERE clauses