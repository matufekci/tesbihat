# Latin okunuş incelemesi: kapsam ve açık sorular

Bu bir **yazılı metin karşılaştırmasıdır**, sesli kıraat veya tecvid onayı değildir. Arapça ayet, uygulamanın Namaz Zamanı kaynaklı Latin metni ve aşağıdaki karşılaştırma sayfaları incelendi. Duruş (vakıf) ve devam (vasl) arasındaki fark, iki ayrı kaynak aynı hatayı paylaşabildiğinden birden çok sitede aynı ifadenin bulunmasıyla kesin çözülemez. Latin yazı Arapça sesleri eksiksiz aktaramaz. İnceleme devam etmektedir; tüm ayetlerin doğru olduğu sonucuna varılmamalıdır.

## Kaynakla karşılaştırılarak düzeltilen yerler

- Yâsîn 13: جَٓاءَهَا الْمُرْسَلُونَ için `câe hel` yerine `câehâl` kullanıldı. [Ayet ve okunuş](https://www.kuranvemeali.com/yasin-suresi/13-ayeti-meali).
- Yâsîn 80: اَخْضَرِ نَارًا sınırı `ahdari nâren` olarak ayrıldı. [Karşılaştırma](https://www.islamveihsan.com/yasin-suresi-turkce-okunusu.html).
- Vâkıa 6: مُنْبَثًّا için parantez içindeki alternatif, eksik baş kısmı tamamlanarak `munbessen` olarak yazıldı. [Karşılaştırma](https://dinirehberim.com/vakia-suresi-arapca-ve-turkce-oku.html).
- Vâkıa 83: الْحُلْقُومَ için duruş ve devam gösterimi `hulkûm(hulkûme)` olarak düzenlendi. [Karşılaştırma](https://dinirehberim.com/vakia-suresi-arapca-ve-turkce-oku.html).
- Önceki kontrol: Vâkıa 6, 47, 60, 64 kelime bölünmeleri ve Mülk 30 uzun ünlü ayrımı için bkz. [kaynak notları](QURAN_SOURCES.md).

## Kullanıcı / yetkin okuyucu araştırması için açık sorular

1. **Mülk 4 ve 9:** Kaynak metinde diğer ayetlerden farklı akademik işaretler (`Ś`, `ḣ`, `ż`, `(A)` gibi) var. Bunların uygulamadaki Türkçe okunuş düzenine nasıl uyarlanacağı, özellikle duruş/devam ve bağlantılar, uzman okuyucuyla kontrol edilmeli. [Mülk 9 karşılaştırma](https://hayalhanem.com/mulk-suresi/).
2. **Vâkıa 36:** Kaynaktaki `ebkârân(ebkâren)` yazımı ile başka okunuşlardaki `ebkârâ` veya `ebkâren` biçimleri farklı; duruş/devam ayrımı kontrol edilmeden metin değiştirilmedi. [Kaynak](https://www.namazzamani.net/kuranmeali/vakia-suresi-36.ayet.htm).
3. **Yâsîn 40:** `Leş şemsu` ve `lel leylu` şeklinde geleneksel bitişik okunuşlar, diğer yazım sistemlerinde farklı gösterilebiliyor; uzunluk/bağlantı uzman tarafından dinlenerek kontrol edilmeli. [Arapça ve kelimeler](https://www.kuranmakaleleri.com/kuran-i-kerim/36-yasin-suresi-40-ayeti/).
4. **Genel:** Parantezli duruş/devam gösterimi uygulamanın tamamında tutarlı ve kullanıcı için anlaşılır mı? Her ayetin sesli doğrulanması ayrıca gereklidir.

## Makine taramasının sınırı

Fâtiha dışındaki 284 ayetin numaraları İngilizce transliterasyon içeren [Quran JSON arşivi](https://github.com/oatmanelfarji/quran-cloud-json) ile eşleştirilerek ön tarama yapıldı. Arapça yazım, transliterasyon dili, vasl/vakıf ve karakter kuralları farklı olduğundan dizge benzerliği telaffuz doğruluğunu göstermez; otomatik sonuçlarla ayetler doğrulanmış sayılmamıştır. Başka bir JSON arşivinde sûre anahtarları ile metinlerin uyuşmadığı tespit edildiği için referans olarak kullanılmadı. Fâtiha ayrı metin alanında olduğundan bu taramanın kapsamına dahil değildir.

## q/k gösterimi: Nebe pilotu

Kullanıcının isteğiyle, **yalnızca Nebe suresinde** Arapça ق harfine denk gelen seçili `k` yazımları `q` ile işaretlendi; ك harfi `k` kalır. Örneğin 78:8 `halaqnâkum`, 78:12 `fevqakum`, 78:17 `kâne mîqâtâ(mîqâten)` biçimindedir. Parantez içindeki alternatifler de aynı şekilde düzenlendi. Metin Namaz Zamanı kaynaklıdır ancak bu uygulamada uyarlanmıştır.

Bu bir sınırlı yazılı denemedir: Fâtiha, Bakara, Yâsîn, Vâkıa, Haşr, Mülk, Nûh ve diğer dualar **henüz bu sisteme dönüştürülmedi**. Nebe'deki eşlemeler Diyanet Arapça metniyle kontrol edildi; sesli uzman incelemesi yapılmadı. Latin gösterim, vakıf/vasl ve diğer Arapça harflerin ses ayrımlarını eksiksiz karşılamaz. Özellikle duruş ve devamda telaffuz ayrımı ve metin kaynağındaki diğer şüpheli noktalar hâlâ ayrıca kontrol gerektirir.
