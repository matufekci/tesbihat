// Namaz sonrası zikir, salavât, dua ve sureler — her vakit için ortak bölüm + vakte özel katman + kapanış.

export const VAKITLAR = [
  { id: 'imsak', name: 'İmsak', key: 'Imsak' },
  { id: 'gunes', name: 'Güneş', key: 'Sunrise' },
  { id: 'ogle', name: 'Öğle', key: 'Dhuhr' },
  { id: 'ikindi', name: 'İkindi', key: 'Asr' },
  { id: 'aksam', name: 'Akşam', key: 'Maghrib' },
  { id: 'yatsi', name: 'Yatsı', key: 'Isha' },
]

export const NAMAZ_IDS = ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi']

export const NAMAZ_META = {
  sabah:  { name: 'Sabah Namazı',  vakit: 'Sabah',  sonrasi: 'Sabah namazı sonrası' },
  ogle:   { name: 'Öğle Namazı',   vakit: 'Öğle',   sonrasi: 'Öğle namazı sonrası' },
  ikindi: { name: 'İkindi Namazı', vakit: 'İkindi', sonrasi: 'İkindi namazı sonrası' },
  aksam:  { name: 'Akşam Namazı',  vakit: 'Akşam',  sonrasi: 'Akşam namazı sonrası' },
  yatsi:  { name: 'Yatsı Namazı',  vakit: 'Yatsı',  sonrasi: 'Yatsı namazı sonrası' },
}

const AYETUL_KURSI = {
  arabic: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
  latin: 'Allâhü lâ ilâhe illâ Hüve’l-Hayyü’l-Kayyûm. Lâ te’huzühû sinetün velâ nevm. Lehû mâ fissemâvâti vemâ fil-ard. Menzellezî yeşfeu indehû illâ bi’iznih. Ya’lemü mâ beyne eydîhim vemâ halfehüm. Velâ yühîtûne bişey’im min ilmihî illâ bimâ şâe. Vesi’a kürsiyyühüssemâvâti vel-ard. Velâ yeûdühû hıfzuhümâ ve hüvel-aliyyü’l-azîm.',
  meaning: 'Allah — O’ndan başka ilâh yoktur; diridir, kayyûmdur. O’nu ne bir uyuklama tutar ne de uyku. Göklerde ve yerde ne varsa O’nundur. O’nun izni olmaksızın katında kim şefaat edebilir? O, önlerindekini ve arkalarındakini bilir. O’nun ilminden — dilediği kadarı hariç — hiçbir şey kavrayamazlar. Kürsüsü gökleri ve yeri kaplamıştır; onların korunması O’na ağır gelmez. O yücedir, büyüktür. (Bakara 2:255)',
}

const HAŞR5 = {
  arabic: null,
  latin: 'Lev enzelnâ…',
  meaning: 'Haşr Suresi’nin son beş ayeti (59:21–24; “Lev enzelnâ hâze’l-Kur’âne alâ cebelin…” ile başlar).',
  note: 'Okumadan ÖNCE 3 defa şu istiâze çekilir: أَعُوذُ بِاللَّهِ السَّمِيعِ الْعَلِيمِ مِنَ الشَّيْطَانِ الرَّجِيمِ — E’ûzü billâhi’s-semî’ıl-‘alîmi mine’ş-şeytâni’r-racîm. Sure bitene kadar SAĞ EL BAŞA KONULUR.',
}

