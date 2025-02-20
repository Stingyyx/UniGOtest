import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  SafeAreaView, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ViewStyle,
  TextStyle,
  ImageStyle,
  RefreshControl
} from 'react-native';
import { 
  Text, 
  Button, 
  Card, 
  Avatar, 
  Chip, 
  ActivityIndicator, 
  Portal, 
  Dialog,
  IconButton
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../../../lib/auth/AuthContext';
import { supabase } from '../../../../lib/supabase';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DefaultAvatar } from '../../../../assets';
import * as Notifications from 'expo-notifications';
import { sendPushNotification, PushNotificationData } from '../../../../lib/notifications/push';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../../lib/i18n/LanguageContext';
import { showMessage } from 'react-native-flash-message';
import { Profile } from '../../../../lib/context/UserContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { FlatList } from 'react-native';
import { notificationService } from '../../../../lib/notifications/service';

type MaterialIconName = keyof typeof MaterialCommunityIcons.glyphMap;

type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';
type GenderPreference = 'male' | 'female' | 'any';

type RequestStatusConfig = {
  label: string;
  color: string;
  icon: string;
};

const GENDER_ICONS: Record<GenderPreference, MaterialIconName> = {
  male: 'gender-male',
  female: 'gender-female',
  any: 'gender-male-female'
} as const;

const REQUEST_STATUS: Record<RequestStatus, RequestStatusConfig> = {
  pending: {
    label: 'قيد الانتظار',
    color: '#FF9500',
    icon: 'clock-outline'
  },
  accepted: {
    label: 'مقبول',
    color: '#34C759',
    icon: 'check'
  },
  rejected: {
    label: 'مرفوض',
    color: '#FF3B30',
    icon: 'close'
  },
  cancelled: {
    label: 'ملغي',
    color: '#8E8E93',
    icon: 'cancel'
  }
};

const STATUS_ICONS = {
  active: 'car',
  full: 'car-clock',
  cancelled: 'car-off',
  completed: 'cart-check'
} as const;

const RIDE_STATUS_ICONS: Record<RideStatus, MaterialIconName> = {
  active: 'car',
  ready: 'check-circle',
  full: 'car-clock',
  cancelled: 'car-off',
  completed: 'cart-check'
};

const RIDE_STATUS_COLORS: Record<RideStatus, string> = {
  active: '#34C759',
  ready: '#4CAF50',
  full: '#FF9500',
  cancelled: '#FF3B30',
  completed: '#007AFF'
};

const RIDE_STATUS_LABELS: Record<RideStatus, string> = {
  active: 'نشطة',
  full: 'مكتملة',
  cancelled: 'ملغية',
  completed: 'منتهية',
  ready: 'جاهزة'
};

type Message = {
  id: string;
  ride_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: {
    full_name: string;
    avatar_url: string | null;
  };
};

type RideDetails = {
  id: string;
  driver_id: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  total_seats: number;
  available_seats: number;
  gender_preference: GenderPreference;
  status: RideStatus;
  driver: {
    full_name: string;
    avatar_url: string | null;
  };
  requests: RideRequest[];
};

type RideRequest = {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  passenger?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
};

type AuthUser = {
  id: string;
  email?: string;
  profile: Profile;
};

// Add gender preference icons and colors
const GENDER_COLORS: Record<GenderPreference, string> = {
  male: '#2196F3',
  female: '#E91E63',
  any: '#757575'
};

const GENDER_LABELS: Record<GenderPreference, string> = {
  male: 'ذكور فقط',
  female: 'إناث فقط',
  any: 'الجميع'
};

// Add status constants
const STATUS_COLORS = {
  active: '#4CAF50',    // Green
  full: '#FFC107',      // Yellow
  ready: '#2196F3',     // Blue
  cancelled: '#F44336', // Red
  completed: '#757575'  // Grey
} as const;

const STATUS_LABELS: Record<RideStatus, string> = {
  active: 'نشطة',
  full: 'مكتملة',
  cancelled: 'ملغية',
  completed: 'منتهية',
  ready: 'جاهزة'
};

