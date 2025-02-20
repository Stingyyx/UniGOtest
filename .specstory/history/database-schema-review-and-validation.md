## SpecStory

## Database Schema Review and Validation (2/16/2025, 6:56:26 AM)

_**User**_

check if @20240329_complete_schema.sql matches our what we need for database and check our current files and folders and codes

---

_**Assistant**_

I'll analyze the SQL schema against the project requirements and documentation. Here's my assessment:

1. **Schema Alignment with Core Features ✓**
The schema effectively covers all major features:
- User profiles and authentication
- Ride sharing system
- Bus schedules and favorites
- Messaging system
- Notifications
- Location mapping

2. **Missing Tables/Features**
Based on the documentation, we need to add tables for:

````sql
-- Food ordering system
CREATE TABLE IF NOT EXISTS public.food_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    cafeteria_id UUID,
    order_details TEXT NOT NULL,
    special_instructions TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant listings
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    menu_url TEXT,
    is_campus BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant reviews
CREATE TABLE IF NOT EXISTS public.restaurant_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id),
    user_id UUID REFERENCES auth.users(id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study resources (book printing, used books)
CREATE TABLE IF NOT EXISTS public.print_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    file_url TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.used_books (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    gender_preference TEXT CHECK (gender_preference IN ('any', 'male', 'female')),
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lost and found
CREATE TABLE IF NOT EXISTS public.lost_found (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    item_type TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    location TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- University events and jobs
CREATE TABLE IF NOT EXISTS public.university_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    event_type TEXT CHECK (event_type IN ('academic', 'social', 'sports', 'other')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.job_postings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    job_type TEXT CHECK (job_type IN ('university', 'external', 'graduate')),
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
````

3. **Suggested Improvements**
- Add indexes for frequently queried fields
- Add RLS policies for new tables
- Add triggers for updated_at timestamps
- Add validation constraints for critical fields

4. **File Structure Check**
The current schema aligns with the project structure in the documentation:
```
UniWays/
├── supabase/
│   ├── migrations/
│   │   └── 20240329_complete_schema.sql
```

Would you like me to provide the complete RLS policies and additional indexes for the new tables, or would you prefer to focus on implementing specific features first?

---

_**User**_

give me a code to wipe all tables and delete all tables in sql editor

---

_**Assistant**_

Here's a SQL script to safely drop all tables from the database. This will completely wipe your database clean:

````sql
-- Disable row level security temporarily
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Disable RLS for all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;

-- Drop all triggers
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT DISTINCT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.' || quote_ident(r.event_object_table) || ' CASCADE;';
    END LOOP;
END $$;

-- Drop all functions
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT ns.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace ns ON ns.oid = p.pronamespace
        WHERE ns.nspname = 'public'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.args || ') CASCADE;';
    END LOOP;
END $$;

-- Drop all tables in the correct order
DROP TABLE IF EXISTS public.push_tokens CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.bus_route_favorites CASCADE;
DROP TABLE IF EXISTS public.bus_schedules CASCADE;
DROP TABLE IF EXISTS public.ride_requests CASCADE;
DROP TABLE IF EXISTS public.rides CASCADE;
DROP TABLE IF EXISTS public.map_locations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop all policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename) || ';';
    END LOOP;
END $$;

-- Drop all indexes (except primary key indexes)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname NOT LIKE '%_pkey'
    ) LOOP
        EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(r.schemaname) || '.' || quote_ident(r.indexname) || ' CASCADE;';
    END LOOP;
END $$;

-- Reset all sequences
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER SEQUENCE public.' || quote_ident(r.sequence_name) || ' RESTART WITH 1;';
    END LOOP;
END $$;

-- Vacuum the database to clean up space
VACUUM FULL;
````

This script will:
1. Disable Row Level Security
2. Drop all triggers
3. Drop all functions
4. Drop all tables in the correct order to handle dependencies
5. Drop all policies
6. Drop all custom indexes
7. Reset all sequences
8. Vacuum the database

⚠️ **WARNING**: This will permanently delete all data. Make sure you have a backup if needed before running this script.

After running this, your database will be completely clean and ready for a fresh schema implementation.

---

_**User**_

now check our files and folders for transport and each section and check if this @20240329_complete_schema.sql matches what we need in @context.md in future build

---

_**Assistant**_

I'll analyze the schema against the project requirements in context.md, focusing on each major section:

1. **Transportation Section Analysis**

Current Schema Coverage:
✓ Rides table (Wassilni feature)
✓ Ride requests
✓ Bus schedules
✓ Bus route favorites
✓ Map locations

Missing/Needed Updates:
````sql
-- Add location tracking for rides
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS
    current_location POINT,
    location_updated_at TIMESTAMPTZ;

-- Add route tracking
CREATE TABLE IF NOT EXISTS public.ride_routes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ride_id UUID REFERENCES public.rides(id),
    route_points POINT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add bus stop alerts
CREATE TABLE IF NOT EXISTS public.bus_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    schedule_id UUID REFERENCES public.bus_schedules(id),
    alert_time INTEGER, -- minutes before departure
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
````

2. **Food Section Analysis**

Currently Missing (Needs Creation):
````sql
-- Cafeterias and Restaurants
CREATE TABLE IF NOT EXISTS public.food_venues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('cafeteria', 'restaurant')),
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    menu_url TEXT,
    opening_hours JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food Orders
CREATE TABLE IF NOT EXISTS public.food_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    venue_id UUID REFERENCES public.food_venues(id),
    order_details JSONB NOT NULL,
    special_instructions TEXT,
    status TEXT CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
    preparation_time INTEGER, -- in minutes
    cancellation_deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venue Reviews
CREATE TABLE IF NOT EXISTS public.venue_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    venue_id UUID REFERENCES public.food_venues(id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blacklist for no-shows
CREATE TABLE IF NOT EXISTS public.order_blacklist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    reason TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
````

3. **Study Section Analysis**

Currently Missing (Needs Creation):
````sql
-- Print Orders
CREATE TABLE IF NOT EXISTS public.print_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    file_url TEXT NOT NULL,
    file_type TEXT CHECK (file_type IN ('pdf', 'ppt', 'doc')),
    copies INTEGER DEFAULT 1,
    status TEXT CHECK (status IN ('pending', 'processing', 'ready', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Used Books
CREATE TABLE IF NOT EXISTS public.used_books (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair')),
    gender_preference TEXT CHECK (gender_preference IN ('any', 'male', 'female')),
    status TEXT CHECK (status IN ('available', 'pending', 'sold')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exam Reminders
CREATE TABLE IF NOT EXISTS public.exam_reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    course_name TEXT NOT NULL,
    exam_date TIMESTAMPTZ NOT NULL,
    reminder_time INTEGER, -- minutes before exam
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lost and Found
CREATE TABLE IF NOT EXISTS public.lost_found (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    type TEXT CHECK (type IN ('lost', 'found')),
    item_name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    image_url TEXT,
    status TEXT CHECK (status IN ('active', 'resolved', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
````

4. **University News Section Analysis**

Currently Missing (Needs Creation):
````sql
-- University Events
CREATE TABLE IF NOT EXISTS public.university_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT CHECK (event_type IN ('academic', 'sports', 'social', 'other')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location TEXT,
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Postings
CREATE TABLE IF NOT EXISTS public.job_postings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    company TEXT,
    job_type TEXT CHECK (job_type IN ('university', 'external', 'graduate')),
    location TEXT,
    deadline TIMESTAMPTZ,
    contact_info JSONB,
    created_by UUID REFERENCES auth.users(id),
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
````

Would you like me to provide:
1. The complete SQL file with all these additions?
2. The RLS policies for the new tables?
3. Focus on implementing a specific section first?

Please let me know your preference for moving forward.

---

_**User**_

add them to the file

---

_**Assistant**_

I'll help you add these tables to the schema. Since you want to add them to the existing file, I'll provide the additions that should be placed in the appropriate sections of the schema. Here's how to integrate them:

````sql
-- ... existing code ...

-- Add location tracking

---

_**User**_

add them all what we are missing to @20240329_complete_schema.sql 

---

_**Assistant**_

I'll help add all the missing tables and modifications to the schema file. Let me organize them by sections and add them in a logical order. Would you like me to:

1. Provide a complete new version of the schema file with all additions
2. Or provide just the new additions to append to the existing file?

Also, should I include:
- All necessary indexes
- RLS policies
- Triggers for updated_at timestamps
- Foreign key constraints
- Validation checks

For each new table?

Please let me know your preference and I'll provide the appropriate SQL code.

---

_**User**_

add them with everything to the existing file with everything needed to prevent errors cause this sql i'm using rnb

---

_**Assistant**_



I'll add all the missing tables and their associated components to your existing schema file. I'll organize them by sections and ensure all dependencies are handled correctly.

Here's how to add them to your `20240329_complete_schema.sql` file. Add this after your last existing code:

````sql
-- Transportation Updates
-- Add location tracking for rides
ALTER TABLE public.rides 
ADD COLUMN IF NOT EXISTS current_location POINT,
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ;

-- Create ride routes tracking
CREATE TABLE IF NOT EXISTS public.ride_routes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE,
    route_points POINT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bus alerts
CREATE TABLE IF NOT EXISTS public.bus_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES public.bus_schedules(id) ON DELETE CASCADE,
    alert_time INTEGER, -- minutes before departure
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food Section Tables
-- Create food venues
CREATE TABLE IF NOT EXISTS public.food_venues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('cafeteria', 'restaurant')),
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    menu_url TEXT,
    opening_hours JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create food orders
CREATE TABLE IF NOT EXISTS public.food_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES public.food_venues(id) ON DELETE CASCADE,
    order_details JSONB NOT NULL,
    special_instructions TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
    preparation_time INTEGER, -- in minutes
    cancellation_deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create venue reviews
CREATE TABLE IF NOT EXISTS public.venue_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES public.food_venues(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order blacklist
CREATE TABLE IF NOT EXISTS public.order_blacklist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study Section Tables
-- Create print orders
CREATE TABLE IF NOT EXISTS public.print_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT CHECK (file_type IN ('pdf', 'ppt', 'doc')),
    copies INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create used books
CREATE TABLE IF NOT EXISTS public.used_books (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair')),
    gender_preference TEXT CHECK (gender_preference IN ('any', 'male', 'female')),
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'pending', 'sold')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exam reminders
CREATE TABLE IF NOT EXISTS public.exam_reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_name TEXT NOT NULL,
    exam_date TIMESTAMPTZ NOT NULL,
    reminder_time INTEGER, -- minutes before exam
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lost and found
CREATE TABLE IF NOT EXISTS public.lost_found (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('lost', 'found')),
    item_name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- University News Section Tables
-- Create university events
CREATE TABLE IF NOT EXISTS public.university_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT CHECK (event_type IN ('academic', 'sports', 'social', 'other')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location TEXT,
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job postings
CREATE TABLE IF NOT EXISTS public.job_postings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    company TEXT,
    job_type TEXT CHECK (job_type IN ('university', 'external', 'graduate')),
    location TEXT,
    deadline TIMESTAMPTZ,
    contact_info JSONB,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE public.ride_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.used_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_found ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_ride_routes_ride_id ON public.ride_routes(ride_id);
CREATE INDEX IF NOT EXISTS idx_bus_alerts_user ON public.bus_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_bus_alerts_schedule ON public.bus_alerts(schedule_id);
CREATE INDEX IF NOT EXISTS idx_food_orders_user ON public.food_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_food_orders_venue ON public.food_orders(venue_id);
CREATE INDEX IF NOT EXISTS idx_food_orders_status ON public.food_orders(status);
CREATE INDEX IF NOT EXISTS idx_venue_reviews_venue ON public.venue_reviews(venue_id);
CREATE INDEX IF NOT EXISTS idx_print_orders_user ON public.print_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_print_orders_status ON public.print_orders(status);
CREATE INDEX IF NOT EXISTS idx_used_books_seller ON public.used_books(seller_id);
CREATE INDEX IF NOT EXISTS idx_used_books_status ON public.used_books(status);
CREATE INDEX IF NOT EXISTS idx_exam_reminders_user ON public.exam_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_reminders_date ON public.exam_reminders(exam_date);
CREATE INDEX IF NOT EXISTS idx_lost_found_user ON public.lost_found(user_id);
CREATE INDEX IF NOT EXISTS idx_lost_found_status ON public.lost_found(status);
CREATE INDEX IF NOT EXISTS idx_university_events_date ON public.university_events(start_date);
CREATE INDEX IF NOT EXISTS idx_job_postings_deadline ON public.job_postings(deadline);

-- Create RLS policies for new tables
-- Ride routes policies
CREATE POLICY "Users can view ride routes" ON public.ride_routes FOR SELECT USING (true);
CREATE POLICY "Drivers can manage their ride routes" ON public.ride_routes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.rides WHERE id = ride_id AND driver_id = auth.uid())
);

-- Bus alerts policies
CREATE POLICY "Users can manage their bus alerts" ON public.bus_alerts FOR ALL USING (auth.uid() = user_id);

-- Food venues policies
CREATE POLICY "Anyone can view food venues" ON public.food_venues FOR SELECT USING (true);
CREATE POLICY "Only admins can manage food venues" ON public.food_venues FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
);

-- Food orders policies
CREATE POLICY "Users can view their own orders" ON public.food_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.food_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders" ON public.food_orders FOR UPDATE USING (auth.uid() = user_id);

-- Venue reviews policies
CREATE POLICY "Anyone can view reviews" ON public.venue_reviews FOR SELECT USING (true);
CREATE POLICY "Users can manage their own reviews" ON public.venue_reviews FOR ALL USING (auth.uid() = user_id);

-- Print orders policies
CREATE POLICY "Users can manage their print orders" ON public.print_orders FOR ALL USING (auth.uid() = user_id);

-- Used books policies
CREATE POLICY "Anyone can view used books" ON public.used_books FOR SELECT USING (true);
CREATE POLICY "Users can manage their book listings" ON public.used_books FOR ALL USING (auth.uid() = seller_id);

-- Exam reminders policies
CREATE POLICY "Users can manage their exam reminders" ON public.exam_reminders FOR ALL USING (auth.uid() = user_id);

-- Lost and found policies
CREATE POLICY "Anyone can view lost and found items" ON public.lost_found FOR SELECT USING (true);
CREATE POLICY "Users can manage their lost and found posts" ON public.lost_found FOR ALL USING (auth.uid() = user_id);

-- University events policies
CREATE POLICY "Anyone can view events" ON public.university_events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON public.university_events FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
);

-- Job postings policies
CREATE POLICY "Anyone can view job postings" ON public.job_postings FOR SELECT USING (true);
CREATE POLICY "Admins can manage job postings" ON public.job_postings FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
);

-- Add updated_at trigger for new tables
CREATE TRIGGER set_ride_routes_updated_at
    BEFORE UPDATE ON public.ride_routes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_bus_alerts_updated_at
    BEFORE UPDATE ON public.bus_alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_food_venues_updated_at
    BEFORE UPDATE ON public.food_venues
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_food_orders_updated_at
    BEFORE UPDATE ON public.food_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_print_orders_updated_at
    BEFORE UPDATE ON public.print_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_used_books_updated_at
    BEFORE UPDATE ON public.used_books
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_exam_reminders_updated_at
    BEFORE UPDATE ON public.exam_reminders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_lost_found_updated_at
    BEFORE UPDATE ON public.lost_found
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_university_events_updated_at
    BEFORE UPDATE ON public.university_events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_job_postings_updated_at
    BEFORE UPDATE ON public.job_postings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
````

This addition includes:
1. All missing tables with proper constraints
2. RLS policies for each table
3. Necessary indexes for performance
4. Updated_at triggers
5. Proper foreign key relationships
6. Validation checks

The tables are organized by section (Transportation, Food, Study, University News) and include all necessary security and performance features. You can append this to your existing schema file.

Would you like me to explain any specific part in more detail?

---

_**User**_

what

---

_**Assistant**_



---



---

