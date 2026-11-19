# Manual regression checklist

Run this checklist on representative Android devices before a release; automate the repeatable logic with `npm test`.

## Startup, offline use, and lifecycle
- [ ] Cold launch on a mid-range device: splash exits promptly and the first prayer view appears without waiting on the network.
- [ ] Launch with airplane mode enabled: prayer times are calculated locally; opening the app and navigation remain usable.
- [ ] While a guided prayer is active, background and resume the app, rotate/resize the window, and verify the current step/count remains intact.
- [ ] Add several counter taps, force-stop and reopen the app on the same day: progress is restored; reset affects only the selected prayer. Verify the next local calendar day starts fresh.
- [ ] Revoke notification/location permissions and retry: the app remains usable and reports failure without crashing.

## Accessibility and localization
- [ ] TalkBack: traverse onboarding, settings, prayer choices, switches, counters, next/back/close controls; labels and pressed/expanded states are meaningful, and counter updates are announced.
- [ ] Increase Android display/font size to the largest supported setting and use the in-app A−/A+ controls; text remains readable without clipping or blocking primary actions.
- [ ] Enable Android high-contrast text and inspect both light and dark themes, including selected/past prayer rows and focus indicators.
- [ ] Select System theme, change the Android light/dark appearance while the app is open, and verify the app follows it. Explicit dark, light, and AMOLED selections should remain unchanged by later system changes.
- [ ] Check Türkçe, English, Deutsch, Français, and Arabic; Arabic is RTL and Quran text remains legible.

## Device and Android compatibility
- [ ] Test one Android 6+ device/emulator and current Android, including notification permission/scheduling behavior where supported.
- [ ] Test compact phone, large phone, tablet, and foldable open/closed; resize/rotate while open and confirm content stays reachable and controls do not overlap.
- [ ] Run through the main prayer flow, settings, city/GPS selection, notifications on/off, PWA install prompt, and offline-to-online recovery.
- [ ] Complete a full prayer dhikr: the screen-wide celebration starts at the completion star and radiates outward; it plays once only at final completion. Intermediate-step checks and reopening an already-completed prayer do not replay it. With reduced motion enabled, only a static glow centered on the star is shown.
- [ ] From Settings, use the celebration preview button: it shows a preview star and radiates the effect from it without changing or completing dhikr progress; it can be replayed.
