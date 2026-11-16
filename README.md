# Tesbihat — Namaz Sonrası Virdi

Seyyid Muhammed Ruhi el-Kadiri'nin beş vakit namaz sonrası virdi için rehberli web/PWA uygulaması. Android'de ana ekrana eklenebilir; Capacitor + GitHub Actions ile APK üretilebilir.

## Özellikler

- 📍 Konuma göre namaz vakitleri (Aladhan API · Diyanet metodu), çevrimdışı astronomik yedek
- 🔔 Ezan sonrası "Tesbihat zamanı" hatırlatması (web: uygulama açıkken; APK: gerçek alarm)
- 📿 Rehberli tesbihat: Arapça metin + okunuş + anlam, dokun-sayaç (33/33/33, 21, 12, 20/100/200…)
- 📖 Kaynak metnin tamamı "Metin" sekmesinde
- 🔥 Günlük seri (streak), bugünün tamamlanma durumu, toplam seans

## Geliştirme

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # dist/ üretir
npm run preview   # üretim önizlemesi (0.0.0.0:4173)
```

## Android (APK)

Depo bir Capacitor projesidir. `.github/workflows/apk.yml` her push'ta **debug APK** derleyip
"Actions" sekmesinde artifact olarak sunar; telefona indirip kurabilirsiniz.
Yerelde (Android SDK'lı bir makinede):

```bash
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug
```

## Kaynak

"Seyyid Muhammed Ruhi El-Kadiri Hz. Namaz Sonrası Tesbihatı DİKEY" — içerik birebir deşifre edilmiştir.
Dinî hüküm içermez; uygulama öncesi ilim ehline danışınız.
