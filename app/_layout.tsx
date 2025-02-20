import { Stack } from 'expo-router';
import { AuthProvider } from '../lib/auth/AuthContext';
import { LanguageProvider } from '../lib/i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n/i18n';
import { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { UserProvider } from '../lib/context';
import { configurePushNotifications } from '../lib/notifications/push';
import * as Notifications from 'expo-notifications';

// Configure default notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  // Handle RTL layout changes
  useEffect(() => {
    // This ensures RTL changes are applied immediately
    if (I18nManager.isRTL !== (i18n.language === 'ar')) {
      I18nManager.allowRTL(i18n.language === 'ar');
      I18nManager.forceRTL(i18n.language === 'ar');
    }

    // Initialize push notifications
    configurePushNotifications().catch(error => {
      console.warn('Error configuring push notifications:', error);
    });
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <AuthProvider>
          <UserProvider>
            <PaperProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </PaperProvider>
          </UserProvider>
        </AuthProvider>
      </LanguageProvider>
    </I18nextProvider>
  );
}