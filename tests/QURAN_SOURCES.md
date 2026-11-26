# Arapça ayet metinleri: kaynak ve sınırlar

- Kaynak: kullanıcı tarafından Drive'da sağlanan Diyanet İşleri Başkanlığı'nın `kuran.docx` Word dosyası (SHA-256 `84a97f8455a660ee0b6559bbb8d76fc4031d341a43341183637af59f9abac8e6`). Diyanet bu Word dosyasını [Yayınlarımız](https://kuran.diyanet.gov.tr/yayinlarimiz) sayfasında sunmaktadır. Dosya depoya eklenmemiştir.
- `python3 scripts/import-diyanet-docx.py /path/to/kuran.docx` ile 114 sûre başlığı ve âyet numaralarının sırası denetlenir ve kullanılan 302 âyet seçilir. Dosyanın SHA-256 değeri farklıysa işlem durur. Word'deki Hamdullah fontuna özgü karakterler, mevcut Scheherazade New fontunun Unicode karakterlerine çevrilmiştir. Eşleme için [alperenugus/Kuran](https://github.com/alperenugus/Kuran) deposundaki 6411a76f41e986521da4cfb99a42221f767cbc89 sürümünün eşleme tablosu referans alınmıştır. Dosya sadece seçilen âyetleri içerir; ayet numaraları dışındaki metin boşlukları normalize edilmiş ve sayfa hizalama uzatmaları kaldırılmıştır.
- Fâtiha 1 ve sure başlarındaki besmele Word dosyasında tek `﷽` ligatürüyle gösterilir. Uygulamada okunabilirliği korumak için önceki Diyanet kaynaklı verideki açık besmele metni kullanılır; doğrudan Word'deki tek karakter değildir.
- Kullanılan kapsam: Fâtiha; Bakara 255, 285–286; Nisâ 103; A'râf 196; Tevbe 129; Hûd 56; İsrâ 45–46; Yâsîn; Vâkıa; Haşr 20–24; Mülk; Nuh; Nebe; İhlâs. Hıfz Hizbi'ndeki Hûd 56 ve Tevbe 129 alıntıları ayetin yalnızca mevcut dua metninde bulunan son kısımlarıdır. Diğer dua ve zikir ifadeleri ayrı kaynaklarından korunmuştur.
- İlk karşılaştırmada kullanılan diğer veri kümesi için [CC BY 4.0 lisans metni](../licenses/diyanet-mushaf-dataset-CC-BY-4.0.txt). Bu bildirim Diyanet'in olası ayrı yeniden yayınlama koşullarının araştırılmasının yerine geçmez.
- Türkçe ve diğer dillerdeki mealler değiştirilmemiştir. Türkçe meal daha önce Tanzil üzerinden Diyanet'e atıfla derlenmiştir.
- Mevcut SIL OFL lisanslı Scheherazade New fontunun Arapça alt kümesi kullanılır. Seçilen 400, 600 ve 700 ağırlıklarındaki fontlarda seçili âyet karakterlerinin glif eşlemesi kontrol edilmiştir; bu, cihazlarda şekillendirme ve dini içerik doğruluğunu garanti etmez.
- Harf/hareke dönüşümü ve dua içindeki kısmi alıntılar, yetkin bir okuyucu tarafından Diyanet mushafı ve gerçek Android cihaz üzerinde ayrıca kontrol edilmelidir.


## Latin harfli Fâtiha okunuşu

- Önceki Fâtiha okunuşu, Diyanet'e bağlı ilçe müftülüklerinin [Namaz Sureleri](https://webdosyasp.diyanet.gov.tr/muftuluk/UserFiles/zonguldak/Ilceler/gokcebey/UserFiles/Files/NAMAZ%20SURELERI_aefce231-e0e8-4b22-b5ef-ac9dea4b480d.pdf) ve [Namaz Sureleri (Polatlı)](https://webdosyasp.diyanet.gov.tr/muftuluk/UserFiles/ankara/Ilceler/polatli/UserFiles/Files/Namaz-Sureleri_841c5dfa-9269-4ebf-8c57-9050f1a224da.pdf) materyalleri karşılaştırılarak Türkçe okunurluk için boşluk ve noktalaması düzenlenerek verilmiştir; besmele Fâtiha'nın ilk ayeti olarak başa eklenmiştir. PDF metin çıkarımındaki açık karakter hataları Arapça ayetle karşılaştırılarak düzeltilmiştir. Diyanet Latin harflerinin Arapça telaffuzu tam karşılamadığını vurgular: [Kur’an’ı Latin harfleriyle okumak](https://www.diyanethaber.com.tr/kurani-latin-harfleriyle-okuyarak-hatim-etmek-caiz-midir).
- Fâtiha dışındaki Latin metinlerin kaynakları aşağıda belirtilmiştir; Diyanet kaynaklı Latin metin olarak sunulmamalıdır.


## Diğer surelerin Latin harfli okunuşları

- Önceki okunuşların kaynağı: [Açık Kuran](https://acikkuran.com), [Hafız Defteri veri arşivi](https://github.com/ekowaryans-cmd/hafiz-defteri/tree/5501e94d3673b41b087a4abb3a253b1a6534ab61/data/sure) üzerinden, `ok` alanından **değiştirilmeden** seçildi. Kaynak arşivinin belirttiği lisans [CC BY-NC-SA 4.0](../licenses/acik-kuran-CC-BY-NC-SA-4.0.txt): atıf, ticari olmayan kullanım ve uyarlamaları aynı lisansla paylaşma şartları geçerlidir. Bu koşullar ileride ticari kullanım veya reklam düşünülürse tekrar değerlendirilmelidir.
- Diyanet Word metniyle kaynak veri setindeki Arapça ayetlerin numaraları ve harf iskeletleri karşılaştırıldı (harekeler, yazı varyantları ve uzatma işaretleri normalize edilerek); 284 ayet eşleşti. Bu kontrol **Latin okunuşun doğruluğunun onaylandığı anlamına gelmez**. Diyanet'in bütün bu bölümler için yayımladığı doğrulanabilir bir Latin metin bulunamadı; kaynak Diyanet değildir.
- Veri seti ayet başına kaynakta verilen duruş/okuyuş biçimini korur; yazımda uzunluk işaretleri tutarlı değildir. Latin yazı Arapça harf ve tecvidi tam karşılamaz. Yetkin bir Kur'an okuyucusunun sesli tashihi yapılmamıştır.
- Hafız Defteri kaynak dosyaları SHA-256: `002` 9cef8d89745cfeb21111a87ab1a625a01521ea67d95feede2b9aa8551e8a28f5; `036` b9500aa7c9ebc1bc81c3221048f7eb892c27708153e064cde9c8f5dd7838aae1; `056` 3db1f8e02709eb38fb4ea78750f86761a8a7fd2378037f32c336b1baa16e184a; `059` c27a45c7d04842e7343c7aeb9262a37ccd3bf5fc47445050d97b03d5909614fe; `067` f1c7fb5fc1074cc7cffbbd9ee4fcaff9486f697729cc3005c4d5d2968693d9bf; `071` 1e0ca2777a41090ce73146afb6d63e76f46e7a93c17176b7573ec8dbfa23bbd5; `078` d579bd0a0782b22b8710b2148f3ec4d7a761edbdd31aedfc8ce008bbb4ac5668.

- Fâtiha, Bakara 285–286, Yâsîn 1–83, Vâkıa 1–96, Haşr 20–24, Mülk 1–30, Nûh 1–28 ve Nebe 1–40 Latin okunuşları [Namaz Zamanı](https://www.namazzamani.net/kuranmeali/) sayfalarından alınmıştır. Kullanıcının paylaştığı e-posta yanıtında Namaz Zamanı, Türkçe okunuşların uygulamada kullanılmasına izin vermiştir. Bu izin Açık Kuran lisansı değildir; siteye ait [kullanım koşulları](https://www.namazzamani.net/turkce/kullanim-kosullari.htm) ayrıca geçerlidir.

- Mülk 30’da Arapça بِمَٓاءٍ مَع۪ينٍ iki ayrı kelimedir; önceki "tekrar" şüphesi doğru değildi. Uzun ünlü ayrımını göstermek için kaynak metindeki ilk "maîn" yazımı "mâin" olarak düzeltildi. Mülk 4 ve 9 farklı aktarım işaretleri içerir; sesli doğrulama yapılmadı.

- Vâkıa 6, 47, 60 ve 64’te kaynakta kelime bölünmeleri düzeltilmiştir: munbessâ, ızâmen, mesbûkîn, tezreûnehû. Arapça ayetler ve [bağımsız Vâkıa okunuşu](https://www.islamveihsan.com/vakia-suresi.html) kontrol edildi. Bu, tüm ayetlerin bağımsız telaffuz denetimi değildir.

- Devam eden bağımsız yazılı kontrol ve açık sorular: [okunuş inceleme notları](TRANSLITERATION_REVIEW.md).
