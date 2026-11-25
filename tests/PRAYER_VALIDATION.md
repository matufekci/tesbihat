# Namaz vakti hesap doğrulaması

Bu testler zamanların resmî olduğunu veya her yerde, tarihte ve koşulda doğru olduğunu kanıtlamaz. Sayfalar zamanla değişebilir. Koordinatlar il merkezinin yaklaşık koordinatlarıdır. Yüksek enlemlerde bazı vakitler hesaplanamayabilir; yerel yetkili takvim esas alınmalıdır.

## Yöntem

AlAdhan method 13 (sağlayıcı tarafından deneysel olarak tanımlanır), `school=0` (standart ikindi) istenir. Sağlayıcı `Imsak` alanını `Fajr` öncesi önlem saati olarak verebilir; sabah başlangıcı için `Fajr` kullanılır. 16 Kasım 2026 Diyarbakır API örneğinde Fajr 05:29, Imsak 05:19, Asr 14:51; aşağıdaki Diyanet Haber tablosunda imsak 05:29, ikindi 14:51. Bu örnek tek başına tüm yer ve tarihleri doğrulamaz. API örneği: https://api.aladhan.com/v1/timings/16-11-2026?latitude=37.91&longitude=40.24&method=13&school=0

Çevrimdışı JS ve Android hesapları -18/-17 derece, standart ikindi ve AlAdhan method 13'ün dakika düzeltmelerini yaklaşık kullanır (güneş -7, öğle +5, ikindi +4, akşam +7). Resmî verinin kendisi değildir. Cihaz saat dilimi ve koordinatlar önemlidir.

## Sabit referans örnekleri

31 Aralık 2025 / 1 Ocak 2026 İstanbul örnekleri de yıl ve kış geçişi için test edilir: sırasıyla 06:50, 08:22, 13:12, 15:31, 17:52, 19:19 ([Sabah](https://www.sabah.com.tr/istanbul-namaz-vakitleri?ysclid=llcddodx2u315646313)) ve 06:50, 08:22, 13:12, 15:32, 17:53, 19:19 ([Haber7](https://www.haber7.com/namaz-vakitleri/istanbul)). Bu iki yayın resmî kaynak olarak doğrulanmamış üçüncü taraf tablolarıdır; yalnızca sınırlı karşılaştırmadır.

Testte saat dilimi Europe/Istanbul ve aşağıdaki tablolar için altı vakitte en fazla iki dakika tolerans kullanılır:

- Diyarbakır, 16 Kasım 2026: 05:29, 06:53, 12:09, 14:51, 17:14, 18:33 — https://www.diyanethaber.com.tr/diyarbakir-diyarbakir-namaz-vakitleri
- İstanbul, 16 Kasım 2026: 06:17, 07:45, 12:54, 15:28, 17:52, 19:15 — https://www.diyanethaber.com.tr/istanbul-istanbul-namaz-vakitleri
- Ankara, 16 Kasım 2026: 06:01, 07:27, 12:38, 15:16, 17:39, 19:01 — https://www.diyanethaber.com.tr/ankara-imsakiye
- Diyarbakır, 21 Mart 2026: 04:54, 06:15, 12:31, 15:57, 18:38, 19:54 — https://www.ntv.com.tr/namaz-vakitleri/diyarbakir/kayapinar (Kayapınar, yaklaşık il merkeziyle karşılaştırma)
- İstanbul, 21 Haziran 2026: 03:24, 05:25, 13:11, 17:11, 20:47, 22:38 — https://www.haber7.com/namaz-vakitleri/istanbul (üçüncü taraf yayımlanmış tablo; bağımsız resmî kaynak olduğu doğrulanmadı).

Android JVM testleri Java hesabını aynı JS sabit örnekleriyle karşılaştırır. Bunlar az sayıda örnektir; başka mevsim, ilçe, yurtdışı, yüksek enlem, DST ve farklı veri kaynakları için kapsamlı bağımsız doğrulama hâlâ gereklidir.
