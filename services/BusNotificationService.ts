const trigger = Platform.select({
  ios: {
    type: 'timeInterval' as const,
    seconds: secondsUntilNotification,
    repeats: false
  },
  android: {
    type: 'timeInterval' as const,
    seconds: secondsUntilNotification,
    channelId: CHANNEL_ID,
    repeats: false
  },
  default: {
    type: 'timeInterval' as const,
    seconds: secondsUntilNotification,
    repeats: false
  }
});

await Notifications.scheduleNotificationAsync({
  content: notificationContent,
  trigger,
}); 