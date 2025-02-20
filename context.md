# UniWays Project Documentation

## Project Overview
UniWays is a comprehensive university transportation and services mobile application built with React Native and Expo, focusing on providing essential services for university students.

## Tech Stack

### Core Technologies
- React Native 0.76.7
- Expo SDK 52.0.33
- TypeScript
- React Native Paper (UI Components)
- Expo Router 4.0.17 (File-based Navigation)

### Backend Services
- Supabase (Database, Auth, Storage)
- Cloudinary (Media Storage)

### Development Tools
- i18n-js 4.5.1 (Localization)
- TypeScript
- ESLint & Prettier

## Detailed User Flow

### 1. Authentication Flow
#### Login Screen
- App logo "UniGO | يوني جو"
- Welcome back message
- Input fields:
  - Username/University ID
  - Password
- Additional options:
  - Create Account link
  - Forgot Password link
  - Login button
- Language toggle

#### Account Creation
- Full name input
- University ID number input
- Email address input
- Username input
- Password input
- Confirm password input
- Create Account button
- Email verification process
- Automatic login after verification

### 2. Main Screen
- Transportation section
- Food section
- Study section
- Personal section
- University News section (formerly Social Life)
- Notifications icon with counter
- Language toggle button (Arabic/English)

### 3. Transportation (المواصلات)
#### A. Wassilni (وصلني)
##### Create Trip
- Current location input
- Destination input
- Gender preference selection
- Available seats input
- Departure time selection
- Trip description (optional)

##### Available Trips
- Driver's full name
- University ID number
- Trip details display
- Join/Cancel options
- Real-time chat after joining
- Notification system for:
  - Join requests
  - Trip updates
  - Chat messages
- Trip cancellation option for owner

#### B. Bus Reminders (ذكرني بالباص)
- Bus schedules by city
- Timetable display
- Alert toggle for each route
- Notification preferences by city
- Real-time updates

#### C. Campus Map (خريطة الحرم)
- Zoomable campus map
- Key locations marked
- Interactive elements

### 4. Food (الطعام)
#### A. Pre-order System
- Cafeteria selection
- Order details:
  - Full name
  - Mobile number
  - University ID
  - Order description
  - Special instructions
- Restrictions:
  - 5-minute cancellation window
  - Order quantity limits
  - Blacklist system for no-shows
- Preparation time display
- Ready notification
- Order modification option

#### B. My Order
- Order tracking and status updates
- Complete order history
- Order details display
- Modification options:
  - Changes allowed within first 5 minutes only
  - No cancellation after 5-minute window
  - No modifications after 5-minute window
- Status indicators:
  - Pending
  - In preparation
  - Ready for pickup
  - Completed
  - Cancelled
- Order timestamps
- Payment status

#### C. Restaurants
- Nearby restaurants listing
- Complete menu display
- Location information

#### D. Ratings
- Anonymous/Non-anonymous options
- Restaurant reviews
- Cafeteria feedback

### 5. Study and Assistance (الدراسة)
#### A. Book Printing
- File upload (PDF/PowerPoint)
- Order details:
  - Name
  - Phone number
  - University ID
  - Description
- Status tracking
- Completion notification

#### B. Used Books
- Book listing system
- Gender preference option
- Real-time chat
- Notification system
- Request/Receive functionality

#### C. Exam Alerts
- Custom exam reminders
- Date/Time setting
- Notification system

#### D. Lost and Found
- Item posting system
- Details required:
  - Item description
  - Photo upload option
  - Loss date
  - Location
- Real-time chat
- Search functionality

### 6. Profile Section
- Personal information display
- Avatar upload/modification
- Restricted fields:
  - University ID (non-modifiable)
  - Full name (non-modifiable)
- Modifiable username

### 7. University News (formerly Social Life)
#### A. University Events
- Event listings:
  - Parties
  - Sports events
  - Academic events
- Admin-only posting

#### B. Available Jobs
- Job postings:
  - University positions
  - External opportunities
  - Graduate positions
- Admin-only posting

