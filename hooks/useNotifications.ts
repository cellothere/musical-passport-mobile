import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { FLAGS } from '../constants/flags';
import { API_BASE_URL } from '../services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function scheduleDailyNotification() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Fetch tomorrow's country from the API so notification matches home screen
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().slice(0, 10);

  let country = 'the world';
  try {
    const res = await fetch(`${API_BASE_URL}/api/country-of-day?date=${tomorrowDate}`);
    if (res.ok) {
      const data = await res.json();
      country = data.country;
    }
  } catch {}

  const flag = FLAGS[country] ?? '🌍';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${flag} Today's Musical Passport`,
      body: `Explore ${country} - tap to discover`,
      data: { type: 'country_of_day', country },
    },
    // trigger: {
    //   type: Notifications.SchedulableTriggerInputTypes.DAILY,
    //   hour: 9,
    //   minute: 0,
    // },
    //for testing
        trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
    },
  });
}

export function useNotifications() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    (async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      await scheduleDailyNotification();
    })();
  }, []);
}
