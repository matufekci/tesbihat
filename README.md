# Tesbihat — Namaz Sonrası Zikir

Beş vaktin ardından okunan zikir, salavât, dua ve sureler için sayaçlı, anlık rehber. Web/PWA; Android'de ana ekrana eklenebilir, Capacitor + GitHub Actions ile APK üretilebilir.

## Özellikler

- 🕌 Açılışta içinde bulunulan vaktin zikir ekranı doğrudan açılır (çevrimdışı anında, online tazelemeli)
- 📖 Sırayla ilerleyen adımlar; sayaçlar anlık sayar; vakte özel katman + kapanış
- 🔤 Arapça metin + okunuş (yerel yazılar)
- 📍 Vakitler: çevrimdışı astronomik hesap (anında) + internet varsa Diyanet metoduyla güncelleme
- 🔔 Ezan sonrası hatırlatma bildirimi (web: uygulama açıkken; APK: gerçek alarm)
- 🌙 Koyu / açık tema · PWA kurulabilir · Android APK hazır

## Geliştirme

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # dist/ üretir
npm run preview   # üretim önizlemesi (0.0.0.0:4173)
```

## Android (APK)

`.github/workflows/apk.yml` her push'ta **debug APK** derleyip "Actions" sekmesinde artifact sunar.
Yerelde (Android SDK'lı makine): `npm run build && npx cap sync android && cd android && ./gradlew assembleDebug`
