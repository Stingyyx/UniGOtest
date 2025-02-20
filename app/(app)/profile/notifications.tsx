import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image, RefreshControl } from 'react-native';
import { Text, Button, Divider, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../lib/i18n/LanguageContext';
import { DefaultAvatar } from '../../../assets';
import { useNotifications } from '../../../lib/notifications/useNotifications';
import { Notification } from '../../../lib/notifications/service';

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { 
    notifications, 
    loading, 
    refresh,
    markAsRead,
    markAllAsRead,
    handleAction 
  } = useNotifications();

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // For ride requests, always go to the rides list screen
    if (notification.title.includes('يريد الانضمام') || 
        notification.title === 'طلب انضمام جديد' || 
        notification.type === 'ride_request') {
      router.push('/(app)/(transport)/rides');
      return;
    }

    // Handle other notification types
    switch (notification.type) {
      case 'ride_update':
        if (notification.metadata?.ride_id) {
          router.push(`/(app)/(transport)/ride/${notification.metadata.ride_id}`);
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

  const handleRideRequest = async (notification: Notification, action: 'accept' | 'reject') => {
    if (!notification.metadata?.request_id) return;
    await handleAction(notification.id, action);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'ride_request':
      case 'ride_update':
        return 'car';
      case 'bus_alert':
        return 'bus';
      case 'food_order':
        return 'food';
      case 'study_alert':
        return 'book';
      case 'social_event':
        return 'calendar';
      default:
        return 'bell';
    }
  };

  const renderNotificationContent = (notification: Notification) => {
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
            <Text style={styles.timeText}>{formatTime(notification.created_at)}</Text>
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
                  onPress={() => router.push(`/(app)/(transport)/ride/${notification.metadata.ride_id}/chat`)}
                >
                  <MaterialCommunityIcons name="chat" size={16} color="#666" />
                  <Text style={styles.chatButtonText}>{t('common.openChat')}</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.timeText}>{formatTime(notification.created_at)}</Text>
          </>
        );

      default:
        return (
          <>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            </View>
            <Text style={styles.timeText}>{formatTime(notification.created_at)}</Text>
          </>
        );
    }
  };

  const notificationsByDate = Object.entries(notifications);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons 
            name={isRTL ? "arrow-right" : "arrow-left"} 
            size={24} 
            color="#000" 
          />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notifications')}</Text>
        {notificationsByDate.length > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllRead}>{t('common.markAllRead')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          (!notificationsByDate.length || loading) && styles.centeredContent
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor="#666"
            title={t('common.pullToRefresh')}
          />
        }
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : notificationsByDate.length === 0 ? (
          <View style={styles.centered}>
            <MaterialCommunityIcons name="bell-off-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>{t('notifications.empty')}</Text>
          </View>
        ) : (
          notificationsByDate.map(([date, dateNotifications]) => (
            <View key={date}>
              <Text style={styles.dateHeader}>{date}</Text>
              {dateNotifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.read && styles.unreadNotification
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                >
                  {/* Avatar or Icon */}
                  {(notification.metadata?.passenger_avatar || notification.metadata?.sender_avatar) ? (
                    <Image 
                      source={{ uri: notification.metadata.passenger_avatar || notification.metadata.sender_avatar }} 
                      style={styles.avatar}
                      defaultSource={DefaultAvatar}
                    />
                  ) : (
                    <View style={styles.iconContainer}>
                      <MaterialCommunityIcons 
                        name={renderNotificationIcon(notification.type)} 
                        size={24} 
                        color="#666" 
                      />
                    </View>
                  )}

                  {/* Content */}
                  {renderNotificationContent(notification)}
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#000'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600'
  },
  markAllRead: {
    fontSize: 14,
    color: '#666'
  },
  content: {
    flex: 1
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#F9FAFB'
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff'
  },
  unreadNotification: {
    backgroundColor: '#F9FAFB'
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  notificationContent: {
    flex: 1,
    marginRight: 12
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  timeText: {
    fontSize: 12,
    color: '#666'
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8
  },
  acceptButton: {
    flex: 1,
    marginVertical: 0
  },
  declineButton: {
    flex: 1,
    marginVertical: 0
  },
  scrollContent: {
    flexGrow: 1,
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  chatButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
}); 