const getGenderIcon = (preference: GenderPreference): MaterialIconName | undefined => {
  if (preference === 'any') return undefined;
  return GENDER_ICONS[preference];
};

const GenderPreferenceChip = ({ preference }: { preference: GenderPreference }) => {
  const icon = getGenderIcon(preference);
  return (
    <Chip
      icon={icon ? () => <MaterialCommunityIcons name={icon} size={16} color="#fff" /> : undefined}
      style={[styles.genderChip, { backgroundColor: GENDER_COLORS[preference] }]}
    >
      {GENDER_LABELS[preference]}
    </Chip>
  );
};

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  rideInfo: ViewStyle;
  infoRow: ViewStyle;
  label: TextStyle;
  value: TextStyle;
  statusContainer: ViewStyle;
  statusText: TextStyle;
  genderContainer: ViewStyle;
  genderText: TextStyle;
  requestSection: ViewStyle;
  sectionTitle: TextStyle;
  requestCard: ViewStyle;
  requestInfo: ViewStyle;
  avatarContainer: ViewStyle;
  avatar: ImageStyle;
  passengerInfo: ViewStyle;
  passengerName: TextStyle;
  requestTime: TextStyle;
  requestActions: ViewStyle;
  emptyRequests: ViewStyle;
  emptyText: TextStyle;
  errorText: TextStyle;
  driverDetails: ViewStyle;
  driverName: TextStyle;
  centered: ViewStyle;
  actionsContainer: ViewStyle;
  chatButton: ViewStyle;
  buttonContent: ViewStyle;
  cancelButton: ViewStyle;
  joinButton: ViewStyle;
  cancelRequestButton: ViewStyle;
  backButton: ViewStyle;
  backText: TextStyle;
  content: ViewStyle;
  driverCard: ViewStyle;
  driverInfo: ViewStyle;
  detailsCard: ViewStyle;
  detailRow: ViewStyle;
  detailTexts: ViewStyle;
  detailLabel: TextStyle;
  detailValue: TextStyle;
  divider: ViewStyle;
  requestsCard: ViewStyle;
  requestsTitle: TextStyle;
  footer: ViewStyle;
  requestsContainer: ViewStyle;
  genderChip: ViewStyle;
  errorContainer: ViewStyle;
  actionButton: ViewStyle;
};

const baseStyles: Styles = {
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  rideInfo: {
    gap: 12,
    marginTop: 12
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    textAlign: 'right'
  },
  value: {
    fontSize: 14,
    color: '#1F2937',
    flex: 2,
    textAlign: 'right'
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right'
  },
  genderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  genderText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right'
  },
  requestsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16
  },
  requestSection: {
    gap: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right'
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB'
  },
  avatar: {
    width: '100%',
    height: '100%'
  },
  passengerInfo: {
    flex: 1,
    gap: 4
  },
  passengerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right'
  },
  requestTime: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right'
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8
  },
  emptyRequests: {
    padding: 16,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center'
  },
  errorText: {
    color: '#FF3B30',
    marginTop: 8,
    textAlign: 'right'
  },
  driverDetails: {
    flex: 1,
    marginLeft: 12
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 4
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chatButton: {
    borderRadius: 8,
    height: 48
  },
  buttonContent: {
    height: 48,
    flexDirection: 'row-reverse'
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    maxWidth: 150
  },
  joinButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    maxWidth: 150
  },
  cancelRequestButton: {
    borderColor: '#FF3B30',
    borderRadius: 12,
    maxWidth: 150
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backText: {
    marginRight: 8,
    fontSize: 16
  },
  content: {
    flex: 1,
    padding: 16
  },
  driverCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  detailTexts: {
    flex: 1,
    marginLeft: 12
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937'
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12
  },
  requestsCard: {
    marginBottom: 16,
    elevation: 2
  },
  requestsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12
  },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  genderChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16
  },
  actionButton: {
    borderRadius: 8,
    height: 48
  }
};

const styles = StyleSheet.create(baseStyles);

