-- Performance indexes for EventPersonnel table
-- Index untuk user_id lookup (sangat sering digunakan)
CREATE INDEX IF NOT EXISTS idx_event_personnel_user_id ON "EventPersonnel"("userId");

-- Index untuk event_id lookup (sangat sering digunakan)
CREATE INDEX IF NOT EXISTS idx_event_personnel_event_id ON "EventPersonnel"("eventId");

-- Composite index untuk status queries (sangat penting untuk performance)
CREATE INDEX IF NOT EXISTS idx_event_personnel_status_user ON "EventPersonnel"("status", "userId");

-- Composite index untuk event personnel dengan status
CREATE INDEX IF NOT EXISTS idx_event_personnel_event_status ON "EventPersonnel"("eventId", "status");

-- Index untuk organization level queries
CREATE INDEX IF NOT EXISTS idx_user_organization_lvl ON "User"("organizationLvl");

-- Composite index untuk user participation queries
CREATE INDEX IF NOT EXISTS idx_user_org_participation ON "User"("organizationLvl") WHERE "organizationLvl" IN ('TALENT', 'SPECTA');

-- Event table indexes
CREATE INDEX IF NOT EXISTS idx_event_status_date ON "Event"("status", "date");
CREATE INDEX IF NOT EXISTS idx_event_date ON "Event"("date");

-- Composite index untuk event participation analytics
CREATE INDEX IF NOT EXISTS idx_event_personnel_analytics ON "EventPersonnel"("userId", "status", "eventId")
INCLUDE ("role");