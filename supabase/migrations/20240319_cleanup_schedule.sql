-- Drop all schedule-related tables
DROP TABLE IF EXISTS schedule CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS schedule_v2 CASCADE;

-- Drop schedule-related functions
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;