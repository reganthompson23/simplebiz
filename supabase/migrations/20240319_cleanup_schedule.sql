-- Drop unused tables
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS schedule_v2;

-- Keep only the working table (schedule with JSONB)
-- Add any missing policies
CREATE POLICY "Users can update own schedule entries"
    ON schedule FOR UPDATE
    TO public
    USING (auth.uid() = profile_id); 