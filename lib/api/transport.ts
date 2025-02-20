import { supabase } from '../supabase';

export type Ride = {
  id: string;
  driver_id: string;
  pickup_location: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  gender: 'male' | 'female' | 'any';
  status: 'active' | 'full' | 'cancelled' | 'completed';
  price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  driver?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
};

export type RideRequest = {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  seats_requested: number;
  created_at: string;
  updated_at: string;
  passenger?: {
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
};

export type BusSchedule = {
  id: string;
  route_name: string;
  departure_location: string;
  arrival_location: string;
  departure_time: string;
  days_of_week: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BusScheduleFavorite = {
  id: string;
  user_id: string;
  schedule_id: string;
  created_at: string;
};

// Rides API
export async function createRide(ride: Omit<Ride, 'id' | 'created_at' | 'updated_at' | 'driver'>) {
  const { data, error } = await supabase
    .from('rides')
    .insert(ride)
    .select('*, driver:profiles(username, full_name, avatar_url)')
    .single();

  if (error) throw error;
  return data;
}

export async function getRides(filters?: {
  status?: Ride['status'];
  gender?: Ride['gender'];
  from_date?: string;
}) {
  let query = supabase
    .from('rides')
    .select('*, driver:profiles(username, full_name, avatar_url)')
    .order('departure_time', { ascending: true });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.gender) {
    query = query.eq('gender', filters.gender);
  }
  if (filters?.from_date) {
    query = query.gte('departure_time', filters.from_date);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getRideById(id: string) {
  const { data, error } = await supabase
    .from('rides')
    .select('*, driver:profiles(username, full_name, avatar_url)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateRide(id: string, updates: Partial<Ride>) {
  const { data, error } = await supabase
    .from('rides')
    .update(updates)
    .eq('id', id)
    .select('*, driver:profiles(username, full_name, avatar_url)')
    .single();

  if (error) throw error;
  return data;
}

// Ride Requests API
export async function createRideRequest(request: Omit<RideRequest, 'id' | 'created_at' | 'updated_at' | 'passenger'>) {
  const { data, error } = await supabase
    .from('ride_requests')
    .insert(request)
    .select('*, passenger:profiles(username, full_name, avatar_url)')
    .single();

  if (error) throw error;
  return data;
}

export async function getRideRequests(ride_id: string) {
  const { data, error } = await supabase
    .from('ride_requests')
    .select('*, passenger:profiles(username, full_name, avatar_url)')
    .eq('ride_id', ride_id)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function updateRideRequest(id: string, updates: Partial<RideRequest>) {
  const { data, error } = await supabase
    .from('ride_requests')
    .update(updates)
    .eq('id', id)
    .select('*, passenger:profiles(username, full_name, avatar_url)')
    .single();

  if (error) throw error;
  return data;
}

// Bus Schedules API
export async function getBusSchedules() {
  const { data, error } = await supabase
    .from('bus_schedules')
    .select('*')
    .eq('is_active', true)
    .order('departure_time', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getFavoriteBusSchedules(user_id: string) {
  const { data, error } = await supabase
    .from('bus_schedule_favorites')
    .select('*, schedule:bus_schedules(*)')
    .eq('user_id', user_id);

  if (error) throw error;
  return data;
}

export async function toggleBusScheduleFavorite(user_id: string, schedule_id: string) {
  // Check if favorite exists
  const { data: existing } = await supabase
    .from('bus_schedule_favorites')
    .select('id')
    .eq('user_id', user_id)
    .eq('schedule_id', schedule_id)
    .single();

  if (existing) {
    // Remove favorite
    const { error } = await supabase
      .from('bus_schedule_favorites')
      .delete()
      .eq('id', existing.id);

    if (error) throw error;
    return null;
  } else {
    // Add favorite
    const { data, error } = await supabase
      .from('bus_schedule_favorites')
      .insert({ user_id, schedule_id })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
} 