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

### Android açılış ekranı
- Güncel APK'yı yükleyip uygulamayı zorla durdurun; başlatıcıdan açınca tam ekran sabit görselin gösterilmediğini ve uygulamanın açıldığını doğrulayın (soğuk açılış).
- Uygulamayı arka plana alın, yeniden başlatıcıdan ve son uygulamalar ekranından açın; tam ekran sabit görselin gösterilmediğini ve önceki durumun korunduğunu doğrulayın (sıcak açılış).
- İlk kurulumda karşılama ve izin seçeneklerinin, açılış ekranı kaybolduktan sonra kullanılabildiğini; izin/ayar ekranından dönüşte uygulamanın çalışmaya devam ettiğini doğrulayın.
- Android 11 ve Android 12+ cihazlarda açık/koyu tema, ekran döndürme ve erişilebilirlik ayarlarıyla kontrol edin.


## Android tekrarlanan hatırlatmalar (henüz cihazda doğrulanmadı)
- [ ] Mevcut bir sürümden güncelle, uygulamayı aç ve hatırlatmaları etkinleştir; eski planlanmış bildirimlerin çift uyarı oluşturmadığını kontrol et.
- [ ] Ayarlanan vaktin ardından uygulamayı kapat; ilgili hatırlatma gelsin ve sonraki gün tekrar planlansın. En az birkaç gün uygulamayı açmadan doğrula.
- [ ] Hatırlatmaları kapat; önceden planlanan ve sonraki günlere ait bildirimler gelmesin. Tekrar açıp konum, gecikme ve dili değiştir; eski planlar gelmesin.
- [ ] Telefonu yeniden başlat; cihaz kilidini açtıktan sonra uygulamayı açmadan hatırlatmaların devamını kontrol et.
- [ ] Saat ve saat dilimini değiştir; yeniden planlamayı, gece yarısını aşan gecikmeleri ve yaz saati geçişini kontrol et.
- [ ] Android 12+ kesin alarm izni verilmiş/verilmemiş ve Android 13+ bildirim izni reddedilmiş/sonradan verilmiş durumlarını dene; tam izin yoksa gecikme olabileceğini doğrula.
- [ ] Pil tasarrufu, Doze, üretici arka plan kısıtlamaları ve zorla durdurma sonrasında davranışı ayrı ayrı kaydet; zorla durdurmadan sonra uygulamayı tekrar aç.
- [ ] Eski sürümde ortak gecikmeyi değiştirip yükseltin; beş vakit önceki gecikmeyi korusun. Tek tek aç/kapat, farklı gecikmeler ve tümünün kapalı olması durumlarını, uygulama kapalıyken ve yeniden başlatma sonrası doğrulayın.
- [ ] Bildirim sağlık ekranını kanal kapalı, kesin alarm izni reddedilmiş/verilmiş, pil kısıtlı ve yeniden başlatma sonrası kontrol edin. Gösterilen planın gerçek alarm teslimi garantisi olmadığını doğrulayın.
- [ ] Sadece çevrimdışı seçeneğini açıp kapatın, yeniden başlatın; açıkken AlAdhan istekleri yapılmadığını ve GPS'in yalnız istekle alındığını ağ ve cihaz araçlarıyla doğrulayın.
- [ ] Farklı saat dilimlerinde seyahat, seçilen şehir ve cihaz saat dilimi değişimini, DST ve yüksek enlem koşullarını gerçek yerel takvimle karşılaştırın; saat dilimi uyarısının görünmesini doğrulayın.
