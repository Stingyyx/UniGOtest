-- Configure email rate limits (these must run outside transaction block)
DO $$ BEGIN
    PERFORM set_config('auth.rate_limit.email.enabled', 'true', true);
    PERFORM set_config('auth.rate_limit.email.points', '30', true);
    PERFORM set_config('auth.rate_limit.email.cost', '1', true);
    PERFORM set_config('auth.rate_limit.email.period_seconds', '86400', true);
END $$;

-- Backup existing data
DO $$
BEGIN
    -- Create backup tables if they don't exist
    CREATE TABLE IF NOT EXISTS backup_profiles AS SELECT * FROM public.profiles WHERE 1=0;
    CREATE TABLE IF NOT EXISTS backup_notifications AS SELECT * FROM public.notifications WHERE 1=0;
    CREATE TABLE IF NOT EXISTS backup_notification_preferences AS SELECT * FROM public.notification_preferences WHERE 1=0;
    CREATE TABLE IF NOT EXISTS backup_push_tokens AS SELECT * FROM public.push_tokens WHERE 1=0;
    CREATE TABLE IF NOT EXISTS backup_rides AS SELECT * FROM public.rides WHERE 1=0;
    CREATE TABLE IF NOT EXISTS backup_ride_requests AS SELECT * FROM public.ride_requests WHERE 1=0;
    CREATE TABLE IF NOT EXISTS backup_messages AS SELECT * FROM public.messages WHERE 1=0;
    CREATE TABLE IF NOT EXISTS backup_bus_schedule_favorites AS SELECT * FROM public.bus_schedule_favorites WHERE 1=0;

    -- Backup current data
    TRUNCATE backup_profiles;
    INSERT INTO backup_profiles SELECT * FROM public.profiles;
    
    TRUNCATE backup_notifications;
    INSERT INTO backup_notifications SELECT * FROM public.notifications;
    
    TRUNCATE backup_notification_preferences;
    INSERT INTO backup_notification_preferences SELECT * FROM public.notification_preferences;
    
    TRUNCATE backup_push_tokens;
    INSERT INTO backup_push_tokens SELECT * FROM public.push_tokens;
    
    TRUNCATE backup_rides;
    INSERT INTO backup_rides SELECT * FROM public.rides;
    
    TRUNCATE backup_ride_requests;
    INSERT INTO backup_ride_requests SELECT * FROM public.ride_requests;
    
    TRUNCATE backup_messages;
    INSERT INTO backup_messages SELECT * FROM public.messages;
    
    TRUNCATE backup_bus_schedule_favorites;
    INSERT INTO backup_bus_schedule_favorites SELECT * FROM public.bus_schedule_favorites;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error during backup: %', SQLERRM;
END $$;

-- Reset everything first
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Grant proper permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')) DEFAULT 'other',
    college_id TEXT,
    language_preference TEXT DEFAULT 'ar' CHECK (language_preference IN ('ar', 'en')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    username_updated_at TIMESTAMPTZ DEFAULT NOW(),
    full_name_updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT username_length CHECK (char_length(username) >= 3),
    CONSTRAINT valid_gender CHECK (gender IN ('male', 'female', 'other')),
    CONSTRAINT valid_college_id CHECK (
        college_id IS NULL OR 
        (college_id ~ '^202[0-9]{5,7}$' AND LENGTH(college_id) BETWEEN 8 AND 10)
    )
);

-- Grant access to profiles table
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (
        type IN (
            'ride_request',
            'ride_accepted',
            'ride_rejected',
            'ride_cancelled',
            'bus_reminder',
            'chat_message',
            'system'
        )
    ),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant access to notifications table
GRANT ALL ON public.notifications TO postgres;
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.notifications TO authenticated;

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ride_requests BOOLEAN DEFAULT true,
    ride_updates BOOLEAN DEFAULT true,
    ride_chat BOOLEAN DEFAULT true,
    bus_alerts BOOLEAN DEFAULT true,
    food_orders BOOLEAN DEFAULT true,
    study_alerts BOOLEAN DEFAULT true,
    social_events BOOLEAN DEFAULT true,
    system_alerts BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    transportation_notifications BOOLEAN DEFAULT true,
    academic_notifications BOOLEAN DEFAULT true,
    service_notifications BOOLEAN DEFAULT true,
    quiet_hours_start TIME DEFAULT '23:00',
    quiet_hours_end TIME DEFAULT '07:00',
    notification_language TEXT DEFAULT 'ar' CHECK (notification_language IN ('ar', 'en')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id)
);

