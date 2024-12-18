-- Create a new, properly structured schedule table
CREATE TABLE schedule_v2 (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES auth.users(id),
    customer_name TEXT NOT NULL,
    description TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE schedule_v2 ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view own schedule entries"
    ON schedule_v2 FOR SELECT
    TO public
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own schedule entries"
    ON schedule_v2 FOR INSERT
    TO public
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own schedule entries"
    ON schedule_v2 FOR UPDATE
    TO public
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own schedule entries"
    ON schedule_v2 FOR DELETE
    TO public
    USING (auth.uid() = profile_id);

-- Add updated_at trigger
CREATE TRIGGER update_schedule_v2_updated_at
    BEFORE UPDATE ON schedule_v2
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 