type RideUpdate = Partial<RideDetails> & {
  status: RideStatus;
  available_seats: number;
};

type RequestUpdate = {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  [key: string]: any;
};

type RideStatus = 'active' | 'full' | 'cancelled' | 'completed' | 'ready';

const rideStatusMessages: Record<RideStatus, string> = {
  active: 'نشطة',
  full: 'مكتملة',
  cancelled: 'ملغية',
  completed: 'منتهية',
  ready: 'جاهزة'
};

// Component Definitions
const DriverAvatar = ({ size = 40, avatarUrl }: { size?: number; avatarUrl?: string | null }) => (
  <Avatar.Image 
    size={size} 
    source={avatarUrl ? { uri: avatarUrl } : DefaultAvatar} 
  />
);

const PassengerAvatar = ({ url, size = 32 }: { url: string | null; size?: number }) => (
  <Avatar.Image 
    size={size} 
    source={url ? { uri: url } : DefaultAvatar}
  />
);

const StatusBadge = ({ status, label }: { status: RideStatus; label: string }) => (
  <View style={styles.statusContainer}>
    <MaterialCommunityIcons name={RIDE_STATUS_ICONS[status]} size={20} color="#6B7280" />
    <Text style={styles.statusText}>{label}</Text>
  </View>
);

const GenderBadge = ({ preference }: { preference: GenderPreference }) => {
  const label = GENDER_LABELS[preference];
  const icon = GENDER_ICONS[preference];

  return (
    <View style={styles.genderContainer}>
      <MaterialCommunityIcons name={icon} size={20} color="#6B7280" />
      <Text style={styles.genderText}>{label}</Text>
    </View>
  );
};

