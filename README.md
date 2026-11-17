# Tesbihat — Namaz Sonrası Zikir

Beş vaktin ardından okunan zikir, salavât, dua ve sureler için sayaçlı, anlık rehber. Web/PWA; Android'de ana ekrana eklenebilir, Capacitor + GitHub Actions ile APK üretilebilir.

## Özellikler

- 🕌 Açılışta içinde bulunulan vaktin zikir ekranı doğrudan açılır (çevrimdışı anında, online tazelemeli)
- 📖 Sırayla ilerleyen adımlar; sayaçlar anlık sayar; vakte özel katman + kapanış
- 🔤 Sureler tam metin olarak, harekeler ve vakıf (durak) işaretleriyle birlikte gösterilir (Fâtiha, Yâsîn, Haşr 59:20–24, Nuh, Nebe, Vâkıa, Mülk, Bakara 2:285–286)
- 🔎 A−/A+ düğmeleriyle metin boyu; kısa sureler ve dualar için altta katlanabilir Türkçe anlam (Diyanet İşleri meal)
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

## Künye

Kur’ân metinleri Ḥafṣ rivâyetiyle, Tanzil Project’in kodladığı vakıf işaretleriyle gelir (CC-BY-3.0). Türkçe meal Diyanet İşleri Başkanlığı’na aittir (Tanzil.net üzerinden derlenmiştir).
