-- Drop unused tables
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS schedule_v2;

-- Create the schedule table if it doesn't exist
CREATE TABLE IF NOT EXISTS schedule (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    content jsonb NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own schedule entries
CREATE POLICY "Users can view own schedule entries"
    ON schedule FOR SELECT
    TO public
    USING (auth.uid() = profile_id);

-- Policy for users to insert their own schedule entries
CREATE POLICY "Users can insert own schedule entries"
    ON schedule FOR INSERT
    TO public
    WITH CHECK (auth.uid() = profile_id);

-- Policy for users to update their own schedule entries
CREATE POLICY "Users can update own schedule entries"
    ON schedule FOR UPDATE
    TO public
    USING (auth.uid() = profile_id);

-- Policy for users to delete their own schedule entries
CREATE POLICY "Users can delete own schedule entries"
    ON schedule FOR DELETE
    TO public
    USING (auth.uid() = profile_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_schedule_updated_at
    BEFORE UPDATE ON schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();