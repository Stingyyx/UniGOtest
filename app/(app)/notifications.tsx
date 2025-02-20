import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, ActivityIndicator, useTheme, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth/AuthContext';
import BackButton from '../../components/common/BackButton';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { notificationService, Notification } from '../../lib/notifications/service';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';

type MaterialIconName = keyof typeof MaterialCommunityIcons.glyphMap;

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const theme = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const { t } = useTranslation();

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  const handleRefresh = async () => {
    if (isOffline) return;
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }

    // Navigate based on notification type and metadata
    switch (notification.type) {
      case 'ride_request':
      case 'ride_accepted':
      case 'ride_rejected':
      case 'ride_cancelled':
      case 'ride_ready':
      case 'ride_completed':
        if (notification.metadata?.ride_id) {
          router.push(`/(app)/(transport)/ride/${notification.metadata.ride_id}`);
        }
        break;
      case 'ride_chat':
        if (notification.metadata?.ride_id) {
          router.push(`/(app)/(transport)/chat/${notification.metadata.ride_id}`);
        }
        break;
      case 'bus_alert':
        router.push('/(app)/(transport)/bus-alerts');
        break;
      case 'food_order':
        router.push('/(app)/food');
        break;
      case 'study_alert':
        router.push('/(app)/study');
        break;
      case 'social_event':
        router.push('/(app)/social');
        break;
    }
  };

  const getNotificationIcon = (type: string): MaterialIconName => {
    switch (type) {
      case 'ride_request':
      case 'ride_accepted':
      case 'ride_rejected':
        return 'account-clock';
      case 'ride_cancelled':
        return 'car-off';
      case 'ride_ready':
        return 'car-clock';
      case 'ride_completed':
        return 'cart-check';
      case 'ride_chat':
        return 'chat';
      case 'bus_alert':
        return 'bus';
      case 'food_order':
        return 'food';
      case 'study_alert':
        return 'book';
      case 'social_event':
        return 'account-group';
      default:
        return 'bell';
    }
  };

  const renderNotificationContent = (notification: Notification) => {
    const commonContent = (
      <>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationMessage}>{notification.message}</Text>
        </View>
        <Text style={styles.timeText}>{format(new Date(notification.created_at), 'p', { locale: ar })}</Text>
      </>
    );

    switch (notification.type) {
      case 'ride_request':
        return (
          <>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              {!notification.read && (
                <View style={styles.actionButtons}>
                  <Button 
                    mode="contained" 
                    onPress={() => handleRideRequest(notification, 'accept')}
                    style={styles.acceptButton}
                  >
                    {t('common.accept')}
                  </Button>
                  <Button 
                    mode="outlined" 
                    onPress={() => handleRideRequest(notification, 'reject')}
                    style={styles.declineButton}
                  >
                    {t('common.decline')}
                  </Button>
                </View>
              )}
            </View>
            <Text style={styles.timeText}>{format(new Date(notification.created_at), 'p', { locale: ar })}</Text>
          </>
        );

      case 'ride_chat':
        return (
          <>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              {notification.metadata?.ride_id && (
                <TouchableOpacity 
                  style={styles.chatButton}
                  onPress={() => router.push(`/(app)/(transport)/chat/${notification.metadata.ride_id}`)}
                >
                  <MaterialCommunityIcons name="chat" size={16} color="#666" />
                  <Text style={styles.chatButtonText}>{t('common.openChat')}</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.timeText}>{format(new Date(notification.created_at), 'p', { locale: ar })}</Text>
          </>
        );

      case 'ride_ready':
        return (
          <>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              {notification.metadata?.ride_id && (
                <TouchableOpacity 
                  style={styles.viewButton}
                  onPress={() => router.push(`/(app)/(transport)/ride/${notification.metadata.ride_id}`)}
                >
                  <MaterialCommunityIcons name="eye" size={16} color="#666" />
                  <Text style={styles.viewButtonText}>{t('transport.viewRide')}</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.timeText}>{format(new Date(notification.created_at), 'p', { locale: ar })}</Text>
          </>
        );

      default:
        return commonContent;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={getNotificationIcon(item.type)}
          size={24}
          color="#000"
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>
          {format(new Date(item.created_at), 'p', { locale: ar })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const handleRideRequest = async (notification: Notification, action: 'accept' | 'reject') => {
    if (!notification.metadata?.request_id) return;

    try {
      await notificationService.handleAction(notification.id, action);
      
      // Update notification in the list
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );

      // Navigate to ride details
      if (notification.metadata?.ride_id) {
        router.push(`/(app)/(transport)/ride/${notification.metadata.ride_id}`);
      }
    } catch (error) {
      console.error('Error handling ride request:', error);
      Alert.alert(t('common.error'), t('transport.errorHandlingRequest'));
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>الإشعارات</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>الإشعارات</Text>
      </View>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <MaterialCommunityIcons name="cloud-off-outline" size={20} color={theme.colors.error} />
          <Text style={[styles.offlineText, { color: theme.colors.error }]}>
            أنت غير متصل بالإنترنت
          </Text>
        </View>
      )}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            enabled={!isOffline}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="bell-off" 
              size={48} 
              color={theme.colors.onSurfaceDisabled} 
            />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceDisabled }]}>
              لا توجد إشعارات
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  list: {
    flexGrow: 1
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  unreadNotification: {
    backgroundColor: '#F3F4F6'
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  content: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  time: {
    fontSize: 12,
    color: '#999'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#FEE2E2',
  },
  offlineText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  notificationContent: {
    flex: 1,
    marginRight: 12
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'right'
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right'
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right'
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8
  },
  acceptButton: {
    backgroundColor: '#34C759'
  },
  declineButton: {
    borderColor: '#FF3B30'
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-end'
  },
  chatButtonText: {
    marginLeft: 4,
    color: '#4B5563',
    fontSize: 14
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-end'
  },
  viewButtonText: {
    marginLeft: 4,
    color: '#4B5563',
    fontSize: 14
  }
}); 