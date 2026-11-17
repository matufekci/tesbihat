// Namaz sonrası zikir, salavât, dua ve sureler — her vakit için ortak bölüm + vakte özel katman + kapanış.

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
  note: 'Bakara Suresi’nin 255. ayeti.',
}

const HASR5 = {
  quran: { sura: 59, from: 20, to: 24 },
  note: 'Okumadan ÖNCE 3 defa şu istiâze çekilir: أَعُوذُ بِاللَّهِ السَّمِيعِ الْعَلِيمِ مِنَ الشَّيْطَانِ الرَّجِيمِ — E’ûzü billâhi’s-semî’ıl-‘alîmi mine’ş-şeytâni’r-racîm. Sure bitene kadar SAĞ EL BAŞA KONULUR.',
}

// 5 vakitte de aynı olan bölüm
export const COMMON_STEPS = [
  {
    id: 'istigfar', title: 'İstiğfar', type: 'counter', target: 3,
    arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ، الْحَيَّ الْقَيُّومَ، وَأَتُوبُ إِلَيْهِ',
    latin: 'Estağfirullâhel’azîm ellezî lâ ilâhe illâ Hû, el-Hayye’l-Kayyûme ve etûbü ileyh.',
  },
  {
    id: 'selam', title: 'Selâm Zikri', type: 'read',
    arabic: 'اَللّٰهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    latin: 'Allâhümme ente’s-selâmü ve minke’s-selâm, tebârekte yâ ze’l-celâli ve’l-ikrâm.',
  },
  {
    id: 'zikr-duasi', title: 'Zikir ve Şükre Yardım Duası', type: 'read',
    arabic: 'اَللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ، وَشُكْرِكَ، وَحُسْنِ عِبَادَتِكَ وَلَا تَجْعَلْنِي مِنَ الْغَافِلِينَ',
    latin: 'Allâhümme e’innî ‘alâ zikrike ve şükrike ve hüsni ‘ibâdetike ve lâ tec’alnî mine’l-ğâfilîn.',
  },
  {
    id: 'euzu-besmele', title: 'Eûzü-Besmele', type: 'read',
    arabic: 'أَعُوذُ بِاللّٰهِ مِنَ الشَّيْطَانِ الرَّجِيمِ بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ',
    latin: 'E’ûzü billâhi mine’ş-şeytâni’r-racîm. Bismillâhir-rahmânir-rahîm.',
  },
  {
    id: 'ayetul-kursi', title: 'Âyetü’l-Kürsî', type: 'read',
    ...AYETUL_KURSI,
  },
  {
    id: 'tesbih', title: 'Sübhânallâh', type: 'counter', target: 33,
    arabic: 'سُبْحَانَ اللهِ', latin: 'Sübhânallâh',
  },
  {
    id: 'hamd', title: 'Elhamdülillâh', type: 'counter', target: 33,
    arabic: 'اَلْحَمْدُ لِلّٰهِ', latin: 'Elhamdülillâh',
  },
  {
    id: 'tekbir', title: 'Allâhü Ekber', type: 'counter', target: 33,
    arabic: 'اَللّٰهُ اَكْبَرُ', latin: 'Allâhü Ekber',
  },
  {
    id: 'tahlil', title: 'Tahlil', type: 'counter', target: 1,
    arabic: 'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ، وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    latin: 'Lâ ilâhe illallâhü vahdehû lâ şerîke leh, lehü’l-mülkü ve lehü’l-hamdü ve hüve ‘alâ külli şey’in kadîr.',
  },
  {
    id: 'dua', title: 'Dua', type: 'read',
    note: 'Sonra dua edilir.',
  },
  {
    id: 'la-ilahe', title: 'Lâ ilâhe illallâh', type: 'counter', target: 20,
    arabic: 'لَا إِلَهَ إِلَّا اللّٰهُ', latin: 'Lâ ilâhe illallâh',
    note: 'En az 20 defa okunur; vakit varsa 200 defa.',
  },
  {
    id: 'salavat', title: 'Salâvat-ı Şerîfe', type: 'read',
    latin: 'Allâhümme salli ve sellim ve bârik ‘alâ … (seyyidinâ / habîbinâ / es’adinâ / şefî’inâ) Muhammedin ve ‘alâ âlihî ‘adede in’âmillâhi ve ifdâlih.',
    arabic: [
      'اَللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى اٰلِهِ عَدَدَ إِنْعَامِ اللّٰهِ وَإِفْضَالِهِ',
      'اَللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى حَبِيبِنَا مُحَمَّدٍ وَعَلَى اٰلِهِ عَدَدَ إِنْعَامِ اللّٰهِ وَإِفْضَالِهِ',
      'اَللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى أَسْعَدِنَا مُحَمَّدٍ وَعَلَى اٰلِهِ عَدَدَ إِنْعَامِ اللّٰهِ وَإِفْضَالِهِ',
      'اَللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى شَفِيعِنَا مُحَمَّدٍ وَعَلَى اٰلِهِ عَدَدَ إِنْعَامِ اللّٰهِ وَإِفْضَالِهِ',
    ],
  },
  {
    id: 'salaten-tuncinâ', title: 'Salâten Tüncînâ', type: 'read',
    arabic: 'صَلَاةً تُنْجِينَا بِهَا مِنْ جَمِيعِ الْأَهْوَالِ وَالْاٰفَاتِ وَتَقْضِي لَنَا بِهَا جَمِيعَ الْحَاجَاتِ وَتُطَهِّرُنَا بِهَا مِنْ جَمِيعِ السَّيِّئَاتِ وَتَرْفَعُنَا بِهَا عِنْدَكَ أَعْلَى الدَّرَجَاتِ وَتُبَلِّغُنَا بِهَا أَقْصَى الْغَايَاتِ مِنْ جَمِيعِ الْخَيْرَاتِ فِي الْحَيَاةِ وَبَعْدَ الْمَمَاتِ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ',
    latin: 'Salâten tüncînâ bihâ min cemî’il-ehvâli ve’l-âfât. Ve takdî lenâ bihâ cemî’al-hâcât. Ve tütahhirunâ bihâ min cemî’is-seyyiât. Ve terfe’unâ bihâ ‘ındeke a’led-deracât. Ve tübelliğunâ bihâ aksal-ğâyât, min cemî’il-hayrât fi’l-hayâti ve ba’de’l-memât. Birahmetike yâ erhamer-râhimîn.',
  },
]