## Project Structure
```
project2/
├── app/                    # Application screens and navigation
│   ├── _layout.tsx        # Root layout configuration
│   ├── components/        # Screen-specific components
│   ├── types/            # Screen-specific types
│   ├── lib/              # Screen-specific utilities
│   ├── i18n/             # Screen-specific translations
│   ├── (auth)/           # Authentication screens
│   ├── (app)/            # Main app screens
│   │   ├── (transport)/  # Transportation features
│   │   ├── profile/      # User profile screens
│   │   └── ...          
│   ├── index.tsx         # Entry point
│   └── +not-found.tsx    # 404 page
├── assets/                # Static assets and images
├── components/            # Global reusable components
├── lib/                   # Core functionality
│   ├── api/              # API utilities
│   ├── auth/             # Authentication logic
│   ├── constants/        # Global constants
│   ├── context/          # React Context providers
│   ├── i18n/             # Localization
│   ├── notifications/    # Push notifications
│   ├── storage/          # File storage utilities
│   └── supabase.ts       # Supabase client configuration
├── scripts/              # Build and utility scripts
├── supabase/             # Database migrations and schema
├── types/                # Global TypeScript definitions
├── .env                  # Environment variables
├── app.json              # Expo configuration
├── babel.config.js       # Babel configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Core Features

### 1. Transportation (وصلني)
- Ride sharing system
- Real-time ride tracking
- Gender preference matching
- Chat functionality
- Location verification

### 2. Bus System (ذكرني بالباص)
- Bus schedule viewing
- Route notifications
- Favorite routes
- Real-time updates

### 3. Food 
- **Order Food (اطلب):**  
  Allow users to place food orders electronically from the campus cafeteria via a digital menu.
- **Restaurants (مطاعم):**  
  Display a list of nearby restaurants with menus and current offers.
- **User Feedback (رأيك):**  
  Enable users to rate and review university cafeterias and restaurants that added or nearby the college.

### 4. User Management
- Profile management
- College ID verification
- Avatar handling
- Gender preferences

## Database Structure

### Authentication Tables (Managed by Supabase Auth)
- `auth.users`: Managed by Supabase Auth
  ```sql
  - id: UUID (Primary Key)
  - email: String
  - encrypted_password: String
  - email_confirmed_at: Timestamp
  - raw_user_meta_data: JSON
  - created_at: Timestamp
  - updated_at: Timestamp
  ```

### Core Tables

#### 1. profiles
```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    username TEXT UNIQUE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    college_id TEXT,
    language_preference TEXT DEFAULT 'ar',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    username_updated_at TIMESTAMPTZ DEFAULT NOW(),
    full_name_updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINTS:
    - username_length: minimum 3 characters
    - valid_gender: must be 'male', 'female', or 'other'
    - valid_college_id: must be 8-10 digits starting with '202'
)
```

#### 2. notification_preferences
```sql
CREATE TABLE public.notification_preferences (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
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
    notification_language TEXT DEFAULT 'ar',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

#### 3. notifications
```sql
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINTS:
    - type must be one of:
      'ride_request', 'ride_accepted', 'ride_rejected',
      'ride_cancelled', 'bus_reminder', 'chat_message', 'system'
)
```

#### 4. push_tokens
```sql
CREATE TABLE public.push_tokens (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    token TEXT NOT NULL,
    device_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, token)
)
```

### Transportation Tables

#### 1. rides
```sql
CREATE TABLE public.rides (
    id UUID PRIMARY KEY,
    driver_id UUID REFERENCES profiles(id),
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    total_seats INTEGER DEFAULT 4,
    available_seats INTEGER CHECK (available_seats > 0),
    gender_preference TEXT CHECK (gender_preference IN ('any', 'male', 'female')),
    status TEXT DEFAULT 'active',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINTS:
    - status must be: 'active', 'full', 'cancelled', 'completed', 'ready'
)
```

#### 2. ride_requests
```sql
CREATE TABLE public.ride_requests (
    id UUID PRIMARY KEY,
    ride_id UUID REFERENCES rides(id),
    passenger_id UUID REFERENCES profiles(id),
    status TEXT DEFAULT 'pending',
    message TEXT,
    seats_requested INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ride_id, passenger_id),
    CONSTRAINTS:
    - status must be: 'pending', 'accepted', 'rejected', 'cancelled'
)
```

#### 3. messages (Ride Chat)
```sql
CREATE TABLE public.messages (
    id UUID PRIMARY KEY,
    ride_id UUID REFERENCES rides(id),
    sender_id UUID REFERENCES profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

#### 4. bus_schedules
```sql
CREATE TABLE public.bus_schedules (
    id UUID PRIMARY KEY,
    route_name TEXT NOT NULL,
    departure_location TEXT NOT NULL,
    arrival_location TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    days_of_week TEXT[] NOT NULL,
    city TEXT NOT NULL,
    notes TEXT,
    schedule_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINTS:
    - schedule_type must be: 'regular', 'flexible', 'continuous', 'last', 'return'
)
```

#### 5. bus_schedule_favorites
```sql
CREATE TABLE public.bus_schedule_favorites (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    schedule_id UUID REFERENCES bus_schedules(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, schedule_id)
)
```

### Database Functions

#### 1. handle_new_user()
- Triggered after new user creation in auth.users
- Creates profile record
- Creates notification preferences
- Sets default language preference

#### 2. validate_ride_request()
- Validates ride requests before insertion
- Checks seat availability
- Validates gender preferences
- Prevents duplicate requests

#### 3. handle_ride_update()
- Updates available seats when requests are accepted/rejected
- Updates ride status when full
- Manages ride state transitions

#### 4. handle_notification_update()
- Updates notification timestamps
- Manages notification state changes

### Row Level Security (RLS) Policies

#### Profiles
- View: Everyone
- Insert: Authenticated user (own profile)
- Update: Own profile only
- Delete: Own profile only

#### Rides
- View: Everyone
- Insert: Authenticated users
- Update: Own rides only
- Delete: Own rides only

#### Messages
- View: Ride participants only
- Insert: Ride participants only
- Update: Own messages only
- Delete: Own messages only

#### Notifications
- View: Own notifications only
- Update: Own notifications only
- Delete: Own notifications only

### Indexes
```sql
-- Profiles
CREATE INDEX idx_profiles_college_id ON public.profiles(college_id);

-- Notifications
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id) WHERE read = false;
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Push Tokens
CREATE INDEX idx_push_tokens_user ON public.push_tokens(user_id);
CREATE INDEX idx_push_tokens_token ON public.push_tokens(token);

