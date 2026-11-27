import { tStatic } from './i18n.js'
// Bildirim adaptörü: Android (Capacitor) → gerçek alarmla zamanlanmış yerel bildirim;
// Web → uygulama açıkken setTimeout + Notification API.
const isNative = () =>
  typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() === true

// Serialize updates so a slow native schedule cannot undo a later cancellation.
let operation = Promise.resolve()
function enqueue(task) {
  const result = operation.then(task, task)
  operation = result.catch(() => {})
  return result
}

export async function notificationPermission() {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      let perm = await LocalNotifications.checkPermissions()
      if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions()
      return { granted: perm.display === 'granted', via: 'capacitor' }
    } catch (e) {
      return { granted: false, via: 'capacitor', error: String(e?.message || e) }
    }
  }
  if (typeof Notification === 'undefined') return { granted: false, via: 'web' }
  if (Notification.permission === 'granted') return { granted: true, via: 'web' }
  const res = await Notification.requestPermission()
  return { granted: res === 'granted', via: 'web' }
}

/** Schedule web timers or hand the recurring plan to the native Android scheduler. */
export function scheduleReminders(events, { title = 'Ruhi Tesbihat', body, nativePlan } = {}) {
  return enqueue(() => scheduleRemindersNow(events, { title, body, nativePlan }))
}

async function cancelLegacyAndroidReminders() {
  // Remove alarms from versions which used the old LocalNotifications scheduler.
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  const pending = await LocalNotifications.getPending()
  if (pending.notifications?.length) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })
  }
}

async function scheduleRemindersNow(events, { title, body, nativePlan }) {
  if (isNative()) {
    const planner = window.Capacitor?.Plugins?.ReminderPlanner
    if (!planner?.configure || !nativePlan) throw new Error('Android reminder planner unavailable')
    // Failure to remove the old schedule must be visible rather than silently create duplicates.
    await cancelLegacyAndroidReminders()
    await planner.configure({ ...nativePlan, title, channelName: tStatic('notifChannelName'), channelDescription: tStatic('notifChannelDesc') })
    return { scheduled: 'recurring', via: 'android' }
  }

  window.__tesbihatTimers?.forEach((timer) => clearTimeout(timer))
  const upcoming = events.filter((event) => event.when.getTime() > Date.now())
  window.__tesbihatNextEvents = upcoming.map((event) => ({ at: event.when.getTime(), prayerId: event.prayerId }))
  window.__tesbihatTimers = upcoming.map((event) =>
    setTimeout(() => fireWeb(title, body ? body(event) : event.body, event), event.when.getTime() - Date.now())
  )
  return { scheduled: upcoming.length, via: 'web' }
}

export function cancelReminders() {
  return enqueue(cancelRemindersNow)
}

async function cancelRemindersNow() {
  if (isNative()) {
    const planner = window.Capacitor?.Plugins?.ReminderPlanner
    if (!planner?.cancel) throw new Error('Android reminder planner unavailable')
    await planner.cancel()
    await cancelLegacyAndroidReminders()
  }
  window.__tesbihatTimers?.forEach((timer) => clearTimeout(timer))
  window.__tesbihatTimers = []
  window.__tesbihatNextEvents = []
}

async function fireWeb(title, body, e) {
  try {
    if (navigator.vibrate) navigator.vibrate([120, 60, 120])
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg?.showNotification) {
        await reg.showNotification(title, { body, icon: './icons/icon-192.png', badge: './icons/icon-192.png', tag: `tesbihat-${e.prayerId}` })
        return
      }
    }
    if (Notification.permission === 'granted') new Notification(title, { body, icon: './icons/icon-192.png' })
  } catch { /* kullanıcı bildirimi reddetmiş olabilir */ }
}

// Reports the scheduler's saved plan, not a guarantee of Android delivery.
export function reminderHealth() {
  return enqueue(async () => {
    if (isNative()) {
      const planner = window.Capacitor?.Plugins?.ReminderPlanner
      if (!planner?.status) return { via: 'android', unavailable: true }
      return { ...(await planner.status()), via: 'android' }
    }
    const events = (window.__tesbihatNextEvents ?? []).filter((e) => e.at > Date.now()).sort((a, b) => a.at - b.at)
    return { via: 'web', notificationsEnabled: typeof Notification !== 'undefined' && Notification.permission === 'granted', nextAt: events[0]?.at ?? 0 }
  })
}

export async function openReminderSystemSettings(type) {
  if (!isNative()) return false
  try {
    if (type === 'alarm') await window.Capacitor.Plugins.ReminderPlanner.openAlarmSettings()
    else await window.Capacitor.Plugins.SettingsLauncher.openAppSettings()
    return true
  } catch { return false }
}
