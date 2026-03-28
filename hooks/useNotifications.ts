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

async function scheduleUpcomingNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  let upcoming: { date: string; country: string }[] = [];
  try {
    const res = await fetch(`${API_BASE_URL}/api/country-of-day/upcoming?days=7`);
    if (res.ok) upcoming = await res.json();
  } catch {}

  for (const { date, country } of upcoming) {
    const [year, month, day] = date.split('-').map(Number);
    const fireAt = new Date(year, month - 1, day, 9, 0, 0);

    // Skip dates that have already passed today
    if (fireAt <= new Date()) continue;

    const flag = FLAGS[country] ?? '🌍';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${flag} Today's Musical Passport`,
        body: `Explore ${country} — tap to discover`,
        data: { type: 'country_of_day', country },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
      },
    });
  }
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

      await scheduleUpcomingNotifications();
    })();
  }, []);
}