-- Create push_tokens table
CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, token)
);

    -- Create rides table
CREATE TABLE IF NOT EXISTS public.rides (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    total_seats INTEGER NOT NULL DEFAULT 4,
    available_seats INTEGER NOT NULL CHECK (
        CASE 
            WHEN status = 'cancelled' THEN available_seats >= 0
            ELSE available_seats > 0
        END
    ),
    gender_preference TEXT CHECK (gender_preference IN ('any', 'male', 'female')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'full', 'cancelled', 'completed', 'ready')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Grant permissions for rides table
GRANT ALL ON public.rides TO postgres;
GRANT ALL ON public.rides TO service_role;
GRANT ALL ON public.rides TO authenticated;

-- Enable RLS on rides table
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Create policies for rides table
CREATE POLICY "Anyone can view active rides"
    ON public.rides
    FOR SELECT
    USING (status IN ('active', 'full'));

CREATE POLICY "Users can create their own rides"
    ON public.rides
    FOR INSERT
    WITH CHECK (auth.uid() = driver_id::uuid);

CREATE POLICY "Users can update their own rides"
    ON public.rides
    FOR UPDATE
    USING (auth.uid() = driver_id::uuid)
    WITH CHECK (auth.uid() = driver_id::uuid);

CREATE POLICY "Users can delete their own rides"
    ON public.rides
    FOR DELETE
    USING (auth.uid() = driver_id::uuid);

-- Create ride_requests table
CREATE TABLE IF NOT EXISTS public.ride_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    passenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    message TEXT,
    seats_requested INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ride_id, passenger_id)
);

-- Grant permissions for ride_requests table
GRANT ALL ON public.ride_requests TO postgres;
GRANT ALL ON public.ride_requests TO service_role;
GRANT ALL ON public.ride_requests TO authenticated;

-- Enable RLS on ride_requests table
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for ride_requests table
CREATE POLICY "Users can view their own requests and requests for their rides"
    ON public.ride_requests
    FOR SELECT
    USING (
        auth.uid() = passenger_id::uuid OR 
        auth.uid() IN (
            SELECT driver_id::uuid 
            FROM public.rides 
            WHERE id = ride_id
        )
    );

CREATE POLICY "Users can create their own requests"
    ON public.ride_requests
    FOR INSERT
    WITH CHECK (auth.uid() = passenger_id::uuid);

CREATE POLICY "Users can update their own requests or requests for their rides"
    ON public.ride_requests
    FOR UPDATE
    USING (
        auth.uid() = passenger_id::uuid OR 
        auth.uid() IN (
            SELECT driver_id::uuid 
            FROM public.rides 
            WHERE id = ride_id
        )
    )
    WITH CHECK (
        auth.uid() = passenger_id::uuid OR 
        auth.uid() IN (
            SELECT driver_id::uuid 
            FROM public.rides 
            WHERE id = ride_id
        )
    );

CREATE POLICY "Users can delete their own requests"
    ON public.ride_requests
    FOR DELETE
    USING (auth.uid() = passenger_id::uuid);

-- Create messages table for ride chat
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant permissions for messages table
GRANT ALL ON public.messages TO postgres;
GRANT ALL ON public.messages TO service_role;
GRANT ALL ON public.messages TO authenticated;

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages table
CREATE POLICY "Users can view messages for rides they're part of"
    ON public.messages
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT driver_id::uuid 
            FROM public.rides 
            WHERE id = ride_id
            UNION
            SELECT passenger_id::uuid 
            FROM public.ride_requests 
            WHERE ride_id = messages.ride_id 
            AND status = 'accepted'
        )
    );

