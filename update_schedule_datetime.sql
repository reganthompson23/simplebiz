-- First, drop the existing columns
ALTER TABLE schedules 
DROP COLUMN start_time,
DROP COLUMN end_time;

-- Add new separate date and time columns
ALTER TABLE schedules 
ADD COLUMN schedule_date date NOT NULL,
ADD COLUMN start_time time NOT NULL,
ADD COLUMN end_time time NOT NULL; 