// 5 vakitte de aynı olan bölüm (Adım 1–12)
export const COMMON_STEPS = [
  {
    id: 'istigfar', title: 'İstiğfar', type: 'counter', target: 3,
    arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ، الْحَيَّ الْقَيُّومَ، وَأَتُوبُ إِلَيْهِ',
    latin: 'Estağfirullâhel’azîm ellezî lâ ilâhe illâ Hû, el-Hayye’l-Kayyûme ve etûbü ileyh.',
    meaning: 'Kendisinden başka ilâh olmayan, Hayy ve Kayyûm olan Azîm Allah’tan af dilerim ve O’na tövbe ederim.',
  },
  {
    id: 'selam', title: 'Selâm Zikri', type: 'read',
    arabic: 'اَللّٰهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    latin: 'Allâhümme ente’s-selâmü ve minke’s-selâm, tebârekte yâ ze’l-celâli ve’l-ikrâm.',
    meaning: 'Allah’ım! Sen Selâm’sın, selâm Sendendir. Ne yücesin ey Celâl ve İkrâm sahibi!',
    note: 'Namazdan çıkışın sünnetidir.',
  },
  {
    id: 'zikr-duasi', title: 'Zikir ve Şükre Yardım Duası', type: 'read',
    arabic: 'اَللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ، وَشُكْرِكَ، وَحُسْنِ عِبَادَتِكَ وَلَا تَجْعَلْنِي مِنَ الْغَافِلِينَ',
    latin: 'Allâhümme e’innî ‘alâ zikrike ve şükrike ve hüsni ‘ibâdetike ve lâ tec’alnî mine’l-ğâfilîn.',
    meaning: 'Allah’ım! Seni zikretmeme, Sana şükretmeme ve Sana en güzel şekilde kulluk etmeme bana yardım et; beni gafillerden eyleme.',
  },
  {
    id: 'euzu-besmele', title: 'Eûzü-Besmele', type: 'read',
    arabic: 'أَعُوذُ بِاللّٰهِ مِنَ الشَّيْطَانِ الرَّجِيمِ بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ',
    latin: 'E’ûzü billâhi mine’ş-şeytâni’r-racîm. Bismillâhir-rahmânir-rahîm.',
    meaning: 'Kovulmuş şeytandan Allah’a sığınırım. Rahmân ve Rahîm olan Allah’ın adıyla.',
    note: 'Âyetü’l-Kürsî’ye başlamadan önce.',
  },
  {
    id: 'ayetul-kursi', title: 'Âyetü’l-Kürsî', type: 'read',
    ...AYETUL_KURSI,
    note: 'Bakara Suresi’nin 255. ayeti.',
  },
  {
    id: 'tesbih', title: 'Sübhânallâh', type: 'counter', target: 33,
    arabic: 'سُبْحَانَ اللهِ', latin: 'Sübhânallâh',
    meaning: 'Allah’ı her türlü eksiklik ve noksanlıktan tenzih ederim.',
  },
  {
    id: 'hamd', title: 'Elhamdülillâh', type: 'counter', target: 33,
    arabic: 'اَلْحَمْدُ لِلّٰهِ', latin: 'Elhamdülillâh',
    meaning: 'Hamd, övgü ve şükür Allah’a mahsustur.',
  },
  {
    id: 'tekbir', title: 'Allâhü Ekber', type: 'counter', target: 33,
    arabic: 'اَللّٰهُ اَكْبَرُ', latin: 'Allâhü Ekber',
    meaning: 'Allah her şeyden yücedir, en büyüktür.',
  },
  {
    id: 'tahlil', title: 'Tahlil ile Tamamlama', type: 'counter', target: 1,
    arabic: 'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ، وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    latin: 'Lâ ilâhe illallâhü vahdehû lâ şerîke leh, lehü’l-mülkü ve lehü’l-hamdü ve hüve ‘alâ külli şey’in kadîr.',
    meaning: 'Allah’tan başka ilâh yoktur; O birdir, ortağı yoktur. Mülk O’nundur, hamd O’nadır; O her şeye hakkıyla gücü yetendir.',
    note: '33 + 33 + 33’ü yüze tamamlayan kapanış tehlilidir.',
  },
  {
    id: 'dua', title: 'Dua', type: 'read',
    arabic: null, latin: null,
    meaning: 'Sonra dua edilir. Ellerini aç ve gönlünden geçen her dileği Allah’a arz et.',
    note: 'Dilediğin dille, dilediğin kadar dua edebilirsin.',
  },
  {
    id: 'la-ilahe', title: 'Lâ ilâhe illallâh', type: 'counter', target: 20, targetOptions: [20, 100, 200],
    arabic: 'لَا إِلَهَ إِلَّا اللّٰهُ', latin: 'Lâ ilâhe illallâh',
    meaning: 'Allah’tan başka ilâh yoktur.',
    note: 'En az 20 defa okunur; vaktin varsa 200 defa. Hedefi aşağıdaki düğmelerden değiştirebilirsin.',
  },
  {
    id: 'salavat', title: 'Salâvat-ı Şerîfe (4 Yüce Sıfatla)', type: 'read',
    latin: 'Allâhümme salli ve sellim ve bârik ‘alâ … (seyyidinâ / habîbinâ / es’adinâ / şefî’inâ) Muhammedin ve ‘alâ âlihî ‘adede in’âmillâhi ve ifdâlih.',
    arabic: [
      'اَللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى اٰلِهِ عَدَدَ إِنْعَامِ اللّٰهِ وَإِفْضَالِهِ',
      'اَللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى حَبِيبِنَا مُحَمَّدٍ وَعَلَى اٰلِهِ عَدَدَ إِنْعَامِ اللّٰهِ وَإِفْضَالِهِ',
      'اَللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى أَسْعَدِنَا مُحَمَّدٍ وَعَلَى اٰلِهِ عَدَدَ إِنْعَامِ اللّٰهِ وَإِفْضَالِهِ',
      'اَللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى شَفِيعِنَا مُحَمَّدٍ وَعَلَى اٰلِهِ عَدَدَ إِنْعَامِ اللّٰهِ وَإِفْضَالِهِ',
    ],
    meaning: 'Allah’ın nimetleri ve lütufları sayısınca Allah’ım Peygamberimiz Muhammed’e ve âline salât, selâm ve berekât ihsan eyle: …Efendimize (seyyidinâ), Sevgilimize (habîbinâ), En bahtiyarımıza (es’adinâ), Şefaatçimize (şefî’inâ).',
    note: 'Dört sıfatın dördü de ayrı ayrı okunur. “Adede in’âmillâhi ve ifdâlih” = Allah’ın nimet ve lütufları sayısınca.',
  },
  {
    id: 'salaten-tuncinâ', title: 'Salâten Tüncînâ', type: 'read',
    arabic: 'صَلَاةً تُنْجِينَا بِهَا مِنْ جَمِيعِ الْأَهْوَالِ وَالْاٰفَاتِ وَتَقْضِي لَنَا بِهَا جَمِيعَ الْحَاجَاتِ وَتُطَهِّرُنَا بِهَا مِنْ جَمِيعِ السَّيِّئَاتِ وَتَرْفَعُنَا بِهَا عِنْدَكَ أَعْلَى الدَّرَجَاتِ وَتُبَلِّغُنَا بِهَا أَقْصَى الْغَايَاتِ مِنْ جَمِيعِ الْخَيْرَاتِ فِي الْحَيَاةِ وَبَعْدَ الْمَمَاتِ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ',
    latin: 'Salâten tüncînâ bihâ min cemî’il-ehvâli ve’l-âfât. Ve takdî lenâ bihâ cemî’al-hâcât. Ve tütahhirunâ bihâ min cemî’is-seyyiât. Ve terfe’unâ bihâ ‘ındeke a’led-deracât. Ve tübelliğunâ bihâ aksal-ğâyât, min cemî’il-hayrât fi’l-hayâti ve ba’de’l-memât. Birahmetike yâ erhamer-râhimîn.',
    meaning: 'Bize onunla her türlü korku ve âfetten kurtuluşu, bütün ihtiyaçlarımızın yerine gelmesini, her türlü günahtan temizlenmemizi, Senin katında en yüce derecelere yükselmemizi ve dünya ile âhirette tüm hayırların en son gayelerine ulaşmamızı ihsan edeceğin bir salât… Rahmetin hakkı için ey merhametlilerin en merhametlisi!',
    note: 'Adet belirtilmemiştir.',
  },
]

