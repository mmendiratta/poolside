  ALTER TABLE markets ADD COLUMN pool_id UUID REFERENCES pools(id) ON DELETE CASCADE;
  UPDATE markets m SET pool_id = (SELECT pool_id FROM events e WHERE e.id = m.event_id);
  ALTER TABLE markets ALTER COLUMN pool_id SET NOT NULL;
  ALTER TABLE markets DROP COLUMN event_id;
  DROP TABLE events;