CREATE POLICY "Users can send messages for rides they're part of"
    ON public.messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id::uuid AND
        auth.uid() IN (
            SELECT driver_id::uuid 
            FROM public.rides 
            WHERE id = ride_id
            UNION
            SELECT passenger_id::uuid 
            FROM public.ride_requests 
            WHERE ride_id = messages.ride_id 
            AND status = 'accepted'
        )
    );

CREATE POLICY "Users can update their own messages"
    ON public.messages
    FOR UPDATE
    USING (auth.uid() = sender_id::uuid)
    WITH CHECK (auth.uid() = sender_id::uuid);

CREATE POLICY "Users can delete their own messages"
    ON public.messages
    FOR DELETE
    USING (auth.uid() = sender_id::uuid);

-- Create bus_schedules table
CREATE TABLE IF NOT EXISTS public.bus_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_name TEXT NOT NULL,
    departure_location TEXT NOT NULL,
    arrival_location TEXT NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    days_of_week TEXT[] NOT NULL,
    city TEXT NOT NULL,
    notes TEXT,
    schedule_type TEXT NOT NULL CHECK (schedule_type IN ('regular', 'flexible', 'continuous', 'last', 'return')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant permissions for bus_schedules
GRANT ALL ON public.bus_schedules TO postgres;
GRANT ALL ON public.bus_schedules TO service_role;
GRANT SELECT ON public.bus_schedules TO authenticated;
GRANT SELECT ON public.bus_schedules TO anon;

-- Enable RLS on bus_schedules
ALTER TABLE public.bus_schedules ENABLE ROW LEVEL SECURITY;

-- Create policy for bus_schedules
CREATE POLICY "Anyone can view bus schedules"
    ON public.bus_schedules FOR SELECT
    USING (true);

-- Create bus_schedule_favorites table
CREATE TABLE IF NOT EXISTS public.bus_schedule_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES public.bus_schedules(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, schedule_id)
);

-- Grant permissions for bus_schedule_favorites
GRANT ALL ON public.bus_schedule_favorites TO postgres;
GRANT ALL ON public.bus_schedule_favorites TO service_role;
GRANT ALL ON public.bus_schedule_favorites TO authenticated;

-- Enable RLS on bus_schedule_favorites
ALTER TABLE public.bus_schedule_favorites ENABLE ROW LEVEL SECURITY;

-- Create policy for bus_schedule_favorites
CREATE POLICY "Users can manage their own favorites"
    ON public.bus_schedule_favorites
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Insert bus schedules BEFORE any other operations
DELETE FROM public.bus_schedules;

-- Add Nablus bus schedules
INSERT INTO public.bus_schedules (
    id,
    route_name,
    departure_location,
    arrival_location,
    departure_time,
    arrival_time,
    days_of_week,
    city,
    notes,
    schedule_type
) VALUES 
    (
        '123e4567-e89b-12d3-a456-426614174001',
        'نابلس - رحلة الذهاب الأولى',
        'نابلس',
        'الجامعة',
        '07:10',
        '08:10',
        ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        'nablus',
        NULL,
        'regular'
    ),
    (
        '123e4567-e89b-12d3-a456-426614174002',
        'نابلس - رحلة الذهاب الثانية',
        'نابلس',
        'الجامعة',
        '07:30',
        '08:30',
        ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        'nablus',
        NULL,
        'regular'
    ),
    (
        '123e4567-e89b-12d3-a456-426614174003',
        'نابلس - رحلة الذهاب الثالثة',
        'نابلس',
        'الجامعة',
        '09:00',
        '10:00',
        ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        'nablus',
        'احتمال وجود الباص',
        'flexible'
    ),
    (
        '123e4567-e89b-12d3-a456-426614174004',
        'نابلس - رحلة العودة الأولى',
        'الجامعة',
        'نابلس',
        '13:30',
        '14:30',
        ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        'nablus',
        NULL,
        'return'
    ),
    (
        '123e4567-e89b-12d3-a456-426614174005',
        'نابلس - رحلة العودة الثانية',
        'الجامعة',
        'نابلس',
        '15:10',
        '16:10',
        ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        'nablus',
        NULL,
        'return'
    ),
    (
        '123e4567-e89b-12d3-a456-426614174006',
        'نابلس - آخر رحلة',
        'الجامعة',
        'نابلس',
        '16:30',
        '17:30',
        ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        'nablus',
        'آخر رحلة',
        'last'
    );

