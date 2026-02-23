-- Pools (the persistent group)
CREATE TABLE pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by_name TEXT NOT NULL,
  manager_token UUID DEFAULT gen_random_uuid(),
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE
);

-- Members (join a pool once, persist across all events)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  session_token UUID DEFAULT gen_random_uuid(),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pool_id, name)
);

-- Events (occasions within a pool)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE
);

-- Markets (individual prediction questions within an event)
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('binary', 'multiple', 'numeric')),
  closes_at TIMESTAMPTZ,
  resolved_option_id UUID,
  resolved_numeric_value NUMERIC,
  resolved_at TIMESTAMPTZ,
  points_value INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Options (choices for binary/multiple markets)
CREATE TABLE options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

ALTER TABLE markets
  ADD CONSTRAINT fk_resolved_option
  FOREIGN KEY (resolved_option_id) REFERENCES options(id);

-- Picks
CREATE TABLE picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  option_id UUID REFERENCES options(id),
  numeric_value NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, market_id)
);

-- Leaderboard view (cumulative across all events in a pool)
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  m.id AS member_id,
  m.pool_id,
  m.name,
  COALESCE(SUM(
    CASE
      WHEN pk.option_id IS NOT NULL
        AND pk.option_id = mk.resolved_option_id
      THEN mk.points_value
      ELSE 0
    END
  ), 0) AS points,
  COUNT(pk.id) AS total_picks
FROM members m
LEFT JOIN picks pk ON pk.member_id = m.id
LEFT JOIN markets mk ON mk.id = pk.market_id
GROUP BY m.id, m.pool_id, m.name;

-- RLS
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pools" ON pools FOR SELECT USING (true);
CREATE POLICY "Public read members" ON members FOR SELECT USING (true);
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read markets" ON markets FOR SELECT USING (true);
CREATE POLICY "Public read options" ON options FOR SELECT USING (true);
CREATE POLICY "Public read picks" ON picks FOR SELECT USING (true);

CREATE POLICY "Public insert members" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert picks" ON picks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update picks" ON picks FOR UPDATE USING (true);

CREATE POLICY "Service insert pools" ON pools FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert markets" ON markets FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert options" ON options FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update pools" ON pools FOR UPDATE USING (true);
CREATE POLICY "Service update markets" ON markets FOR UPDATE USING (true);