-- Messages
CREATE INDEX idx_messages_ride_created ON public.messages(ride_id, created_at DESC);
CREATE INDEX idx_messages_ride ON public.messages(ride_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Rides
CREATE INDEX idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX idx_rides_status ON public.rides(status);
CREATE INDEX idx_rides_departure_time ON public.rides(departure_time);

-- Ride Requests
CREATE INDEX idx_ride_requests_ride ON public.ride_requests(ride_id);
CREATE INDEX idx_ride_requests_passenger ON public.ride_requests(passenger_id);
CREATE INDEX idx_ride_requests_status ON public.ride_requests(status);

-- Bus Schedules
CREATE INDEX idx_bus_schedules_city ON public.bus_schedules(city);
CREATE INDEX idx_bus_schedules_departure_time ON public.bus_schedules(departure_time);
CREATE INDEX idx_bus_schedules_schedule_type ON public.bus_schedules(schedule_type);

-- Bus Schedule Favorites
CREATE INDEX idx_bus_schedule_favorites_user ON public.bus_schedule_favorites(user_id);
CREATE INDEX idx_bus_schedule_favorites_schedule ON public.bus_schedule_favorites(schedule_id);
```

## Notification System

### 1. Push Notifications
- Real-time delivery
- Customizable preferences
- Multi-language support
- Offline queuing
- Token management

### 2. Notification Types
#### Transportation
- Ride request notifications
- Request acceptance/rejection
- Ride updates and changes
- Bus schedule reminders
- Route changes and delays

#### Academic
- Exam reminders
- Assignment deadlines
- Course announcements
- Study group updates

#### Services
- Food order status
- Printing job completion
- Book request updates
- Lost and found matches

### 3. Notification Preferences
- Per-category toggles
- Time-based settings
- Priority levels
- Delivery methods

### 4. Technical Implementation
- Token management
- Delivery confirmation
- Error handling
- Retry mechanisms
- Database structure:
  - notifications table
  - notification_preferences table
  - push_tokens table

### 5. User Experience
- Badge counts
- In-app notification center
- Read/unread status
- Action buttons
- Rich notifications
- Deep linking

### 6. Security & Privacy
- Permission management
- Sensitive data handling
- Token encryption
- Access control
- Data retention policy

## Development Guidelines

### 1. Code Organization
- Use functional React components
- Implement proper TypeScript types
- Follow file-based routing conventions
- Maintain consistent file structure

### 2. UI/UX Standards
- Support RTL layout
- Implement bilingual support (Arabic/English)
- Follow accessibility guidelines
- Maintain consistent styling

### 3. Performance Requirements
- Offline functionality
- Efficient data caching
- Optimized image loading
- Real-time updates

### 4. Security Measures
- Proper authentication flow
- Secure data storage
- Input validation
- Error handling

## Implementation Status

### Completed Features (✓)
- Authentication system
- Profile management
- Ride sharing basics
- Real-time chat
- Push notifications
- Multilingual support
- File-based navigation

### In Progress (~)
- Location verification
- Bus alerts system
- Campus map integration

## Testing Requirements

### User Scenarios
- First-time user flow
- Regular user interactions
- Error cases
- Offline scenarios

### Platform Testing
- iOS testing
- Android testing
- Different screen sizes
- Network conditions

## Maintenance Guidelines

### 1. Code Quality
- Regular dependency updates
- Performance monitoring
- Error tracking
- Code documentation

### 2. Database Management
- Regular backups
- Index optimization
- Query performance
- Data cleanup

### 3. User Support
- Error messaging
- Help documentation
- User feedback
- Bug reporting

## Deployment Process

### 1. Development
- Local testing
- Code review
- TypeScript checks
- Linting

### 2. Staging
- Integration testing
- Performance testing
- User acceptance

### 3. Production
- Version management
- Release notes
- Monitoring
- Backup procedures 