-- Add Tulkarm bus schedules
INSERT INTO public.bus_schedules (
    id,
    route_name,
    departure_location,
    arrival_location,
    departure_time,
    arrival_time,
    days_of_week,
    city,
    notes,
    schedule_type
) VALUES 
    (
        '123e4567-e89b-12d3-a456-426614174007',
        'طولكرم - رحلة الذهاب',
        'طولكرم',
        'الجامعة',
        '07:00',
        '08:00',
        ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        'tulkarm',
        'رحلة الذهاب',
        'regular'
    ),
    (
        '123e4567-e89b-12d3-a456-426614174008',
        'طولكرم - رحلة العودة الأولى',
        'الجامعة',
        'طولكرم',
        '13:30',
        '14:30',
        ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        'tulkarm',
        'رحلة العودة',
        'return'
    ),
    (
        '123e4567-e89b-12d3-a456-426614174009',
        'طولكرم - رحلة العودة الثانية',
        'الجامعة',
        'طولكرم',
        '14:30',
        '15:30',
        ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        'tulkarm',
        'رحلة العودة',
        'return'
    ),
    (
        '123e4567-e89b-12d3-a456-426614174010',
        'طولكرم - رحلة العودة الثالثة',
        'الجامعة',
        'طولكرم',
        '15:30',
        '16:30',
        ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        'tulkarm',
        'رحلة العودة',
        'return'
    ),
    (
        '123e4567-e89b-12d3-a456-426614174011',
        'طولكرم - آخر رحلة',
        'الجامعة',
        'طولكرم',
        '16:30',
        '17:30',
        ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        'tulkarm',
        'آخر رحلة للعودة',
        'last'
    );

-- Add Jenin and Tubas bus schedules
INSERT INTO public.bus_schedules (
    id,
    route_name,
    departure_location,
    arrival_location,
    departure_time,
    arrival_time,
    days_of_week,
    city,
    notes,
    schedule_type
) VALUES 
    -- Jenin schedules
    (
        '123e4567-e89b-12d3-a456-426614174012',
        'جنين - أول رحلة',
        'جنين',
        'الجامعة',
        '07:45',
        '08:00',
        ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        'jenin',
        'أول رحلة',
        'regular'
    ),
    (
        '123e4567-e89b-12d3-a456-426614174013',
        'جنين - رحلة ثانية',
        'جنين',
        'الجامعة',
        '08:00',
        '08:15',
        ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        'jenin',
        NULL,
        'regular'
    ),
    (
        '123e4567-e89b-12d3-a456-426614174014',
        'جنين - رحلات متفرقة',
        'جنين',
        'الجامعة',
        '08:00',
        '12:30',
        ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        'jenin',
        'عدة رحلات حسب عدد الطلاب',
        'flexible'
    ),
    (
        '123e4567-e89b-12d3-a456-426614174015',
        'جنين - رحلة العودة',
        'الجامعة',
        'جنين',
        '17:00',
        '17:30',
        ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        'jenin',
        'آخر موعد للعودة - أحيانا تمتد حتى 05:30 مساءً',
        'last'
    ),
    -- Tubas schedules
    (
        '123e4567-e89b-12d3-a456-426614174016',
        'طوباس - رحلة الذهاب الأولى',
        'طوباس',
        'الجامعة',
        '08:00',
        '11:00',
        ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        'tubas',
        'رحلة الذهاب',
        'regular'
    ),
    (
        '123e4567-e89b-12d3-a456-426614174018',
        'طوباس - رحلات متفرقة',
        'طوباس',
        'الجامعة',
        '08:00 - 12:30',
        '12:30',
        ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        'tubas',
        'عدة رحلات حسب عدد الطلاب',
        'flexible'
    ),
    (
        '123e4567-e89b-12d3-a456-426614174017',
        'طوباس - آخر رحلة',
        'الجامعة',
        'طوباس',
        '16:30',
        '17:00',
        ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
        'tubas',
        'آخر موعد للعودة',
        'last'
    )
