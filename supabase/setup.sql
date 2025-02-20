-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS public.bus_schedule_favorites;
DROP TABLE IF EXISTS public.bus_schedules;
DROP TABLE IF EXISTS public.rides;
DROP TABLE IF EXISTS public.profiles;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    avatar_url TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create rides table
CREATE TABLE IF NOT EXISTS public.rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES profiles(id) NOT NULL,
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    available_seats INTEGER NOT NULL CHECK (available_seats >= 0),
    gender_preference TEXT CHECK (gender_preference IN ('male', 'female', 'any')),
    status TEXT CHECK (status IN ('active', 'full', 'completed', 'cancelled')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bus_schedules table
CREATE TABLE IF NOT EXISTS public.bus_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_name TEXT NOT NULL,
    departure_location TEXT NOT NULL,
    arrival_location TEXT NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    days_of_week TEXT[] NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bus_schedule_favorites table
CREATE TABLE IF NOT EXISTS public.bus_schedule_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    schedule_id UUID REFERENCES bus_schedules(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, schedule_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_bus_schedules_route ON public.bus_schedules(route_name);
CREATE INDEX IF NOT EXISTS idx_bus_schedule_favorites_user ON public.bus_schedule_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_bus_schedule_favorites_schedule ON public.bus_schedule_favorites(schedule_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_schedule_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Rides policies
CREATE POLICY "Rides are viewable by everyone"
    ON public.rides FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own rides"
    ON public.rides FOR INSERT
    WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Users can update their own rides"
    ON public.rides FOR UPDATE
    USING (auth.uid() = driver_id);

-- Bus schedules policies
CREATE POLICY "Bus schedules are viewable by everyone"
    ON public.bus_schedules FOR SELECT
    USING (true);

-- Bus schedule favorites policies
CREATE POLICY "Users can view their own favorites"
    ON public.bus_schedule_favorites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites"
    ON public.bus_schedule_favorites FOR ALL
    USING (auth.uid() = user_id);

-- Create updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_rides_updated_at
    BEFORE UPDATE ON public.rides
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_bus_schedules_updated_at
    BEFORE UPDATE ON public.bus_schedules
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample bus schedules
INSERT INTO public.bus_schedules (route_name, departure_location, arrival_location, departure_time, arrival_time, days_of_week, is_active)
VALUES
  ('Route 1', 'Main Campus', 'Student Housing', '08:00', '08:30', ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], true),
  ('Route 2', 'Student Housing', 'Main Campus', '08:45', '09:15', ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], true),
  ('Route 3', 'Main Campus', 'Library', '09:30', '09:45', ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], true),
  ('Route 4', 'Library', 'Main Campus', '10:00', '10:15', ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], true); 