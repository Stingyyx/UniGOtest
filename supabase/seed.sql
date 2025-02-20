-- Enable RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.rides enable row level security;
alter table public.bus_schedules enable row level security;
alter table public.bus_schedule_favorites enable row level security;

-- Create profiles table
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text,
    email text,
    avatar_url text,
    gender text check (gender in ('male', 'female', 'other')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create rides table
create table public.rides (
    id uuid default uuid_generate_v4() primary key,
    driver_id uuid references public.profiles(id) on delete cascade,
    from_location text not null,
    to_location text not null,
    departure_time timestamptz not null,
    available_seats integer not null check (available_seats >= 0),
    gender_preference text check (gender_preference in ('male', 'female', 'any')),
    status text check (status in ('active', 'cancelled', 'completed')) default 'active',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create bus_schedules table
create table public.bus_schedules (
    id uuid default uuid_generate_v4() primary key,
    route_name text not null,
    departure_time time not null,
    arrival_time time not null,
    stops jsonb not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create bus_schedule_favorites table
create table public.bus_schedule_favorites (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade,
    schedule_id uuid references public.bus_schedules(id) on delete cascade,
    created_at timestamptz default now(),
    unique(user_id, schedule_id)
);

-- Insert sample bus schedules
insert into public.bus_schedules (route_name, departure_time, arrival_time, stops) values
('Campus Express', '07:30', '08:30', '[
    {"name": "Main Gate", "time": "07:30"},
    {"name": "Library", "time": "07:45"},
    {"name": "Engineering Building", "time": "08:00"},
    {"name": "Student Center", "time": "08:15"},
    {"name": "Sports Complex", "time": "08:30"}
]'::jsonb),
('Night Route', '22:00', '23:00', '[
    {"name": "Student Center", "time": "22:00"},
    {"name": "Library", "time": "22:15"},
    {"name": "Engineering Building", "time": "22:30"},
    {"name": "Main Gate", "time": "22:45"},
    {"name": "Dormitories", "time": "23:00"}
]'::jsonb);

-- Create policies
create policy "Public profiles are viewable by everyone"
on public.profiles for select
using (true);

create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);

-- Rides policies
create policy "Rides are viewable by everyone"
on public.rides for select
using (true);

create policy "Authenticated users can create rides"
on public.rides for insert
with check (auth.role() = 'authenticated');

create policy "Users can update own rides"
on public.rides for update
using (auth.uid() = driver_id);

-- Bus schedules policies
create policy "Bus schedules are viewable by everyone"
on public.bus_schedules for select
using (true);

create policy "Only authenticated users can favorite bus schedules"
on public.bus_schedule_favorites for insert
with check (auth.role() = 'authenticated');

create policy "Users can view their favorites"
on public.bus_schedule_favorites for select
using (auth.uid() = user_id);

create policy "Users can delete their favorites"
on public.bus_schedule_favorites for delete
using (auth.uid() = user_id);

-- Insert sample profiles (after creating a user through authentication)
-- Note: Replace 'user-uuid-here' with an actual user ID from your auth.users table
-- INSERT INTO public.profiles (id, full_name, gender)
-- VALUES ('user-uuid-here', 'Test User', 'other'); 