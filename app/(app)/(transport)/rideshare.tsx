import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Pressable, KeyboardAvoidingView, Platform, Alert, FlatList, RefreshControl } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator, Portal, Dialog, Card, Avatar } from 'react-native-paper';
import { Link, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../../../lib/i18n/LanguageContext';
import { useAuth } from '../../../lib/auth/AuthContext';
import { supabase } from '../../../lib/supabase';
import { DefaultAvatar } from '../../../assets';
import { RealtimeChannel, User } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import BackButton from '../../../components/common/BackButton';

type RideRequest = {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  passenger?: {
    full_name: string;
    avatar_url: string | null;
  };
};

type Ride = {
  id: string;
  driver_id: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  available_seats: number;
  total_seats: number;
  gender_preference: 'any' | 'male' | 'female';
  status: 'active' | 'full' | 'cancelled' | 'completed' | 'ready';
  description: string | null;
  driver: {
    full_name: string;
    avatar_url: string | null;
    college_id: string | null;
  };
  requests?: RideRequest[];
};

type RideData = {
  driver_id: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  available_seats: number;
  gender_preference: 'any' | 'male' | 'female';
  status: string;
  description?: string;
};

type Profile = {
  id: string;
  full_name: string;
  username: string;
  gender: 'male' | 'female' | 'other';
  college_id: string;
  avatar_url?: string | null;
};

type AuthUser = User & {
  profile: Profile;
};

export default function RideshareScreen() {
  const router = useRouter();
  const { user } = useAuth() as { user: AuthUser | null };
  const { language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('create');
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSeatsDialog, setShowSeatsDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    gender: 'any' as 'any' | 'male' | 'female',
    currentLocation: '',
    destination: '',
    seats: '',
    description: '',
    collegeId: ''
  });
  const [subscribed, setSubscribed] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRides();
    setupRealtime();
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const setupRealtime = () => {
    try {
      const newChannel = supabase
        .channel('public:rides')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rides'
          },
          (payload) => {
            console.log('[Cursor] Realtime update:', payload);
            
            if (payload.eventType === 'UPDATE') {
              const updatedRide = payload.new as Ride;
              
              // Handle different status updates
              switch (updatedRide.status) {
                case 'cancelled':
                  // Remove cancelled rides immediately
                  setRides(prev => prev.filter(ride => ride.id !== updatedRide.id));
                  // Show alert if user is involved
                  if (user && (updatedRide.driver_id === user.id || updatedRide.requests?.some(req => req.passenger_id === user.id))) {
                    Alert.alert('تنبيه', 'تم إلغاء الرحلة');
                  }
                  break;
                
                case 'full':
                  // Update ride status and show alert to driver
                  setRides(prev => prev.map(ride => 
                    ride.id === updatedRide.id ? { ...ride, status: 'full', available_seats: 0 } : ride
                  ));
                  if (user && updatedRide.driver_id === user.id) {
                    Alert.alert('تنبيه', 'تم اكتمال عدد المقاعد في رحلتك');
                  }
                  break;
                
                case 'completed':
                  // Remove completed rides
                  setRides(prev => prev.filter(ride => ride.id !== updatedRide.id));
                  break;
                
                default:
                  // Update ride details for other status changes
                  setRides(prev => prev.map(ride => 
                    ride.id === updatedRide.id ? { ...ride, ...updatedRide } : ride
                  ));
              }
            } else if (payload.eventType === 'INSERT' && payload.new.status === 'active') {
              // Add new active rides
              loadRides();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ride_requests'
          },
          async (payload) => {
            if (!user) return;
            
            const request = payload.new as RideRequest;
            
            // Only handle requests for rides we're showing
            const ride = rides.find(r => r.id === request.ride_id);
            if (!ride) return;
            
            if (payload.eventType === 'INSERT') {
              // Update available seats for new requests
              if (request.status === 'accepted') {
                setRides(prev => prev.map(r => 
                  r.id === request.ride_id 
                    ? { ...r, available_seats: r.available_seats - 1 } 
                    : r
                ));
              }
            } else if (payload.eventType === 'UPDATE') {
              // Handle request status changes
              const oldRequest = payload.old as RideRequest;
              
              if (oldRequest.status !== request.status) {
                if (request.status === 'accepted') {
                  // Update available seats when request is accepted
                  setRides(prev => prev.map(r => 
                    r.id === request.ride_id 
                      ? { ...r, available_seats: r.available_seats - 1 } 
                      : r
                  ));
                  
                  // Show notification to accepted passenger
                  if (request.passenger_id === user.id) {
                    Alert.alert('تهانينا', 'تم قبول طلب انضمامك إلى الرحلة');
                  }
                } else if (oldRequest.status === 'accepted' && 
                          (request.status === 'rejected' || request.status === 'cancelled')) {
                  // Restore available seats when accepted request is cancelled/rejected
                  setRides(prev => prev.map(r => 
                    r.id === request.ride_id 
                      ? { ...r, available_seats: r.available_seats + 1 } 
                      : r
                  ));
                }
              }
            }
          }
        )
        .subscribe();

      setChannel(newChannel);
      setSubscribed(true);
    } catch (error) {
      console.error('[Cursor] Error setting up realtime:', error);
    }
  };

  const loadRides = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:profiles(
            full_name,
            avatar_url,
            college_id
          ),
          requests:ride_requests(*)
        `)
        .neq('status', 'cancelled') // Don't load cancelled rides
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Cursor] Error loading rides:', error);
        Alert.alert('خطأ', 'فشل تحميل الرحلات. الرجاء المحاولة مرة أخرى.');
        return;
      }

      setRides(data || []);
    } catch (error) {
      console.error('[Cursor] Error in loadRides:', error);
      Alert.alert('خطأ', 'فشل تحميل الرحلات. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('يجب تسجيل الدخول لإنشاء رحلة');
      return;
    }

    if (!formData.currentLocation || !formData.destination || !formData.seats) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (formData.collegeId && !/^[0-9]{8,10}$/.test(formData.collegeId)) {
      setError('رقم الطالب الجامعي غير صالح');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);

      // Check if user already has an active ride
      const { data: existingRides, error: checkError } = await supabase
        .from('rides')
        .select('id, status')
        .eq('driver_id', user.id)
        .in('status', ['active', 'full'])
        .limit(1);

      if (checkError) throw checkError;

      if (existingRides && existingRides.length > 0) {
        setError('لا يمكنك إنشاء رحلة جديدة حتى تكتمل أو تلغي رحلتك الحالية');
        return;
      }

      // Update profile with college ID if provided
      if (formData.collegeId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ college_id: formData.collegeId })
          .eq('id', user.id);

        if (profileError) throw profileError;
      }
      
      const rideData: RideData = {
        driver_id: user.id,
        from_location: formData.currentLocation.trim(),
        to_location: formData.destination.trim(),
        departure_time: new Date().toISOString(),
        available_seats: parseInt(formData.seats),
        gender_preference: formData.gender,
        status: 'active'
      };

      if (formData.description.trim()) {
        rideData.description = formData.description.trim();
      }

      const { data, error } = await supabase
        .from('rides')
        .insert([rideData])
        .select()
        .single();

      if (error) throw error;
      
      Alert.alert('تم', 'تم إنشاء الرحلة بنجاح', [
        {
          text: 'موافق',
          onPress: () => {
            setFormData({
              gender: 'any',
              currentLocation: '',
              destination: '',
              seats: '',
              description: '',
              collegeId: ''
            });
            setActiveTab('available');
            loadRides();
          }
        }
      ]);
    } catch (error) {
      console.error('[Cursor] Error creating ride:', error);
      setError('حدث خطأ أثناء إنشاء الرحلة');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinRide = async (rideId: string) => {
    if (!user) {
      Alert.alert('تنبيه', 'يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      // Get ride details first
      const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();

      if (rideError) throw rideError;

      // Check if ride exists
      if (!ride) {
        Alert.alert('خطأ', 'الرحلة غير موجودة');
        return;
      }

      // Don't allow creator to join their own ride
      if (ride.driver_id === user.id) {
        Alert.alert('تنبيه', 'لا يمكنك الانضمام إلى رحلتك الخاصة');
        return;
      }

      // Check if user already has a request
      const { data: existingRequest, error: checkError } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('ride_id', rideId)
        .eq('passenger_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingRequest) {
        switch (existingRequest.status) {
          case 'pending':
            Alert.alert('تنبيه', 'لديك طلب انضمام معلق لهذه الرحلة');
            break;
          case 'accepted':
            Alert.alert('تنبيه', 'أنت بالفعل مشترك في هذه الرحلة');
            break;
          case 'rejected':
            Alert.alert('تنبيه', 'تم رفض طلبك للانضمام إلى هذه الرحلة');
            break;
        }
        router.push(`/(app)/(transport)/ride/${rideId}`);
        return;
      }

      // Create new request
      const { error: requestError } = await supabase
        .from('ride_requests')
        .insert([
          {
            ride_id: rideId,
            passenger_id: user.id,
            status: 'pending'
          }
        ]);

      if (requestError) throw requestError;

      // Send notification to driver
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: ride.driver_id,
            type: 'ride_request',
            title: 'طلب انضمام جديد',
            message: `${user.profile?.full_name || 'مستخدم جديد'} يريد الانضمام إلى رحلتك`,
            metadata: { 
              ride_id: rideId,
              passenger_id: user.id,
              passenger_name: user.profile?.full_name || 'مستخدم جديد'
            }
          }
        ]);

      if (notificationError) throw notificationError;

      Alert.alert('تم', 'تم إرسال طلب الانضمام بنجاح');
      router.push(`/(app)/(transport)/ride/${rideId}`);

    } catch (error: any) {
      console.error('Error joining ride:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء الانضمام إلى الرحلة');
    }
  };

  const handleCancelRide = async (rideId: string) => {
    if (!user) return;

    Alert.alert(
      'تأكيد الإلغاء',
      'هل أنت متأكد من إلغاء الرحلة؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel'
        },
        {
          text: 'تأكيد',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get ride details with accepted requests
              const { data: ride, error: rideError } = await supabase
                .from('rides')
                .select(`
                  *,
                  requests:ride_requests(
                    passenger_id,
                    status
                  )
                `)
                .eq('id', rideId)
                .single();

              if (rideError) throw rideError;

              // Update ride status
              const { error: updateError } = await supabase
                .from('rides')
                .update({ status: 'cancelled' })
                .eq('id', rideId)
                .eq('driver_id', user.id);

              if (updateError) throw updateError;

              // Notify accepted passengers
              const acceptedPassengers = ride.requests
                ?.filter((req: RideRequest) => req.status === 'accepted')
                .map((req: RideRequest) => req.passenger_id) || [];

              if (acceptedPassengers.length > 0) {
                await supabase
                  .from('notifications')
                  .insert(acceptedPassengers.map((passengerId: string) => ({
                    user_id: passengerId,
                    type: 'ride_cancelled',
                    title: 'تم إلغاء الرحلة',
                    message: 'تم إلغاء الرحلة من قبل السائق',
                    data: { ride_id: rideId }
                  })));
              }

              loadRides();
            } catch (error) {
              console.error('Error cancelling ride:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء إلغاء الرحلة');
            }
          }
        }
      ]
    );
  };

  const handleChatRide = async (rideId: string) => {
    if (!user) {
      Alert.alert('تنبيه', 'يجب تسجيل الدخول للدردشة');
      return;
    }

    try {
      // Check if user is the driver or has an accepted request
      const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select(`
          *,
          requests:ride_requests(*)
        `)
        .eq('id', rideId)
        .single();

      if (rideError) throw rideError;

      const isDriver = ride.driver_id === user.id;
      const isAcceptedPassenger = ride.requests?.some(
        (req: RideRequest) => req.passenger_id === user.id && req.status === 'accepted'
      );

      if (!isDriver && !isAcceptedPassenger) {
        Alert.alert('تنبيه', 'يجب قبول طلبك للانضمام قبل بدء الدردشة');
        return;
      }

      router.push(`/(app)/(transport)/chat/${rideId}`);
    } catch (error) {
      console.error('Error accessing chat:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء الوصول إلى الدردشة');
    }
  };

  const handleRequestAction = async (request: RideRequest, action: 'accept' | 'reject') => {
    try {
      const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('*')
        .eq('id', request.ride_id)
        .single();

      if (rideError || !ride) {
        Alert.alert('خطأ', 'حدث خطأ أثناء تحديث حالة الطلب');
        return;
      }

      const { error: updateError } = await supabase
        .from('ride_requests')
        .update({ status: action })
        .eq('id', request.id);

      if (updateError) {
        Alert.alert('خطأ', 'حدث خطأ أثناء تحديث حالة الطلب');
        return;
      }

      // Update available seats if accepting
      if (action === 'accept') {
        const { error: seatsError } = await supabase
          .from('rides')
          .update({ 
            available_seats: ride.available_seats - 1,
            status: ride.available_seats <= 1 ? 'full' : 'active'
          })
          .eq('id', request.ride_id);

        if (seatsError) {
          Alert.alert('خطأ', 'حدث خطأ أثناء تحديث المقاعد المتاحة');
          return;
        }
      }

      // Refresh the rides list
      loadRides();

    } catch (error) {
      console.error('Error handling request action:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث حالة الطلب');
    }
  };

  const RideActions = ({ ride, isCreator }: { ride: Ride; isCreator: boolean }) => {
    const [hasRequest, setHasRequest] = useState(false);
    const [requestStatus, setRequestStatus] = useState<string | null>(null);
    const pendingRequests = ride.requests?.filter(req => req.status === 'pending') || [];

    useEffect(() => {
      if (!user || !ride.requests) return;

      const userRequest = ride.requests.find((req: RideRequest) => req.passenger_id === user.id);
      setHasRequest(!!userRequest);
      setRequestStatus(userRequest?.status || null);
    }, [ride.requests, user]);

    const handleCancelRide = async () => {
      Alert.alert(
        'تأكيد الإلغاء',
        'هل أنت متأكد من إلغاء الرحلة؟',
        [
          {
            text: 'إلغاء',
            style: 'cancel'
          },
          {
            text: 'تأكيد',
            style: 'destructive',
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from('rides')
                  .update({ status: 'cancelled' })
                  .eq('id', ride.id)
                  .eq('driver_id', user?.id);

                if (error) throw error;

                loadRides();
              } catch (error) {
                console.error('Error cancelling ride:', error);
                Alert.alert('خطأ', 'حدث خطأ أثناء إلغاء الرحلة');
              }
            }
          }
        ]
      );
    };

    if (isCreator) {
      return (
        <View style={styles.creatorActions}>
          <TouchableOpacity 
            style={[styles.button, styles.requestsButton]}
            onPress={() => router.push(`/(app)/(transport)/ride/${ride.id}`)}
          >
            <MaterialCommunityIcons name="account-multiple" size={20} color="#000" />
            <Text style={[styles.buttonText]}>الطلبات</Text>
            {pendingRequests.length > 0 && (
              <View style={styles.requestsBadge}>
                <Text style={styles.requestsBadgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancelRide}
          >
            <MaterialCommunityIcons name="close" size={20} color="#FF3B30" />
            <Text style={[styles.buttonText, styles.cancelText]}>إلغاء الرحلة</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Show different buttons based on request status
    if (hasRequest) {
      return (
        <View style={styles.buttonContainer}>
          {requestStatus === 'accepted' && (
            <TouchableOpacity 
              style={[styles.button, styles.chatButton]}
              onPress={() => handleChatRide(ride.id)}
            >
              <MaterialCommunityIcons name="chat" size={20} color="#000" />
              <Text style={styles.buttonText}>دردشة</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.button, styles.joinButton]}
            onPress={() => handleJoinRide(ride.id)}
          >
            <MaterialCommunityIcons 
              name={requestStatus === 'accepted' ? 'check' : 'clock-outline'} 
              size={20} 
              color="#fff" 
            />
            <Text style={[styles.buttonText, styles.joinText]}>
              {requestStatus === 'accepted' ? 'تم القبول' : 'قيد الانتظار'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.joinButton]}
          onPress={() => handleJoinRide(ride.id)}
        >
          <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
          <Text style={[styles.buttonText, styles.joinText]}>انضمام</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRequestBadge = (ride: Ride) => {
    if (!ride.requests) return null;
    
    const pendingCount = ride.requests.filter(req => req.status === 'pending').length;
    const acceptedCount = ride.requests.filter(req => req.status === 'accepted').length;
    
    if (pendingCount === 0 && acceptedCount === 0) return null;

    return (
      <View style={styles.requestBadgeContainer}>
        {pendingCount > 0 && (
          <View style={styles.badge}>
            <MaterialCommunityIcons name="account-clock" size={16} color="#FF9500" />
            <Text style={styles.badgeText}>{pendingCount} طلب جديد</Text>
          </View>
        )}
        {acceptedCount > 0 && (
          <View style={styles.badge}>
            <MaterialCommunityIcons name="account-check" size={16} color="#34C759" />
            <Text style={styles.badgeText}>{acceptedCount} راكب</Text>
          </View>
        )}
      </View>
    );
  };

  const renderRideCard = (ride: Ride) => {
    const isCreator = ride.driver_id === user?.id;
    const pendingRequests = ride.requests?.filter(req => req.status === 'pending') || [];

    return (
      <Card style={styles.rideCard} onPress={() => router.push(`/(app)/(transport)/ride/${ride.id}`)}>
        <Card.Content>
          <View style={styles.driverInfo}>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{ride.driver.full_name}</Text>
              <Text style={styles.collegeId}>#{ride.driver.college_id}</Text>
            </View>
          </View>

          <View style={styles.rideDetails}>
            <View style={styles.locationContainer}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
              <Text style={styles.location}>{ride.from_location}</Text>
            </View>
            <View style={styles.locationContainer}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color="#666" />
              <Text style={styles.location}>{ride.to_location}</Text>
            </View>
          </View>

          <View style={styles.rideInfo}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                {new Date(ride.departure_time).toLocaleTimeString('ar-SA', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="seat" size={20} color="#666" />
              <Text style={styles.infoText}>
                {ride.available_seats}/{ride.total_seats}
              </Text>
            </View>
          </View>

          {/* Pending Requests Section */}
          {isCreator && pendingRequests.length > 0 && (
            <View style={styles.pendingRequestsContainer}>
              {pendingRequests.map((request) => (
                <View key={request.id} style={styles.pendingRequest}>
                  <View style={styles.requestUserInfo}>
                    <MaterialCommunityIcons name="account" size={20} color="#666" />
                    <Text style={styles.requestUserName}>
                      {request.passenger?.full_name || 'مستخدم'}
                    </Text>
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleRequestAction(request, 'accept')}
                    >
                      <MaterialCommunityIcons name="check" size={20} color="#34C759" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleRequestAction(request, 'reject')}
                    >
                      <MaterialCommunityIcons name="close" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Status Badge */}
          {renderRequestBadge(ride)}

          {/* Actions */}
          <RideActions ride={ride} isCreator={isCreator} />
        </Card.Content>
      </Card>
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRides();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        enabled
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <BackButton style={styles.backButton} />
            <Text style={styles.title}>وصلني</Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <Pressable 
            style={[styles.tabButton, activeTab === 'available' && styles.tabButtonActive]}
            onPress={() => setActiveTab('available')}
          >
            <MaterialCommunityIcons 
              name="car-multiple" 
              size={24} 
              color={activeTab === 'available' ? '#fff' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>
              الرحلات المتاحة
            </Text>
          </Pressable>
          <Pressable 
            style={[styles.tabButton, activeTab === 'create' && styles.tabButtonActive]}
            onPress={() => setActiveTab('create')}
          >
            <MaterialCommunityIcons 
              name="plus-circle" 
              size={24} 
              color={activeTab === 'create' ? '#fff' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
              إنشاء رحلة جديدة
            </Text>
          </Pressable>
        </View>

        {activeTab === 'create' ? (
          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* College ID */}
            <Text style={styles.label}>الرقم الجامعي</Text>
            <TextInput
              mode="outlined"
              placeholder="أدخل رقمك الجامعي"
              value={formData.collegeId}
              onChangeText={(text) => setFormData(prev => ({ ...prev, collegeId: text }))}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              keyboardType="numeric"
              maxLength={10}
            />

            {/* Gender */}
            <Text style={styles.label}>تفضيل الجنس</Text>
            <View style={styles.radioContainer}>
              <TouchableOpacity 
                style={styles.radioOption}
                onPress={() => setFormData(prev => ({ ...prev, gender: 'any' }))}
              >
                <View style={styles.radio}>
                  {formData.gender === 'any' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>الكل</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.radioOption}
                onPress={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
              >
                <View style={styles.radio}>
                  {formData.gender === 'female' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>أنثى</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.radioOption}
                onPress={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
              >
                <View style={styles.radio}>
                  {formData.gender === 'male' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioLabel}>ذكر</Text>
              </TouchableOpacity>
            </View>

            {/* Current Location */}
            <Text style={styles.label}>الموقع الحالي</Text>
            <TextInput
              mode="outlined"
              placeholder="أدخل موقعك الحالي"
              value={formData.currentLocation}
              onChangeText={(text) => setFormData(prev => ({ ...prev, currentLocation: text }))}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />

            {/* Destination */}
            <Text style={styles.label}>الوجهة النهائية</Text>
            <TextInput
              mode="outlined"
              placeholder="أدخل وجهتك النهائية"
              value={formData.destination}
              onChangeText={(text) => setFormData(prev => ({ ...prev, destination: text }))}
              style={styles.input}
              outlineStyle={styles.inputOutline}
            />

            {/* Number of Seats */}
            <Text style={styles.label}>عدد المقاعد</Text>
            <TextInput
              mode="outlined"
              placeholder="أدخل عدد المقاعد"
              value={formData.seats}
              onChangeText={(text) => {
                // Only allow numbers 1-4
                if (/^[1-4]$/.test(text) || text === '') {
                  setFormData(prev => ({ ...prev, seats: text }))
                }
              }}
              keyboardType="numeric"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              maxLength={1}
            />

            {/* Description */}
            <Text style={styles.label}>وصف موعد المغادرة (اختياري)</Text>
            <TextInput
              mode="outlined"
              placeholder="مثال: سأغادر بعد 30 دقيقة"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              style={styles.input}
              outlineStyle={styles.inputOutline}
              multiline
              numberOfLines={2}
            />

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
              style={[styles.submitButton, { backgroundColor: '#fff' }]}
              textColor="#000"
            >
              إنشاء رحلة
            </Button>
          </ScrollView>
        ) : (
          <FlatList
            data={rides}
            renderItem={({ item }) => renderRideCard(item)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.ridesList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="car-off" size={48} color="#666" />
                <Text style={styles.emptyText}>لا توجد رحلات متاحة</Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000'
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    elevation: 1
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderRadius: 8
  },
  tabButtonActive: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500'
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '600'
  },
  content: {
    flex: 1,
    paddingHorizontal: 16
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'right',
    color: '#000'
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 16,
    textAlign: 'right',
    fontSize: 16
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
    gap: 24,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 12
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#000'
  },
  radioLabel: {
    fontSize: 16,
    color: '#000'
  },
  ridesList: {
    padding: 16
  },
  rideCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16
  },
  driverDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  driverName: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500'
  },
  collegeId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  rideDetails: {
    marginBottom: 16
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  location: {
    fontSize: 16,
    color: '#000',
    flex: 1
  },
  rideInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right'
  },
  requestBadgeContainer: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  badgeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center'
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 32,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#000',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'right',
    marginBottom: 16
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  chatButton: {
    backgroundColor: '#f5f5f5',
  },
  joinButton: {
    backgroundColor: '#000',
  },
  cancelButton: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FF3B30',
    alignSelf: 'flex-end',
    marginTop: 16,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  joinText: {
    color: '#fff',
  },
  cancelText: {
    color: '#FF3B30',
  },
  pendingRequestsContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  pendingRequest: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  requestUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestUserName: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  acceptButton: {
    backgroundColor: '#E8FFF1',
  },
  rejectButton: {
    backgroundColor: '#FFE8E8',
  },
  creatorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  requestsButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#000',
    position: 'relative',
    paddingRight: 24,
  },
  requestsBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#000',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  requestsBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
}); 