const HASR5_STEP = (id) => ({ id, title: 'Haşr Suresi’nin Son 5 Ayeti', type: 'read', ...HAŞR5 })

// Namaza özel katman (Adım 13+)
const PRAYER_STEPS = {
  sabah: [
    {
      id: 'celal-21', title: 'Yâ Ze’l-Celâli ve’l-İkrâm', type: 'counter', target: 21,
      arabic: 'يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', latin: 'Yâ ze’l-celâli ve’l-ikrâm',
      meaning: 'Ey Celâl ve İkrâm sahibi!',
      note: 'Yâsîn okunmadan ÖNCE 21 defa.',
    },
    {
      id: 'yasin', title: 'Yâsîn Suresi (36)', type: 'read',
      meaning: 'Yâsîn Suresi’nin tamamı okunur.',
      note: '58. ayete (سَلَامٌ قَوْلًا مِنْ رَبٍّ رَحِيمٍ — Selâmün kavlen min rabbin rahîm, “Merhametli Rab’den bir söz olarak selâm!”) gelindiğinde bu ayet 12 DEFA tekrar edilir.',
    },
    HASR5_STEP('hasr-sabah'),
  ],
  ogle: [
    {
      id: 'nuh', title: 'Nuh Suresi (71) — isteğe bağlı', type: 'read', optional: true,
      meaning: 'Öğle namazı sonrası için özel bir sure belirtilmemiştir.',
      note: 'İsteyen Nuh Suresi’ni okuyabilir.',
    },
  ],
  ikindi: [
    {
      id: 'nebe', title: 'Nebe Suresi (78)', type: 'read',
      meaning: 'Nebe Suresi okunur.',
    },
  ],
  aksam: [
    {
      id: 'vakia', title: 'Vâkıa Suresi (56)', type: 'read',
      meaning: 'Vâkıa Suresi okunur.',
      note: '76. ayete (وَإِنَّهُ لَقَسَمٌ لَوْ تَعْلَمُونَ عَظِيمٌ — Ve innehû lekasemun lev ta’lemûne ‘azîm) gelindiğinde rızık duasını oku. Ardından فَسَبِّحْ بِاسْمِ رَبِّكَ الْعَظِيمِ ile sure sonuna kadar okunur. (Mushafta bu ayet 56:96’dır.)',
    },
    {
      id: 'rizik-duasi', title: 'Rızık Duası (Vâkıa 76. ayet duası)', type: 'read',
      arabic: 'اللَّهُمَّ يَا مَنْ هُوَ هَكَذَا وَلَا يَزَالُ، أَسْأَلُكَ بِأَزَلِيَّتِكَ فِي دَيْمُومِيَّةِ وَحْدَانِيَّتِكَ، وَبِكُلِّ آلَائِكَ، وَبِقِدَمِ ذَاتِكَ الْكَرِيمَةِ، بِجَلَالِ الْجَلَالِ، بِكَمَالِ الْكَمَالِ، بِقَهْرِ قَهْرِ مَيْمُونِ وَحْدَانِيَّتِكَ، بِحَقِّ صَمَدَانِيَّتِكَ، يَا أَوَّلُ يَا آخِرُ، بِالْحَوْلِ وَالطَّوْلِ، وَالْهَيْبَةِ وَالْعَظَمَةِ وَالْعَرْشِ وَالْكُرْسِيِّ، وَبِجَاهِ سَيِّدِنَا مُحَمَّدٍ الْقُرَشِيِّ (صلى الله عليه وسلم)؛ أَنْ تُيَسِّرَ لِي رِزْقِي بِلَا تَعَبٍ وَلَا مَنٍّ مِنْ أَحَدٍ، وَاجْعَلْهُ سَبَبًا لِعُبُودِيَّتِكَ، وَمُشَاهَدَةً لِأَحْكَامِ الرُّبُوبِيَّةِ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ وَلَا أَقَلَّ مِنْ ذَلِكَ أَلَا إِلَى اللهِ تَصِيرُ الْأُمُورُ',
      latin: 'Allâhümme yâ men hüve hâkezâ ve lâ yezâl, es’elüke bi-ezeliyyetike fî deymûmiyyeti vahdâniyyetike ve bi-külli âlâike ve bi-kıdemi zâtike’l-kerîmeti bi-celâli’l-celâli, bi-kemâli’l-kemâli, bi-kahri kahri meymûni vahdâniyyetike bi-hakkı samedâniyyetike, yâ Evvelü yâ Âhiru, bi’l-havli ve’t-tavli ve’l-heybeti ve’l-‘azameti ve’l-‘arşi ve’l-kürsiyyi, ve bi-câhi seyyidinâ Muhammedini’l-Kuraşiyyi (sallallâhu aleyhi ve sellem) en tüyessira lî rızkî bilâ te’abin ve lâ mennin min ehadin vec’alhü sebeben li-‘ubûdiyyetike ve müşâhedeten li-ahkâmi’r-rubûbiyyeti ve lâ tekilnî ilâ nefsî tarfete ‘aynin ve lâ ekalle min zâlik. Elâ ilallâhi tesîru’l-umûr.',
      meaning: 'Allah’ım! Ezelîliğinle, birliğinin devamlılığıyla, bütün nimetlerinle; celâlinin celâli, kemâlinin kemâli hürmetine; Samedâniyetinin hakkı için; yâ Evvel, yâ Âhir; kudret, kuvvet, heybet, azamet, Arş ve Kürsî hürmetine; Efendimiz Muhammed el-Kuraşî’nin (s.a.v.) câhı hakkına: rızkımı hiçbir yorgunluk çekmeden, hiç kimsenin minneti olmaksızın kolaylaştırmanı; onu kulluğuma ve rubûbiyet hükümlerini müşahede etmeme vesile kılmanı; beni bir göz kırpması — hatta ondan daha azı — kadar bile nefsime bırakmamanı Senden dilerim. Bilesiniz ki bütün işler Allah’a döner.',
    },
    {
      id: 'esma-7', title: '7 Esmâ-i Hüsnâ', type: 'counter', target: 4,
      arabic: 'كَرِيمٌ، بَاسِطٌ، فَتَّاحٌ، رَزَّاقٌ، غَنِيٌّ، مُغْنِي، مُتَفَضِّلٌ',
      latin: 'Kerîmün, Bâsitun, Fettâhun, Rezzâkun, Ganiyyun, Muğnî, Mütefaddılun',
      meaning: 'Kerîm (Cömert), Bâsit (Genişleten/Açan), Fettâh (Fetheden), Rezzâk (Rızık veren), Ganiyy (Zengin), Muğnî (Zenginleştiren), Mütefaddıl (Lütfeden).',
      note: 'Dördü birden 4 defa.',
    },
    HASR5_STEP('hasr-aksam'),
  ],
  yatsi: [
    {
      id: 'mulk', title: 'Mülk Suresi (67)', type: 'read',
      meaning: 'Mülk Suresi okunur.',
    },
    {
      id: 'amenerrasulu', title: 'Âmenerrasûlü (Bakara 2:285–286)', type: 'read',
      meaning: 'Bakara Suresi’nin son iki ayeti — Âmenerrasûlü — okunur.',
    },
  ],
}

export const CLOSING_STEP = {
  id: 'fatiha-ruh', title: 'Fâtiha-i Şerîfe (Ruhlar İçin)', type: 'read',
  meaning: 'Her namaz sonrası son olarak Fâtiha-i Şerîfe okunur.',
  note: 'Sevabı: Hz. Peygamber ﷺ’in ruhuna, Ehl-i Beyt’ine, Sahabe’ye, Kadiri silsilesine, Şeyh Abdülkadir Geylânî (k.s.) hazretlerine ve bütün mümin ve müminâtın ruhlarına hediye edilir.',
}

export function getStepsFor(prayerId) {
  return [...COMMON_STEPS, ...(PRAYER_STEPS[prayerId] ?? []), CLOSING_STEP]
}

export const TOTAL_COMMON = COMMON_STEPS.length