ON CONFLICT (id) DO UPDATE SET
    route_name = EXCLUDED.route_name,
    departure_location = EXCLUDED.departure_location,
    arrival_location = EXCLUDED.arrival_location,
    departure_time = EXCLUDED.departure_time,
    arrival_time = EXCLUDED.arrival_time,
    days_of_week = EXCLUDED.days_of_week,
    city = EXCLUDED.city,
    notes = EXCLUDED.notes,
    schedule_type = EXCLUDED.schedule_type;

-- Create indexes for bus schedules
CREATE INDEX IF NOT EXISTS idx_bus_schedules_city ON public.bus_schedules(city);
CREATE INDEX IF NOT EXISTS idx_bus_schedules_departure_time ON public.bus_schedules(departure_time);
CREATE INDEX IF NOT EXISTS idx_bus_schedules_schedule_type ON public.bus_schedules(schedule_type);
CREATE INDEX IF NOT EXISTS idx_bus_schedule_favorites_user ON public.bus_schedule_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_bus_schedule_favorites_schedule ON public.bus_schedule_favorites(schedule_id);

-- Restore backed up data
DO $$
BEGIN
    -- Restore profiles first (since other tables depend on it)
    INSERT INTO public.profiles 
    SELECT * FROM backup_profiles
    ON CONFLICT (id) DO UPDATE 
    SET 
        username = EXCLUDED.username,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url,
        gender = EXCLUDED.gender,
        college_id = EXCLUDED.college_id,
        language_preference = EXCLUDED.language_preference,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at,
        username_updated_at = EXCLUDED.username_updated_at,
        full_name_updated_at = EXCLUDED.full_name_updated_at;

    -- Restore notification preferences
    INSERT INTO public.notification_preferences 
    SELECT * FROM backup_notification_preferences
    ON CONFLICT (user_id) DO UPDATE 
    SET 
        ride_requests = EXCLUDED.ride_requests,
        ride_updates = EXCLUDED.ride_updates,
        ride_chat = EXCLUDED.ride_chat,
        bus_alerts = EXCLUDED.bus_alerts,
        food_orders = EXCLUDED.food_orders,
        study_alerts = EXCLUDED.study_alerts,
        social_events = EXCLUDED.social_events,
        system_alerts = EXCLUDED.system_alerts,
        push_enabled = EXCLUDED.push_enabled,
        transportation_notifications = EXCLUDED.transportation_notifications,
        academic_notifications = EXCLUDED.academic_notifications,
        service_notifications = EXCLUDED.service_notifications,
        quiet_hours_start = EXCLUDED.quiet_hours_start,
        quiet_hours_end = EXCLUDED.quiet_hours_end,
        notification_language = EXCLUDED.notification_language;

    -- Restore notifications
    INSERT INTO public.notifications 
    SELECT * FROM backup_notifications
    ON CONFLICT (id) DO NOTHING;

    -- Restore push tokens
    INSERT INTO public.push_tokens 
    SELECT * FROM backup_push_tokens
    ON CONFLICT (user_id, token) DO NOTHING;

    -- Restore rides
    INSERT INTO public.rides 
    SELECT * FROM backup_rides
    ON CONFLICT (id) DO NOTHING;

    -- Restore ride requests
    INSERT INTO public.ride_requests 
    SELECT * FROM backup_ride_requests
    ON CONFLICT (ride_id, passenger_id) DO NOTHING;

    -- Restore messages
    INSERT INTO public.messages 
    SELECT * FROM backup_messages
    ON CONFLICT (id) DO NOTHING;

    -- Restore bus schedule favorites
    INSERT INTO public.bus_schedule_favorites 
    SELECT * FROM backup_bus_schedule_favorites
    ON CONFLICT (user_id, schedule_id) DO NOTHING;

    -- Drop backup tables
    DROP TABLE IF EXISTS backup_profiles;
    DROP TABLE IF EXISTS backup_notifications;
    DROP TABLE IF EXISTS backup_notification_preferences;
    DROP TABLE IF EXISTS backup_push_tokens;
    DROP TABLE IF EXISTS backup_rides;
    DROP TABLE IF EXISTS backup_ride_requests;
    DROP TABLE IF EXISTS backup_messages;
    DROP TABLE IF EXISTS backup_bus_schedule_favorites;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error during restore: %', SQLERRM;
END $$;