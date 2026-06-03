import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Must use physical device for push notifications');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

export async function scheduleHourlyReminder() {
  // Cancel existing reminders
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule every 2 hours for today's jobs
  const now = new Date();
  for (let hour = 1; hour <= 12; hour += 2) {
    const trigger = new Date(now);
    trigger.setHours(trigger.getHours() + hour);
    if (trigger.getHours() > 20) break; // Don't schedule late

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Job Reminder',
        body: 'You have jobs assigned for today. Check your dashboard!',
        sound: true,
      },
      trigger: { date: trigger, channelId: 'job-reminders' },
    });
  }
}

// Create notification channel for Android
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('job-reminders', {
      name: 'Job Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });
    await Notifications.setNotificationChannelAsync('updates', {
      name: 'Job Updates',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function showLocalNotification(title, body) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null, // immediate
  });
}

// Load assigned jobs and remind every 2h
export async function startJobReminders(jobs) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  const assignedJobs = jobs.filter(j => j.technician_id);
  if (assignedJobs.length === 0) return;

  const now = new Date();
  const intervals = [2, 4, 6, 8]; // hours from now

  for (const hours of intervals) {
    const trigger = new Date(now);
    trigger.setHours(trigger.getHours() + hours);
    if (trigger.getHours() > 20) break;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⚡ ${assignedJobs.length} Job${assignedJobs.length > 1 ? 's' : ''} Assigned`,
        body: assignedJobs.map(j => j.title).join(', ').slice(0, 100),
        sound: true,
        data: { screen: 'Dashboard' },
      },
      trigger: { date: trigger, channelId: 'job-reminders' },
    });
  }
}

// Listen for incoming notifications
export function setupNotificationListener(navigation) {
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    const screen = response.notification.request.content.data?.screen;
    if (screen && navigation) {
      navigation.navigate(screen);
    }
  });
  return responseListener;
}