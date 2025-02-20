import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ProfileLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen 
        name="index"
        options={{
          title: t('personal.profile.editProfile')
        }}
      />
      <Stack.Screen 
        name="edit"
        options={{
          title: t('personal.profile.editProfile')
        }}
      />
      <Stack.Screen 
        name="notifications"
        options={{
          title: t('notifications')
        }}
      />
    </Stack>
  );
} 