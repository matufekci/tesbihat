# Ruhi Tesbihat — Namaz Sonrası Zikir

Beş vaktin ardından okunan zikir, salavât, dua ve sureler için sayaçlı, anlık rehber. Web/PWA; Android'de ana ekrana eklenebilir, Capacitor + GitHub Actions ile APK üretilebilir.

## İndir / Canlı Site

- 🌐 **Canlı site:** https://matufekci.github.io/tesbihat/
- 📱 **Son APK (debug):** https://github.com/matufekci/tesbihat/actions/runs/45549632742/artifacts/14992303659
  - Derleme: https://github.com/matufekci/tesbihat/actions/runs/45549632742 (commit `caebf4e`)
  - Artifact adı: `tesbihat-debug-apk` (~8,5 MB, 30 gün saklanır)

## Özellikler

- 🕌 Açılışta içinde bulunulan vaktin zikir ekranı doğrudan açılır (çevrimdışı anında, online tazelemeli)
- 📖 Sırayla ilerleyen adımlar; sayaçlar anlık sayar; vakte özel katman + kapanış
- 🔤 Sureler tam metin olarak, harekeler ve vakıf (durak) işaretleriyle birlikte gösterilir (Fâtiha, Yâsîn, Haşr 59:20–24, Nuh, Nebe, Vâkıa, Mülk, Bakara 2:285–286)
- 🔎 A−/A+ düğmeleriyle metin boyu; kısa sureler ve dualar için altta katlanabilir Türkçe anlam (Diyanet İşleri meal)
- 🔤 Arapça metin + okunuş (yerel yazılar)
- 📍 Vakitler: yaklaşık çevrimdışı astronomik hesap (anında) + internet varsa AlAdhan deneysel Diyanet yöntemiyle güncelleme; yerel yetkili takvimle karşılaştırın
- 🔔 Vakit başına açılıp kapatılabilen ve gecikmesi seçilebilen hatırlatmalar; sağlık ekranı (web: sekme açıkken; Android: yerel alarm, teslimat garanti değildir)
- 🔐 Yalnız çevrimdışı vakit hesabı seçeneği ve konum/saat dilimi uyarısı; çevrimiçi hesap seçili koordinatları AlAdhan’a gönderir. GPS yalnız istenirse alınır.
- 🌙 Koyu / açık / AMOLED / gül kurusu temalar · PWA kurulabilir · Android APK hazır

## Geliştirme

```bash
npm install
npm run dev       # http://localhost:5173
npm run lint      # statik kontrol
npm test          # birim ve veri testleri
npx playwright install --with-deps chromium
npm run test:e2e  # tarayıcı regresyon testleri
npm run build     # dist/ üretir
npm run preview   # üretim önizlemesi (0.0.0.0:4173)
```

Yayın öncesi sınırlamalar ve cihaz kontrolü için [yayına hazırlık notlarına](tests/RELEASE_READINESS.md) bakın.

## Android (APK)

`.github/workflows/apk.yml` **debug APK** derleyip "Actions" sekmesinde artifact sunar.
Son derleme: https://github.com/matufekci/tesbihat/actions/runs/45119734163
Yerelde (Android SDK'lı makine): `npm run build && npx cap sync android && cd android && ./gradlew assembleDebug`

## Künye

Kur’ân ayetlerinin Arapça yazımı, Diyanet’in Word dosyasından Unicode aktarımıyla alınmıştır; kaynak ve doğrulama sınırları için [ayet kaynağı notlarına](tests/QURAN_SOURCES.md) bakın. Türkçe meal değiştirilmemiştir; Diyanet İşleri Başkanlığı’na atıfla Tanzil.net üzerinden derlenmiştir. Dua metinleri ayrı kaynaklardan gelir.