export default function RideDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth() as { user: AuthUser | null };
  const { t } = useTranslation();
  const [ride, setRide] = useState<RideDetails | null>(null);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [userRequest, setUserRequest] = useState<RideRequest | null>(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [participantUpdates, setParticipantUpdates] = useState<{[key: string]: string}>({});
  const notificationListenerRef = useRef<any>(null);
  const { isRTL } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const flatListRef = useRef<FlatList | null>(null);

  useEffect(() => {
    loadData();
    setupRealtime();
    setupNotifications();
    return () => {
      if (notificationListenerRef.current) {
        Notifications.removeNotificationSubscription(notificationListenerRef.current);
      }
    };
  }, []);

  const setupNotifications = async () => {
    try {
      // Request notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(t('common.error'), t('transport.notifications.permissionDenied'));
      return;
    }

      // Configure notification behavior
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Listen for notifications
      const subscription = Notifications.addNotificationResponseReceivedListener(handleNotification);
      
      return () => {
        subscription.remove();
      };
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const handleNotification = (response: Notifications.NotificationResponse) => {
    try {
      const data = response.notification.request.content.data;
      
      // Handle different notification types
      switch (data.type) {
        case 'ride_request':
          router.push('/(app)/(transport)/rides');
          break;
        case 'request_accepted':
        case 'request_rejected':
          loadData();
          break;
        case 'ride_cancelled':
          router.back();
          break;
        case 'new_message':
          // Handle new message notification
          break;
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const setupRealtime = () => {
    try {
      // Subscribe to ride changes and new messages
      subscriptionRef.current = supabase
        .channel(`ride_chat_${id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `ride_id=eq.${id as string}`
          },
          async (payload: { new: any }) => {
            if (payload.new) {
              // Load the new message with sender details
              const { data: messageData, error } = await supabase
                .from('messages')
                .select(`
                  *,
                  sender:profiles(full_name, avatar_url)
                `)
                .eq('id', payload.new.id)
                .single();

              if (!error && messageData) {
                // Add new message to state and scroll to bottom
                setMessages(prev => [...prev, messageData as Message]);
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rides',
            filter: `id=eq.${id as string}`
          },
          (payload: { new: any }) => {
            if (payload.new) {
              setRide(prev => prev ? { ...prev, ...payload.new } : null);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ride_requests',
            filter: `ride_id=eq.${id as string}`
          },
          async (payload: { new: any }) => {
            if (payload.new) {
              await checkPermission();
            }
          }
        )
        .subscribe();

      return () => {
        if (subscriptionRef.current) {
          supabase.removeChannel(subscriptionRef.current);
        }
      };
    } catch (error) {
      console.error('Error setting up real-time:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load ride data with requests
      const { data: rideData, error: rideError } = await supabase
        .from('rides')
        .select(`
          *,
          driver:profiles(*),
          requests:ride_requests(
            *,
            passenger:profiles(
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('id', id)
        .single();

      if (rideError) throw rideError;

      setRide(rideData);
      setRequests(rideData.requests || []);

      // If user is logged in, check for their request
      if (user) {
        const userReq = rideData.requests?.find((req: RideRequest) => req.passenger_id === user.id);
        setUserRequest(userReq || null);
      }
    } catch (error) {
      console.error('[Cursor] Error loading ride details:', error);
      setError('حدث خطأ أثناء تحميل تفاصيل الرحلة');
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from('ride_requests')
        .select(`
          *,
          passenger:profiles(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('ride_id', id)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      setRequests(requestsData || []);

      // Find user's request if any
      if (user) {
        const userReq = requestsData?.find(req => req.passenger_id === user.id);
        setUserRequest(userReq || null);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      throw error;
    }
  };

  const sendRequestNotification = async (type: string, recipientId: string, rideData: any) => {
    try {
      if (!ride) return;
      
      const notification = {
        user_id: recipientId,
        type: 'ride_update',
        title: getNotificationTitle(type, rideData),
        message: getNotificationMessage(type, rideData),
        metadata: { 
          type,
          ride_id: ride.id,
          ...rideData
        }
      };

      const { error } = await supabase.from('notifications').insert([notification]);
      if (error) throw error;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const getNotificationTitle = (type: string, data: any) => {
    switch (type) {
      case 'request_received':
        return 'طلب انضمام جديد';
      case 'request_accepted':
        return 'تم قبول طلبك';
      case 'request_rejected':
        return 'تم رفض طلبك';
      case 'ride_cancelled':
        return 'تم إلغاء الرحلة';
      default:
        return 'تحديث الرحلة';
    }
  };

  const getNotificationMessage = (type: string, ride: any) => {
    switch (type) {
      case 'accepted':
        return 'تم قبول طلبك للانضمام إلى الرحلة';
      case 'rejected':
        return 'تم رفض طلبك للانضمام إلى الرحلة';
      case 'cancelled':
        return 'تم إلغاء الرحلة';
      default:
        return '';
    }
  };

  const handleJoinRequest = async () => {
    if (!user) {
      Alert.alert(t('common.error'), t('transport.mustBeLoggedIn'));
      return;
    }

    if (!user.profile) {
      Alert.alert(t('common.error'), t('transport.completeProfile'));
      return;
    }

    // Check if all required profile fields are filled
    const profile = user.profile as Profile;
    if (!profile.full_name || !profile.username || !profile.gender || !profile.college_id) {
      Alert.alert(t('common.error'), t('transport.completeProfile'));
      router.push('/(app)/profile/edit');
      return;
    }

    if (!ride) {
      Alert.alert(t('common.error'), t('transport.rideNotFound'));
      return;
    }

    try {
      setRequestLoading(true);
      setError(null);

      // Check if user already has a request
      const { data: existingRequest, error: checkError } = await supabase
        .from('ride_requests')
        .select('id, status')
        .eq('ride_id', id)
        .eq('passenger_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          Alert.alert(t('common.error'), t('transport.alreadyRequested'));
          return;
        } else if (existingRequest.status === 'accepted') {
          Alert.alert(t('common.error'), t('transport.alreadyAccepted'));
        return;
        }
      }

      // Check available seats
      if (ride.available_seats <= 0) {
        Alert.alert(t('common.error'), t('transport.noSeatsAvailable'));
        return;
      }

      // Create new request
      const { data: newRequest, error: requestError } = await supabase
        .from('ride_requests')
        .insert([
          {
            ride_id: id,
            passenger_id: user.id,
            status: 'pending'
          }
        ])
        .select(`
          *,
          passenger:profiles(
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (requestError) throw requestError;

      // Send notification to driver
      await sendRequestNotification(
        'request_received',
        ride.driver_id,
        {
          passengerName: user.profile.full_name,
          rideId: id
        }
      );

      setShowJoinDialog(false);
      showMessage({
        message: t('transport.requestSent'),
        type: 'success',
        duration: 3000
      });

      // Update local state
      setUserRequest(newRequest);
      loadRequests();

    } catch (error: any) {
      console.error('Error joining ride:', error);
      setError(error.message || t('transport.errorJoining'));
      Alert.alert(t('common.error'), t('transport.errorJoining'));
    } finally {
      setRequestLoading(false);
    }
  };

  const handleCancelRide = async () => {
    try {
      setRequestLoading(true);

      // Get all affected passengers (pending or accepted requests)
      const { data: requests, error: requestsError } = await supabase
        .from('ride_requests')
        .select('user_id, status')
        .eq('ride_id', id)
        .in('status', ['pending', 'accepted']);

      if (requestsError) {
        console.error('[Cursor] Error fetching affected passengers:', requestsError);
        Alert.alert('خطأ', 'حدث خطأ أثناء حذف الرحلة');
        return;
      }

      // First update all requests to cancelled
      const { error: updateRequestsError } = await supabase
        .from('ride_requests')
        .update({ status: 'cancelled' })
        .eq('ride_id', id)
        .in('status', ['pending', 'accepted']);

      if (updateRequestsError) {
        console.error('[Cursor] Error updating requests:', updateRequestsError);
        Alert.alert('خطأ', 'فشل تحديث طلبات الركاب');
        return;
      }

      // Then update the ride status to cancelled
      const { error: updateRideError } = await supabase
        .from('rides')
        .update({ 
          status: 'cancelled',
          available_seats: 0
        })
        .eq('id', id);

      if (updateRideError) {
        console.error('[Cursor] Error updating ride:', updateRideError);
        Alert.alert('خطأ', 'فشل إلغاء الرحلة');
        return;
      }

      // Send notifications to all affected passengers
      if (requests && requests.length > 0) {
        for (const request of requests) {
          await sendRequestNotification('ride_cancelled', request.user_id, {
            previous_status: request.status
          });
        }
      }

      // Show success message and redirect
      Alert.alert('تم', 'تم إلغاء الرحلة بنجاح', [
        {
          text: 'موافق',
          onPress: () => {
            // Redirect to rideshare screen
            router.replace('/(app)/(transport)/rideshare');
          }
        }
      ]);

    } catch (error) {
      console.error('[Cursor] Error in handleCancelRide:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء حذف الرحلة');
    } finally {
      setRequestLoading(false);
      setShowCancelDialog(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!user || !userRequest) return;

    try {
      setRequestLoading(true);

      // Update request status
      const { error: requestError } = await supabase
        .from('ride_requests')
        .update({ status: 'cancelled' })
        .eq('id', userRequest.id);

      if (requestError) throw requestError;

      // Update available seats
      const { error: updateError } = await supabase
        .from('rides')
        .update({ 
          available_seats: ride!.available_seats + 1,
          status: 'active'
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Send notification to ride creator
      await sendRequestNotification('request_cancelled', ride!.driver_id, {
        previous_status: userRequest.status
      });

      Alert.alert('Success', 'Request cancelled successfully');
    } catch (error) {
      console.error('Error cancelling request:', error);
      Alert.alert('Error', 'Failed to cancel request');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleRequestAction = async (request: RideRequest, action: 'accept' | 'reject') => {
    if (!ride) {
      Alert.alert('خطأ', 'الرحلة غير موجودة');
      return;
    }

    try {
      setRequestLoading(true);
      setActiveRequest(request);

      if (action === 'accept') {
        // Check available seats
        if (ride.available_seats <= 0) {
          Alert.alert('خطأ', 'لا توجد مقاعد متاحة');
          return;
        }

        // First update the request status
        const { error: requestError } = await supabase
          .from('ride_requests')
          .update({ 
            status: 'accepted',
            updated_at: new Date().toISOString()
          })
          .eq('id', request.id);

        if (requestError) throw requestError;

        // Then update ride's available seats and status
        const newAvailableSeats = ride.available_seats - 1;
        const newStatus = newAvailableSeats === 0 ? 'full' : 'active';
        
        const { error: rideError } = await supabase
          .from('rides')
          .update({ 
            available_seats: newAvailableSeats,
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', ride.id);

        if (rideError) throw rideError;
      } else {
        // For rejection, just update the request status
        const { error: requestError } = await supabase
          .from('ride_requests')
          .update({ 
            status: 'rejected',
            updated_at: new Date().toISOString()
          })
          .eq('id', request.id);

        if (requestError) throw requestError;
      }

      // Send notification to passenger
      await sendRequestNotification(
        action === 'accept' ? 'request_accepted' : 'request_rejected',
        request.passenger_id,
        {
          driverName: ride.driver.full_name,
          rideTo: ride.to_location,
          rideFrom: ride.from_location,
          departureTime: ride.departure_time
        }
      );

      // Reload ride data and requests
      await loadData();
      await loadRequests();

      Alert.alert(
        'تم',
        action === 'accept' ? 'تم قبول الطلب بنجاح' : 'تم رفض الطلب بنجاح'
      );

    } catch (error) {
      console.error('Error updating request:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث حالة الطلب');
    } finally {
      setRequestLoading(false);
      setActiveRequest(null);
    }
  };

  const navigateToChat = () => {
    router.push(`/(app)/(transport)/chat/${id}`);
  };

  // Check if user has permission to access chat
  const checkPermission = async () => {
    if (!user || !ride) return false;

    try {
      // Check if user is driver
      if (ride.driver_id === user.id) {
        return true;
      }

      // Check if user is accepted passenger
      const { data: request, error } = await supabase
        .from('ride_requests')
        .select('status')
        .eq('ride_id', id)
        .eq('passenger_id', user.id)
        .single();

      if (error) throw error;

      return request?.status === 'accepted';
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={styles.centered}>
        <Text>Ride not found</Text>
      </View>
    );
  }

  const isDriver = user?.id === ride.driver_id;
  const canJoin = !isDriver && !userRequest && ride.status === 'active';
  const canCancel = isDriver && ride.status === 'active';
  const canCancelRequest = userRequest?.status === 'pending';
  const canAccessChat = isDriver || userRequest;

  const RequestCard = ({ request }: { request: RideRequest }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAction = async (action: 'accept' | 'reject') => {
      try {
        setIsSubmitting(true);
        setError(null);
        await handleRequestAction(request, action);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      } finally {
        setIsSubmitting(false);
      }
    };

    const getStatusColor = () => {
      switch (request.status) {
        case 'pending': return '#FF9500';
        case 'accepted': return '#34C759';
        case 'rejected': return '#FF3B30';
        case 'cancelled': return '#8E8E93';
        default: return '#666';
      }
    };

    const getStatusLabel = () => {
      switch (request.status) {
        case 'pending': return 'قيد الانتظار';
        case 'accepted': return 'مقبول';
        case 'rejected': return 'مرفوض';
        case 'cancelled': return 'ملغي';
        default: return 'غير معروف';
      }
    };

    return (
      <View style={[styles.requestCard, { borderColor: getStatusColor() }]}>
        <View style={styles.requestInfo}>
          <View style={styles.avatarContainer}>
            {request.passenger?.avatar_url ? (
              <Image
                source={{ uri: request.passenger.avatar_url }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <MaterialCommunityIcons name="account-circle" size={40} color="#666" />
            )}
          </View>
          <View style={styles.passengerInfo}>
            <Text style={styles.passengerName}>{request.passenger?.full_name || 'مستخدم'}</Text>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusLabel()}
            </Text>
            <Text style={styles.requestTime}>
              {format(new Date(request.created_at), 'h:mm a', { locale: ar })}
            </Text>
          </View>
        </View>
        
        {isDriver && request.status === 'pending' && (
          <View style={styles.requestActions}>
            <Button
              mode="text"
              textColor="#34C759"
              onPress={() => handleAction('accept')}
              loading={isSubmitting}
              disabled={isSubmitting || requestLoading || !ride?.available_seats}
              icon="check"
            >
              قبول
            </Button>
            <Button
              mode="text"
              textColor="#FF3B30"
              onPress={() => handleAction('reject')}
              loading={isSubmitting}
              disabled={isSubmitting || requestLoading}
              icon="close"
            >
              رفض
            </Button>
          </View>
        )}
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
    );
  };

  const RequestList = ({ requests }: { requests: RideRequest[] }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRefresh = async () => {
      try {
        setIsRefreshing(true);
        setError(null);
        await loadRequests();
      } catch (err) {
        setError('فشل تحديث الطلبات');
      } finally {
        setIsRefreshing(false);
      }
    };

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert" size={24} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <Button onPress={handleRefresh} loading={isRefreshing}>
            إعادة المحاولة
          </Button>
        </View>
      );
    }

    if (requests.length === 0) {
      return (
        <View style={styles.emptyRequests}>
          <MaterialCommunityIcons name="account-multiple" size={48} color="#666" />
          <Text style={styles.emptyText}>لا توجد طلبات حالياً</Text>
        </View>
      );
    }

    const pendingRequests = requests.filter(req => req.status === 'pending');
    const acceptedRequests = requests.filter(req => req.status === 'accepted');
    const rejectedRequests = requests.filter(req => req.status === 'rejected');
    const cancelledRequests = requests.filter(req => req.status === 'cancelled');

    return (
      <ScrollView 
        style={styles.requestsContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {pendingRequests.length > 0 && (
          <View style={styles.requestSection}>
            <Text style={styles.sectionTitle}>
              طلبات معلقة ({pendingRequests.length})
            </Text>
            {pendingRequests.map(request => (
              <RequestCard key={request.id} request={request} />
            ))}
          </View>
        )}

        {acceptedRequests.length > 0 && (
          <View style={styles.requestSection}>
            <Text style={styles.sectionTitle}>
              طلبات مقبولة ({acceptedRequests.length})
            </Text>
            {acceptedRequests.map(request => (
              <RequestCard key={request.id} request={request} />
            ))}
          </View>
        )}

        {rejectedRequests.length > 0 && (
          <View style={styles.requestSection}>
            <Text style={styles.sectionTitle}>
              طلبات مرفوضة ({rejectedRequests.length})
            </Text>
            {rejectedRequests.map(request => (
              <RequestCard key={request.id} request={request} />
            ))}
          </View>
        )}

        {cancelledRequests.length > 0 && (
          <View style={styles.requestSection}>
            <Text style={styles.sectionTitle}>
              طلبات ملغية ({cancelledRequests.length})
            </Text>
            {cancelledRequests.map(request => (
              <RequestCard key={request.id} request={request} />
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const RideActions = () => {
    if (isDriver) {
      return (
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={navigateToChat}
            style={[styles.actionButton, { flex: 1, marginRight: 8 }]}
            icon="chat"
            contentStyle={styles.buttonContent}
          >
            دردشة
          </Button>
          {canCancel && (
            <Button
              mode="contained"
              onPress={() => setShowCancelDialog(true)}
              style={[styles.actionButton, { flex: 1, marginLeft: 8 }]}
              icon="delete"
              contentStyle={styles.buttonContent}
            >
              إلغاء الرحلة
            </Button>
          )}
        </View>
      );
    }

    return (
      <View style={styles.actionsContainer}>
        {canJoin && ride.status === 'active' && (
          <Button
            mode="contained"
            onPress={() => setShowJoinDialog(true)}
            loading={requestLoading}
            disabled={requestLoading}
            style={[styles.joinButton, { flex: 0.5 }]}
            icon="account-plus"
            contentStyle={styles.buttonContent}
          >
            انضم
          </Button>
        )}
        <Button
          mode="contained"
          onPress={navigateToChat}
          style={[styles.chatButton, { flex: 0.5 }]}
          icon="chat"
          contentStyle={styles.buttonContent}
        >
          دردشة
        </Button>
        {canCancelRequest && (
          <Button
            mode="outlined"
            onPress={handleCancelRequest}
            loading={requestLoading}
            disabled={requestLoading}
            style={[styles.cancelRequestButton, { flex: 0.5 }]}
            icon="close"
            contentStyle={styles.buttonContent}
          >
            إلغاء
          </Button>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons 
            name={isRTL ? "arrow-right" : "arrow-left"} 
            size={24} 
            color="#000" 
          />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Driver Info Card */}
        <View style={styles.driverCard}>
          <View style={styles.driverInfo}>
            <DriverAvatar size={60} avatarUrl={ride?.driver?.avatar_url} />
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{ride?.driver?.full_name}</Text>
              <StatusBadge status={ride?.status || 'active'} label={RIDE_STATUS_LABELS[ride?.status || 'active']} />
            </View>
          </View>
        </View>

        {/* Ride Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker" size={24} color="#000" />
            <View style={styles.detailTexts}>
              <Text style={styles.detailLabel}>من</Text>
              <Text style={styles.detailValue}>{ride?.from_location}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker" size={24} color="#000" />
            <View style={styles.detailTexts}>
              <Text style={styles.detailLabel}>إلى</Text>
              <Text style={styles.detailValue}>{ride?.to_location}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account-group" size={24} color="#000" />
            <View style={styles.detailTexts}>
              <Text style={styles.detailLabel}>المقاعد المتاحة</Text>
              <Text style={styles.detailValue}>
                {ride?.available_seats} من {ride?.total_seats}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock" size={24} color="#000" />
            <View style={styles.detailTexts}>
              <Text style={styles.detailLabel}>وقت المغادرة</Text>
              <Text style={styles.detailValue}>
                {format(new Date(ride?.departure_time || ''), 'h:mm a', { locale: ar })}
              </Text>
            </View>
          </View>
        </View>

        {/* Requests Section */}
        {user?.id === ride?.driver_id && (
          <View style={styles.requestsCard}>
            <Text style={styles.requestsTitle}>طلبات الانضمام</Text>
            <RequestList requests={requests} />
          </View>
          )}
        </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <RideActions />
      </View>

        {/* Join Dialog */}
        <Portal>
          <Dialog visible={showJoinDialog} onDismiss={() => setShowJoinDialog(false)}>
            <Dialog.Title>تأكيد الانضمام للرحلة</Dialog.Title>
            <Dialog.Content>
            <Text>هل تريد الانضمام إلى هذه الرحلة؟</Text>
              {joinError && (
                <Text style={styles.errorText}>{joinError}</Text>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowJoinDialog(false)}>إلغاء</Button>
              <Button 
                onPress={handleJoinRequest}
                loading={requestLoading}
              disabled={requestLoading}
              textColor="#34C759"
              >
                تأكيد
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Cancel Dialog */}
        <Portal>
          <Dialog visible={showCancelDialog} onDismiss={() => setShowCancelDialog(false)}>
            <Dialog.Title>تأكيد إلغاء الرحلة</Dialog.Title>
            <Dialog.Content>
            <Text>هل أنت متأكد من رغبتك في إلغاء هذه الرحلة؟ لا يمكن التراجع عن هذا الإجراء.</Text>
            </Dialog.Content>
            <Dialog.Actions>
            <Button onPress={() => setShowCancelDialog(false)}>إلغاء</Button>
              <Button 
                onPress={handleCancelRide}
                loading={requestLoading}
                disabled={requestLoading}
              textColor="#FF3B30"
              >
              تأكيد الإلغاء
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
    </SafeAreaView>
  );
}