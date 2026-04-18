import * as Haptics from 'expo-haptics';

let enabled = true;
export function setHapticsEnabled(value: boolean) { enabled = value; }

const guard = <T extends (...args: any[]) => any>(fn: T) =>
  ((...args: Parameters<T>) => { if (enabled) return fn(...args); }) as T;

export const haptics = {
  success: guard(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})),
  error: guard(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})),
  light: guard(() =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})),
  medium: guard(() =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})),
  heavy: guard(() =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {})),
  launch: guard(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}), 120);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}), 220);
  }),
};
