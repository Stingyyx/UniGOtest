import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabase';

// Add the correct trigger type
import { TimeIntervalTriggerInput } from 'expo-notifications';

// Types
interface Schedule {
  id: string;
  route_name: string;
  departure_location: string;
  arrival_location: string;
  departure_time: string;
  arrival_time: string;
  days_of_week: string[];
  city: string;
  notes: string | null;
  schedule_type: 'regular' | 'flexible' | 'continuous' | 'last' | 'return';
}

interface NotificationData {
  scheduleId: string;
  notificationId: string;
  nextNotificationTime: string;
}

interface NotificationContent {
  title: string;
  body: string;
  data: any;
  sound: boolean | string;
  priority: string;
  vibrate: number[];
  channelId?: string;
}

const STORAGE_KEY = '@bus_notifications';
const CHANNEL_ID = 'bus-reminders';

// Add Arabic days mapping
const daysInArabic: { [key: string]: string } = {
  'sunday': 'الأحد',
  'monday': 'الإثنين',
  'tuesday': 'الثلاثاء',
  'wednesday': 'الأربعاء',
  'thursday': 'الخميس',
  'friday': 'الجمعة',
  'saturday': 'السبت'
};

const daysMap: { [key: string]: number } = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6
};

class BusNotificationService {
  private static instance: BusNotificationService;
  private notifications: Map<string, NotificationData> = new Map();
  private notificationCache: Map<string, boolean> = new Map();
  private pendingOperations: Map<string, Promise<any>> = new Map();
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    this.initPromise = this.initializeNotifications();
  }

  public static getInstance(): BusNotificationService {
    if (!BusNotificationService.instance) {
      BusNotificationService.instance = new BusNotificationService();
    }
    return BusNotificationService.instance;
  }

  private async initializeNotifications() {
    if (this.initialized) return;
    
    try {
      // Load saved notifications and check permissions in parallel
      const [savedNotifications, { status }] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        Notifications.getPermissionsAsync()
      ]);

      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          throw new Error('PERMISSION_ERROR');
        }
      }

      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications) as NotificationData[];
        parsed.forEach(notification => {
          this.notifications.set(notification.scheduleId, notification);
          this.notificationCache.set(notification.scheduleId, true);
        });
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: 'تذكير بالباص',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'bus-alaram-notfication.wav'
        });
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      this.initialized = false;
      throw error;
    }
  }

  public async checkPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
      }
      
      return true;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  private async ensureInitialized() {
    if (!this.initialized && this.initPromise) {
      await this.initPromise;
    }
  }

  private async saveNotifications() {
    try {
      const notificationsArray = Array.from(this.notifications.values());
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notificationsArray));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  public isNotificationScheduled(scheduleId: string): boolean {
    return this.notificationCache.get(scheduleId) || false;
  }

  public async scheduleNotification(schedule: Schedule, content: NotificationContent): Promise<string | null> {
    try {
      await this.ensureInitialized();

      // Check permissions first
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        throw new Error('PERMISSION_ERROR');
      }

      // Prevent concurrent operations
      if (this.pendingOperations.has(schedule.id)) {
        return this.pendingOperations.get(schedule.id);
      }

      const operation = (async () => {
        try {
          // Optimistic update
          this.notificationCache.set(schedule.id, true);

          // Quick check from cache
          const existingNotification = this.notifications.get(schedule.id);
          if (existingNotification) {
            return existingNotification.notificationId;
          }

          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) {
            throw new Error('AUTH_ERROR');
          }

          const notificationTime = this.calculateNextNotificationTime(schedule);
          const secondsUntilNotification = Math.max(
            1,
            Math.floor((notificationTime.getTime() - new Date().getTime()) / 1000)
          );

          const notificationDay = daysInArabic[schedule.days_of_week.find(day => 
            daysMap[day] === notificationTime.getDay()
          ) || 'sunday'];

          const notificationContent = {
            title: `تذكير بموعد الباص - ${notificationDay}`,
            body: `الباص من ${schedule.departure_location} إلى ${schedule.arrival_location} سينطلق في تمام الساعة ${schedule.departure_time}${schedule.notes ? `\n${schedule.notes}` : ''}`,
            sound: Platform.OS === 'ios' ? true : 'bus-alaram-notfication.wav',
            priority: Notifications.AndroidNotificationPriority.MAX,
            vibrate: [0, 250, 250, 250],
            data: { scheduleId: schedule.id }
          };

          // Generate ID first for consistency
          const favoriteId = uuidv4();

          const [notificationId, { error: dbError }] = await Promise.all([
            Notifications.scheduleNotificationAsync({
              content: notificationContent,
              trigger: {
                seconds: secondsUntilNotification,
                repeats: false,
                channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined
              }
            }),
            supabase.from('bus_schedule_favorites').upsert({
              id: favoriteId,
              user_id: session.user.id,
              schedule_id: schedule.id,
              created_at: new Date().toISOString()
            })
          ]);

          if (!notificationId || dbError) {
            if (notificationId) {
              await Notifications.cancelScheduledNotificationAsync(notificationId);
            }
            if (!dbError) {
              await supabase.from('bus_schedule_favorites')
                .delete()
                .eq('id', favoriteId);
            }
            throw new Error(dbError ? 'DB_ERROR' : 'NOTIFICATION_ERROR');
          }

          const notificationData: NotificationData = {
            scheduleId: schedule.id,
            notificationId,
            nextNotificationTime: notificationTime.toISOString()
          };

          this.notifications.set(schedule.id, notificationData);
          this.saveNotifications().catch(console.error);

          return notificationId;
        } catch (error: unknown) {
          this.notifications.delete(schedule.id);
          this.notificationCache.delete(schedule.id);
          
          if (error instanceof Error) {
            switch (error.message) {
              case 'PERMISSION_ERROR':
                throw new Error('يرجى السماح بالإشعارات من إعدادات التطبيق');
              case 'AUTH_ERROR':
                throw new Error('يرجى تسجيل الدخول أولاً');
              case 'DB_ERROR':
                throw new Error('حدث خطأ في حفظ التفضيلات');
              case 'NOTIFICATION_ERROR':
                throw new Error('فشل في جدولة الإشعار');
              default:
                throw new Error('حدث خطأ غير متوقع');
            }
          }
          throw new Error('حدث خطأ غير متوقع');
        } finally {
          this.pendingOperations.delete(schedule.id);
        }
      })();

      this.pendingOperations.set(schedule.id, operation);
      return operation;
    } catch (error) {
      console.error('Error in scheduleNotification:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('حدث خطأ غير متوقع');
    }
  }

  public async cancelNotification(scheduleId: string): Promise<boolean> {
    await this.ensureInitialized();

    if (this.pendingOperations.has(scheduleId)) {
      return this.pendingOperations.get(scheduleId);
    }

    const operation = (async () => {
      let savedNotificationData: NotificationData | undefined;
      try {
        // Optimistic update
        savedNotificationData = this.notifications.get(scheduleId);
        this.notifications.delete(scheduleId);
        this.notificationCache.delete(scheduleId);

        if (!savedNotificationData) return true;

        await Promise.all([
          Notifications.cancelScheduledNotificationAsync(savedNotificationData.notificationId).catch(() => {}),
          supabase.from('bus_schedule_favorites')
            .delete()
            .eq('schedule_id', scheduleId)
        ]);

        this.saveNotifications().catch(console.error);
        return true;
      } catch (error: unknown) {
        // Rollback on error
        if (savedNotificationData) {
          this.notifications.set(scheduleId, savedNotificationData);
          this.notificationCache.set(scheduleId, true);
        }
        console.error('Error canceling notification:', error);
        throw new Error('فشل في إلغاء الإشعار');
      } finally {
        this.pendingOperations.delete(scheduleId);
      }
    })();

    this.pendingOperations.set(scheduleId, operation);
    return operation;
  }

  public getActiveNotifications(): string[] {
    return Array.from(this.notificationCache.keys());
  }

  public async cleanup() {
    try {
      const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const validIds = new Set(Array.from(this.notifications.values()).map(n => n.notificationId));
      
      // Clean up any orphaned notifications
      for (const notification of allNotifications) {
        if (!validIds.has(notification.identifier)) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  private calculateNextNotificationTime(schedule: Schedule): Date {
    const now = new Date();
    const [hours, minutes] = schedule.departure_time.split(':').map(Number);
    
    // Create notification time for today
    const notificationTime = new Date(now);
    // Set to 3 minutes before departure
    notificationTime.setHours(hours, minutes - 3, 0, 0);

    // If time has passed today, move to tomorrow
    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }

    // Map days to numbers
    const scheduleDays = schedule.days_of_week.map(day => daysMap[day]);
    
    // If current day is not valid, find next valid day
    while (!scheduleDays.includes(notificationTime.getDay())) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }

    console.log('Scheduling notification:', {
      currentTime: now.toLocaleString(),
      notificationTime: notificationTime.toLocaleString(),
      schedule: {
        departure: schedule.departure_time,
        days: schedule.days_of_week
      }
    });

    return notificationTime;
  }
}

export const busNotificationService = BusNotificationService.getInstance(); 