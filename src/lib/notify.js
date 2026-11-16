// Bildirim adaptörü: Android (Capacitor) → gerçek alarmla zamanlanmış yerel bildirim;
// Web → uygulama açıkken setTimeout + Notification API.
const isNative = () =>
  typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() === true

let scheduledIds = []

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

/** Mevcut zamanlanmışları iptal eder ve events listesini (Date[]) zamanlar. */
export async function scheduleReminders(events, { title = 'Tesbihat', body } = {}) {
  await cancelReminders()
  const upcoming = events.filter((e) => e.when.getTime() > Date.now())
  if (!upcoming.length) return { scheduled: 0 }

  if (isNative()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    scheduledIds = upcoming.map((_, i) => Date.now() % 100000 + i + 1)
    await LocalNotifications.schedule({
      notifications: upcoming.map((e, i) => ({
        id: scheduledIds[i],
        title: title,
        body: body ? body(e) : e.body,
        schedule: { at: e.when, allowWhileIdle: true },
        extra: { prayerId: e.prayerId },
        channelId: 'namaz-hatirlatma',
      })),
    })
    try {
      await LocalNotifications.createChannel({
        id: 'namaz-hatirlatma',
        name: 'Namaz Sonrası Tesbihat',
        description: 'Ezan sonrası tesbihat hatırlatmaları',
        importance: 5,
        visibility: 1,
        sound: 'default',
        vibration: true,
      })
    } catch { /* kanal zaten varsa yoksay */ }
    return { scheduled: upcoming.length, via: 'capacitor' }
  }

  // Web: yalnızca sekme açıkken ateşlenir (belgelendi)
  window.__tesbihatTimers?.forEach((t) => clearTimeout(t))
  window.__tesbihatTimers = upcoming.map((e) =>
    setTimeout(() => fireWeb(title, body ? body(e) : e.body, e), e.when.getTime() - Date.now())
  )
  return { scheduled: upcoming.length, via: 'web' }
}

export async function cancelReminders() {
  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const pending = await LocalNotifications.getPending()
      if (pending.notifications?.length) {
        await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })
      }
    } catch { /* yoksay */ }
  }
  window.__tesbihatTimers?.forEach((t) => clearTimeout(t))
  window.__tesbihatTimers = []
}

async function fireWeb(title, body, e) {
  try {
    if (navigator.vibrate) navigator.vibrate([120, 60, 120])
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg?.showNotification) {
        reg.showNotification(title, { body, icon: './icons/icon-192.png', badge: './icons/icon-192.png', tag: `tesbihat-${e.prayerId}` })
        return
      }
    }
    if (Notification.permission === 'granted') new Notification(title, { body, icon: './icons/icon-192.png' })
  } catch { /* kullanıcı bildirimi reddetmiş olabilir */ }
}

/** Hemen tek bildirim (test için) */
export async function notifyNow(title, body) {
  await fireWeb(title, body, { prayerId: 'test' })
}
