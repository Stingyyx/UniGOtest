import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../supabase';

export type NotificationType = 
  | 'ride_request'
  | 'ride_update'
  | 'ride_chat'
  | 'bus_alert'
  | 'food_order'
  | 'study_alert'
  | 'social_event'
  | 'system';

export type NotificationPreferences = {
  ride_requests: boolean;
  ride_updates: boolean;
  ride_chat: boolean;
  bus_alerts: boolean;
  food_orders: boolean;
  study_alerts: boolean;
  social_events: boolean;
  system_alerts: boolean;
  push_enabled: boolean;
};

export type PushNotificationData = {
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
};

/**
 * Configures push notifications for the app
 */
export async function configurePushNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  // Get push token
  const { data: tokenData } = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PROJECT_ID // Make sure to set this in your environment
  });

  // Save token to database
  await registerPushToken(tokenData);

  // Configure notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}

/**
 * Sends a push notification to a specific user
 * @param notification The notification data to send
 * @returns Promise<boolean> indicating success/failure
 */
export async function sendPushNotification(notification: PushNotificationData): Promise<boolean> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.message,
        data: notification.data || {},
        sound: true,
      },
      trigger: null,
    });
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Gets user's notification preferences
 * @returns Promise<NotificationPreferences>
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return null;
  }
}

/**
 * Updates user's notification preferences
 * @param preferences The new preferences to save
 */
export async function updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
  try {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
}

/**
 * Registers a push notification token for the current user
 * @param token The push notification token
 * @param deviceType Optional device type information
 */
export async function registerPushToken(token: string, deviceType?: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        token,
        device_type: deviceType,
      }, {
        onConflict: 'user_id, token'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error registering push token:', error);
    throw error;
  }
}

/**
 * Removes a push notification token for the current user
 * @param token The push notification token to remove
 */
export async function removePushToken(token: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .match({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        token,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error removing push token:', error);
    throw error;
  }
}

/**
 * Marks a notification as read
 * @param notificationId The ID of the notification to mark as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Gets all notifications for the current user
 * @param limit Optional limit of notifications to return
 * @param offset Optional offset for pagination
 * @returns Array of notifications
 */
export async function getUserNotifications(limit = 20, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
}

/**
 * Gets the count of unread notifications for the current user
 * @returns Promise<number>
 */
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
}

/**
 * Marks all notifications as read for the current user
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('read', false);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
} 