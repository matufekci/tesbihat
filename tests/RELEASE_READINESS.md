# Yayına hazırlık ve doğrulama notları

## Otomatik kontroller

- `npm ci`, `npm run lint`, `npm test`: bağımlılıklar, statik kontrol ve birim/veri testleri.
- `npx playwright install --with-deps chromium` ve `npm run test:e2e`: üretim derlemesinde açılış, küçük ekran, Arapça/RTL, ayarlar, adım listesi, sayaç kalıcılığı ve ilk çevrimiçi kurulumdan sonra çevrimdışı açılış.
- `npm run cap:sync`: web paketini Android projesine taşır. Android APK için JDK 17 ve Android SDK ile `npm run apk:debug` kullanılabilir.
- `.github/workflows/quality.yml` otomatik kontrolleri çalıştırır; APK iş akışı Java hesaplama testlerini çalıştırır ve debug APK derler. Manuel kontrol listesi: `tests/MANUAL_REGRESSION.md`.

## Dağıtım öncesi açık konular

- Gerçek Android cihaz/emülatörde kurulum, yükseltme, izinlerin reddi/geri alınması, bildirim kanalı, pil optimizasyonu, yeniden başlatma, tarih/saat dilimi değişimi, dokunma/titreşim ve TalkBack doğrulanmalıdır. Bu testler tarayıcı testleriyle ikame edilemez.
- Android hatırlatmaları yerel alarm alıcısı tarafından sonraki vakit için tekrar planlanır; cihaz yeniden başlatıldığında ve saat/saat dilimi değiştiğinde yenilenir. Gelecek günlerin saatleri yaklaşık çevrimdışı hesaplanır; mevcut gün için uygulamanın aldığı vakitler kullanılır. Bildirim/alarm izni, Doze, üretici pil kısıtları ve kullanıcı uygulamayı zorla durdurursa Android davranışı teslimi etkileyebilir; kesin zaman garantisi yoktur. Yeniden kurulum/güncelleme sonrası planın kurulması için uygulamayı açmak gerekir. Web hatırlatmaları yalnızca sekme açıkken çalışır. Android cihaz/emülatörde alarmın tetiklenmesi, kapanma, yeniden başlatma, izinler ve pil koşulları ayrıca doğrulanmalıdır.
- Vakit kaynakları ve örnek takvim karşılaştırmalarının ayrıntıları `tests/PRAYER_VALIDATION.md` içindedir. Üçüncü taraf örneklerin tamamı yetkili kaynak olarak doğrulanmamıştır; gerçek cihaz ve geniş kapsamlı takvim doğrulaması hâlâ gereklidir.
- Çevrimdışı vakit hesabı yaklaşık astronomik hesaptır; resmi takvimlerin düzeltmeleriyle aynı olduğu doğrulanmamıştır. Hesap cihazın saat dilimini kullanır; seçilen konum başka bir saat dilimindeyse sonuçların doğruluğu garanti edilmez. Yüksek enlemlerde bazı vakitler hesaplanamayabilir. İbadet saatleri için yerel yetkili takvimle karşılaştırılmalıdır.
- Dini metinlerin, meal atıflarının/lisanslarının ve çevirilerin uzman tarafından kaynaklarla birebir incelenmesi gerekir; otomatik kontroller bunların doğruluğunu veya lisans uygunluğunu kanıtlamaz.
- Üretim imzası, güvenli anahtar saklama, uygulama sürümleme/yükseltme, gizlilik politikası, veri güvenliği beyanları ve güncel mağaza hedef SDK koşulları ayrıca hazırlanmalıdır. Debug APK mağaza için uygun değildir. Hiçbir anahtar depoya eklenmemelidir.
- Üretim bağımlılıklarında `npm audit --omit=dev` sıfır açık rapor eder. Geliştirme araçları için `npm audit` Capacitor 6 CLI'nin `tar`/`rimraf` zincirinde açıklar rapor eder; bunlar son kullanıcı paketinde değildir fakat geliştirme/CI ortamı için risk oluşturur. Capacitor'un desteklenen güncel ana sürümüne geçiş, Android SDK/Gradle ve cihaz regresyonuyla birlikte ayrı yapılmalıdır; körlemesine `npm audit fix --force` uygulanmamalıdır.
- Çevrimdışı ilk kullanım, uygulama kabuğunun daha önce çevrimiçi olarak başarıyla önbelleğe alınmasını gerektirir. Yeni servis çalışanı, açık eski sekmeler kapandıktan sonra etkinleşir.

- Saat dilimi uyarısı cihaz üzerinde tz-lookup verisiyle yaklaşık konumdan bulunur; sınırlar ve IANA ad farklılıkları yanlış uyarı üretebilir. Zamanı kendiliğinden başka bölgeye dönüştürmez. Yalnız çevrimdışı seçeneği AlAdhan vakit isteklerini kapatır; tarayıcı kurulum/güncelleme ve cihazın konum sağlayıcısı ayrıca ağ kullanabilir.
- Bildirim sağlığındaki sonraki zaman uygulamanın kaydettiği plandır; işletim sisteminin alarmı teslim edeceğine dair kanıt değildir. İzin durumları ve her-vakit ayarlarının Android sürümleri, yeniden başlatma, cihaz pil kısıtları ve güncellemede gerçek cihazla doğrulanması gerekir.
