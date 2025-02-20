import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { notificationService, Notification, NotificationPreferences } from './service';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Record<string, Notification[]>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    const subscription = setupRealtimeSubscription();
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const notifs = await notificationService.getNotifications();
    const count = await notificationService.getUnreadCount();
    const prefs = await notificationService.getPreferences();
    
    setNotifications(notifs as Record<string, Notification[]>);
    setUnreadCount(count);
    setPreferences(prefs);
    setLoading(false);
  };

  const setupRealtimeSubscription = () => {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        loadNotifications
      )
      .subscribe();
  };

  const markAsRead = async (notificationId: string) => {
    const success = await notificationService.markAsRead(notificationId);
    if (success) {
      loadNotifications();
    }
    return success;
  };

  const markAllAsRead = async () => {
    const success = await notificationService.markAllAsRead();
    if (success) {
      loadNotifications();
    }
    return success;
  };

  const handleAction = async (notificationId: string, action: 'accept' | 'reject' | 'view' | 'dismiss') => {
    const success = await notificationService.handleAction(notificationId, action);
    if (success) {
      loadNotifications();
    }
    return success;
  };

  return {
    notifications,
    unreadCount,
    preferences,
    loading,
    refresh: loadNotifications,
    markAsRead,
    markAllAsRead,
    handleAction,
    updatePreferences: notificationService.updatePreferences,
  };
} 