const HASR5_STEP = (id) => ({ id, title: 'Haşr Suresi’nin Son 5 Ayeti', type: 'read', ...HASR5 })

// Namaza özel katman
const PRAYER_STEPS = {
  sabah: [
    {
      id: 'celal-21', title: 'Yâ Ze’l-Celâli ve’l-İkrâm', type: 'counter', target: 21,
      arabic: 'يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', latin: 'Yâ ze’l-celâli ve’l-ikrâm',
      note: 'Yâsîn okunmadan önce 21 defa çekilir.',
    },
    {
      id: 'yasin', title: 'Yâsîn Suresi (36)', type: 'read',
      quran: { sura: 36 },
      note: '58. ayetine gelindiğinde bu ayet 12 defa tekrar edilir: سَلَامٌ قَوْلًا مِنْ رَبٍّ رَحِيمٍ — Selâmün kavlen min rabbin rahîm.',
    },
    HASR5_STEP('hasr-sabah'),
  ],
  ogle: [
    {
      id: 'nuh', title: 'Nuh Suresi (71)', type: 'read', optional: true,
      quran: { sura: 71 },
      note: 'Öğle namazı sonrası okunacak özel bir sure yoktur, ancak isteyen Nuh Suresi’ni okuyabilir.',
    },
  ],
  ikindi: [
    { id: 'nebe', title: 'Nebe Suresi (78)', type: 'read', quran: { sura: 78 } },
  ],
  aksam: [
    {
      id: 'vakia', title: 'Vâkıa Suresi (56)', type: 'read',
      quran: { sura: 56 },
      note: '76. ayete (Ve innehû lekasemun lev ta’lemûne ‘azîm) gelindiğinde rızık duasını oku. Dua bittikten sonra iki ayet geriye gidilir (Fe-sebbih bismi rabbike-l’azîm) ve sure sonuna kadar okunur.',
    },
    {
      id: 'rizik-duasi', title: 'Rızık Duası', type: 'read',
      arabic: 'اللَّهُمَّ يَا مَنْ هُوَ هَكَذَا وَلَا يَزَالُ، أَسْأَلُكَ بِأَزَلِيَّتِكَ فِي دَيْمُومِيَّةِ وَحْدَانِيَّتِكَ، وَبِكُلِّ آلَائِكَ، وَبِقِدَمِ ذَاتِكَ الْكَرِيمَةِ، بِجَلَالِ الْجَلَالِ، بِكَمَالِ الْكَمَالِ، بِقَهْرِ قَهْرِ مَيْمُونِ وَحْدَانِيَّتِكَ، بِحَقِّ صَمَدَانِيَّتِكَ، يَا أَوَّلُ يَا آخِرُ، بِالْحَوْلِ وَالطَّوْلِ، وَالْهَيْبَةِ وَالْعَظَمَةِ وَالْعَرْشِ وَالْكُرْسِيِّ، وَبِجَاهِ سَيِّدِنَا مُحَمَّدٍ الْقُرَشِيِّ (صلى الله عليه وسلم)؛ أَنْ تُيَسِّرَ لِي رِزْقِي بِلَا تَعَبٍ وَلَا مَنٍّ مِنْ أَحَدٍ، وَاجْعَلْهُ سَبَبًا لِعُبُودِيَّتِكَ، وَمُشَاهَدَةً لِأَحْكَامِ الرُّبُوبِيَّةِ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ وَلَا أَقَلَّ مِنْ ذَلِكَ أَلَا إِلَى اللهِ تَصِيرُ الْأُمُورُ',
      latin: 'Allâhümme yâ men hüve hâkezâ ve lâ yezâl, es’elüke bi-ezeliyyetike fî deymûmiyyeti vahdâniyyetike ve bi-külli âlâike ve bi-kıdemi zâtike’l-kerîmeti bi-celâli’l-celâli, bi-kemâli’l-kemâli, bi-kahri kahri meymûni vahdâniyyetike bi-hakkı samedâniyyetike, yâ Evvelü yâ Âhiru, bi’l-havli ve’t-tavli ve’l-heybeti ve’l-‘azameti ve’l-‘arşi ve’l-kürsiyyi, ve bi-câhi seyyidinâ Muhammedini’l-Kuraşiyyi (sallallâhu aleyhi ve sellem) en tüyessira lî rızkî bilâ te’abin ve lâ mennin min ehadin vec’alhü sebeben li-‘ubûdiyyetike ve müşâhedeten li-ahkâmi’r-rubûbiyyeti ve lâ tekilnî ilâ nefsî tarfete ‘aynin ve lâ ekalle min zâlik. Elâ ilallâhi tesîru’l-umûr.',
    },
    {
      id: 'esma-7', title: 'Esmâ-i Hüsnâ (7)', type: 'counter', target: 4,
      arabic: 'كَرِيمٌ، بَاسِطٌ، فَتَّاحٌ، رَزَّاقٌ، غَنِيٌّ، مُغْنِي، مُتَفَضِّلٌ',
      latin: 'Kerîmün, Bâsitun, Fettâhun, Rezzâkun, Ganiyyun, Muğnî, Mütefaddılun',
    },
    HASR5_STEP('hasr-aksam'),
  ],
  yatsi: [
    { id: 'mulk', title: 'Mülk Suresi (67)', type: 'read', quran: { sura: 67 } },
    { id: 'amenerrasulu', title: 'Âmenerrasûlü (Bakara 2:285–286)', type: 'read', quran: { sura: 2, from: 285, to: 286 } },
  ],
}

export const CLOSING_STEP = {
  id: 'fatiha-ruh', title: 'Fâtiha-i Şerîfe', type: 'read',
  quran: { sura: 1 },
  note: 'Efendimiz ﷺ’in ruhuna, Ehl-i Beyt’e, Sahabe’ye, Kadiri silsilesine, Şeyh Abdülkadir Geylânî (k.s.) Hz.’nin ve tüm mümin ve müminatın ruhlarına okunur.',
}

export function getStepsFor(prayerId) {
  return [...COMMON_STEPS, ...(PRAYER_STEPS[prayerId] ?? []), CLOSING_STEP]
}

export const TOTAL_COMMON = COMMON_STEPS.length
