-- PoolSide Initial Schema
-- Run this in your Supabase SQL editor

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,          -- human-readable URL segment e.g. "jake-sarah-wedding"
  name TEXT NOT NULL,
  description TEXT,
  created_by_name TEXT NOT NULL,      -- no auth, just a name
  manager_token UUID DEFAULT gen_random_uuid(), -- secret token for creator to manage event
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE
);

-- Pools table (individual prediction questions within an event)
CREATE TABLE pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('binary', 'multiple', 'numeric')),
  closes_at TIMESTAMPTZ,              -- when picks lock
  resolved_option_id UUID,            -- set when creator resolves (FK added below)
  resolved_numeric_value NUMERIC,     -- for numeric pools
  resolved_at TIMESTAMPTZ,
  points_value INTEGER DEFAULT 100,   -- points awarded for correct pick
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Options table (choices for binary/multiple pools)
CREATE TABLE options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

-- Add FK for resolved_option_id after options table exists
ALTER TABLE pools
  ADD CONSTRAINT fk_resolved_option
  FOREIGN KEY (resolved_option_id) REFERENCES options(id);

-- Participants table (people who join an event)
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  session_token UUID DEFAULT gen_random_uuid(), -- stored in localStorage to identify returning participant
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, name)              -- no duplicate names per event
);

-- Picks table
CREATE TABLE picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  option_id UUID REFERENCES options(id),          -- for binary/multiple
  numeric_value NUMERIC,                           -- for numeric pools
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, pool_id)     -- one pick per pool per participant
);

-- -----------------------------------------------
-- Computed leaderboard view
-- -----------------------------------------------
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id AS participant_id,
  p.event_id,
  p.name,
  COALESCE(SUM(
    CASE
      -- binary/multiple: pick matches resolved option
      WHEN pk.option_id IS NOT NULL
        AND pk.option_id = pl.resolved_option_id
      THEN pl.points_value

      -- numeric: closest value wins (handled in app logic, 0 here)
      ELSE 0
    END
  ), 0) AS points,
  COUNT(pk.id) AS total_picks
FROM participants p
LEFT JOIN picks pk ON pk.participant_id = p.id
LEFT JOIN pools pl ON pl.id = pk.pool_id
GROUP BY p.id, p.event_id, p.name;

-- -----------------------------------------------
-- Row Level Security (optional but recommended)
-- -----------------------------------------------
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;

-- Public read access for everything
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read pools" ON pools FOR SELECT USING (true);
CREATE POLICY "Public read options" ON options FOR SELECT USING (true);
CREATE POLICY "Public read participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Public read picks" ON picks FOR SELECT USING (true);

-- Public insert for participants and picks (name-only join flow)
CREATE POLICY "Public insert participants" ON participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert picks" ON picks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update picks" ON picks FOR UPDATE USING (true);

-- Events, pools, options insert/update done via service role (API routes with service key)
CREATE POLICY "Service insert events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert pools" ON pools FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert options" ON options FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update events" ON events FOR UPDATE USING (true);
CREATE POLICY "Service update pools" ON pools FOR UPDATE USING (true);
