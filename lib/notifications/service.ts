import { supabase } from '../supabase';
import { Platform } from 'react-native';

export type NotificationType = 
  | 'ride_request'           // When someone wants to join a ride
  | 'ride_accepted'          // When driver accepts a join request
  | 'ride_rejected'          // When driver rejects a join request
  | 'ride_cancelled'         // When a ride is cancelled
  | 'ride_chat'             // New chat message in ride group
  | 'ride_ready'            // When ride is about to start
  | 'ride_completed'        // When ride is completed
  | 'bus_alert'
  | 'food_order'
  | 'study_alert'
  | 'social_event'
  | 'system';

export type RideNotificationMetadata = {
  ride_id: string;
  request_id?: string;
  passenger_id?: string;
  passenger_name?: string;
  driver_id?: string;
  driver_name?: string;
  from_location?: string;
  to_location?: string;
  departure_time?: string;
  message_id?: string;
  message_content?: string;
};

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

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, any>;
  read: boolean;
  created_at: string;
  updated_at: string;
};

class NotificationService {
  // Get user's notifications
  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
    return data;
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
    return true;
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
    return true;
  }

  // Get unread count
  async getUnreadCount() {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
    return count || 0;
  }

  // Get notification preferences
  async getPreferences() {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .single();

    if (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
    return data as NotificationPreferences;
  }

  // Update notification preferences
  async updatePreferences(preferences: Partial<NotificationPreferences>) {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        ...preferences,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
    return true;
  }

  // Register/Update push token
  async updatePushToken(token: string) {
    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        token,
        device_type: Platform.OS,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating push token:', error);
      return false;
    }
    return true;
  }

  // Get notifications requiring action
  async getActionRequired() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or('metadata->action_required.eq.true,and(type.eq.ride_request,metadata->status.eq.pending)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting action required notifications:', error);
      return [];
    }
    return data;
  }

  // Handle notification action
  async handleAction(notificationId: string, action: 'accept' | 'reject' | 'view' | 'dismiss') {
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification) {
      console.error('Error fetching notification:', fetchError);
      return false;
    }

    // Handle different notification types
    switch (notification.type) {
      case 'ride_request':
        if (action === 'accept' || action === 'reject') {
          const { error } = await supabase.rpc('handle_ride_request', {
            request_id: notification.metadata.request_id,
            status: action
          });
          if (error) {
            console.error('Error handling ride request:', error);
            return false;
          }
        }
        break;

      case 'system':
        // Mark as read for system notifications
        await this.markAsRead(notificationId);
        break;

      default:
        // For other types, just mark as read
        if (action === 'dismiss') {
          await this.markAsRead(notificationId);
        }
    }

    return true;
  }

  // Create a new notification
  async create(notification: Omit<Notification, 'id' | 'read' | 'created_at' | 'updated_at'>) {
    const { error } = await supabase
      .from('notifications')
      .insert([notification]);

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }
    return true;
  }

  // Delete a notification
  async delete(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
    return true;
  }

  async sendRideNotification(
    type: NotificationType,
    recipientId: string,
    metadata: RideNotificationMetadata
  ) {
    try {
      const notification = {
        user_id: recipientId,
        type,
        title: this.getRideNotificationTitle(type, metadata),
        message: this.getRideNotificationMessage(type, metadata),
        metadata
      };

      const { error } = await supabase
        .from('notifications')
        .insert([notification]);

      if (error) throw error;

      // Send push notification if enabled
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('push_enabled, ride_updates, ride_requests, ride_chat')
        .eq('user_id', recipientId)
        .single();

      if (preferences?.push_enabled) {
        const shouldSend = this.shouldSendPushNotification(type, preferences);
        if (shouldSend) {
          await this.sendPushNotification({
            to: recipientId,
            title: notification.title,
            body: notification.message,
            data: {
              type,
              ...metadata
            }
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Error sending ride notification:', error);
      return false;
    }
  }

  private getRideNotificationTitle(type: NotificationType, metadata: RideNotificationMetadata): string {
    switch (type) {
      case 'ride_request':
        return 'طلب انضمام جديد';
      case 'ride_accepted':
        return 'تم قبول طلبك';
      case 'ride_rejected':
        return 'تم رفض طلبك';
      case 'ride_cancelled':
        return 'تم إلغاء الرحلة';
      case 'ride_chat':
        return 'رسالة جديدة في المحادثة';
      case 'ride_ready':
        return 'الرحلة جاهزة للانطلاق';
      case 'ride_completed':
        return 'تم اكتمال الرحلة';
      default:
        return 'تحديث في الرحلة';
    }
  }

  private getRideNotificationMessage(type: NotificationType, metadata: RideNotificationMetadata): string {
    switch (type) {
      case 'ride_request':
        return `${metadata.passenger_name} يريد الانضمام إلى رحلتك`;
      case 'ride_accepted':
        return `تم قبول طلب انضمامك إلى الرحلة من ${metadata.from_location} إلى ${metadata.to_location}`;
      case 'ride_rejected':
        return 'عذراً، تم رفض طلب انضمامك إلى الرحلة';
      case 'ride_cancelled':
        return 'تم إلغاء الرحلة من قبل السائق';
      case 'ride_chat':
        return metadata.message_content || 'رسالة جديدة في محادثة الرحلة';
      case 'ride_ready':
        return `الرحلة جاهزة للانطلاق في تمام ${metadata.departure_time}`;
      case 'ride_completed':
        return 'شكراً لاستخدام خدمة وصلني. نتمنى أن تكون رحلتك ممتعة';
      default:
        return 'هناك تحديث في الرحلة';
    }
  }

  private shouldSendPushNotification(
    type: NotificationType,
    preferences: NotificationPreferences
  ): boolean {
    switch (type) {
      case 'ride_request':
        return preferences.ride_requests;
      case 'ride_accepted':
      case 'ride_rejected':
      case 'ride_cancelled':
      case 'ride_ready':
      case 'ride_completed':
        return preferences.ride_updates;
      case 'ride_chat':
        return preferences.ride_chat;
      default:
        return true;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService(); 