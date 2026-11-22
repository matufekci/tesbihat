// Namaz sonrası zikir, salavât, dua ve sureler — her vakit için ortak bölüm + vakte özel katman + kapanış.
import { localizeStep, localizedHizbMeaning, localizedDuaNotes, localizedRizik } from './vird-i18n.js'
import { BASMALA, diyanetAyah } from './quran.js'

export const NAMAZ_IDS = ['sabah', 'ogle', 'ikindi', 'aksam', 'yatsi']

export const NAMAZ_META = {
  sabah:  { name: 'Sabah Namazı',  vakit: 'Sabah',  sonrasi: 'Sabah namazı sonrası' },
  ogle:   { name: 'Öğle Namazı',   vakit: 'Öğle',   sonrasi: 'Öğle namazı sonrası' },
  ikindi: { name: 'İkindi Namazı', vakit: 'İkindi', sonrasi: 'İkindi namazı sonrası' },
  aksam:  { name: 'Akşam Namazı',  vakit: 'Akşam',  sonrasi: 'Akşam namazı sonrası' },
  yatsi:  { name: 'Yatsı Namazı',  vakit: 'Yatsı',  sonrasi: 'Yatsı namazı sonrası' },
}

const AYETUL_KURSI = {
  arabic: diyanetAyah(2, 255),
  latin: 'Allâhü lâ ilâhe illâ Hüve’l-Hayyü’l-Kayyûm. Lâ te’huzühû sinetün velâ nevm. Lehû mâ fissemâvâti vemâ fil-ard. Menzellezî yeşfeu indehû illâ bi’iznih. Ya’lemü mâ beyne eydîhim vemâ halfehüm. Velâ yühîtûne bişey’im min ilmihî illâ bimâ şâe. Vesi’a kürsiyyühüssemâvâti vel-ard. Velâ yeûdühû hıfzuhümâ ve hüvel-aliyyü’l-azîm.',
  note: 'Bakara Suresi’nin 255. ayeti.',
  meaning: 'Allah — O’ndan başka ilâh yoktur; diridir, kayyûmdur. O’nu ne bir uyuklama tutar ne de uyku. Göklerde ve yerde ne varsa O’nundur. O’nun izni olmaksızın katında kim şefaat edebilir? O, önlerindekini ve arkalarındakini bilir. O’nun ilminden — dilediği kadarı hariç — hiçbir şey kavrayamazlar. Kürsüsü gökleri ve yeri kaplamıştır; onların korunması O’na ağır gelmez. O yücedir, büyüktür. (Bakara 2:255)',
}

// İmam en-Nevevî'ye nisbet edilen Hıfz (korunma) Hizbi — yalnız sabah ve akşam namazlarından sonra okunur.
// Dua metni kullanıcının sağladığı baskıdan aktarılmıştır; tam İhlâs sûresi Diyanet mushaf yazımıyla gösterilir.
const HIZB_AL_HIFZ = {
  arabic: [
    'بِسْمِ اللهِ الرَّحْمَٰنِ الرَّحِيمِ',
    '«بِسْمِ اللهِ، [اللهُ أَكْبَرُ (٣)]» أَقُولُ عَلَىٰ نَفْسِي وَعَلَىٰ دِينِي وَعَلَىٰ أَهْلِي وَعَلَىٰ أَوْلَادِي وَعَلَىٰ مَالِي وَعَلَىٰ أَصْحَابِي وَعَلَىٰ أَدْيَانِهِمْ وَعَلَىٰ أَمْوَالِهِمْ أَلْفَ «بِسْمِ اللهِ، [اللهُ أَكْبَرُ (٣)]»',
    'أَقُولُ عَلَىٰ نَفْسِي وَعَلَىٰ دِينِي وَعَلَىٰ أَهْلِي وَعَلَىٰ أَوْلَادِي وَعَلَىٰ مَالِي وَعَلَىٰ أَصْحَابِي وَعَلَىٰ أَدْيَانِهِمْ وَعَلَىٰ أَمْوَالِهِمْ أَلْفَ أَلْفَ «بِسْمِ اللهِ، [اللهُ أَكْبَرُ (٣)]»',
    'أَقُولُ عَلَىٰ نَفْسِي وَعَلَىٰ دِينِي وَعَلَىٰ أَهْلِي وَعَلَىٰ أَوْلَادِي وَعَلَىٰ مَالِي وَعَلَىٰ أَصْحَابِي وَعَلَىٰ أَدْيَانِهِمْ وَعَلَىٰ أَمْوَالِهِمْ أَلْفَ أَلْفَ أَلْفَ «بِسْمِ اللهِ، [اللهُ أَكْبَرُ (٣)]»',
    'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ الْعَلِيِّ الْعَظِيمِ',
    'بِسْمِ اللهِ وَبِاللهِ وَمِنْ اللهِ وَإِلَى اللهِ وَعَلَى اللهِ وَفِي اللهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ الْعَلِيِّ الْعَظِيمِ',
    'بِسْمِ اللهِ عَلَىٰ دِينِي وَعَلَىٰ نَفْسِي وَعَلَىٰ أَوْلَادِي، بِسْمِ اللهِ عَلَىٰ مَالِي وَعَلَىٰ أَهْلِي، بِسْمِ اللهِ عَلَىٰ كُلِّ شَيْءٍ أَعْطَانِيهِ رَبِّي، بِسْمِ اللهِ رَبِّ السَّمَاوَاتِ السَّبْعِ وَرَبِّ الْأَرْضِينَ السَّبْعِ وَرَبِّ الْعَرْشِ الْعَظِيمِ',
    'بِسْمِ اللهِ الْعَظِيمِ، [بِسْمِ اللهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ (٣)]',
    'بِسْمِ اللهِ خَيْرِ الْأَسْمَاءِ فِي الْأَرْضِ وَفِي السَّمَاءِ',
    'بِسْمِ اللهِ أَفْتَتِحُ وَبِهِ أَخْتِمُ، [اللهُ جَلَّ جَلَالُهُ (٣)] رَبِّي لَا أُشْرِكُ بِهِ شَيْئًا، [اللهُ جَلَّ جَلَالُهُ (٣)] رَبِّي لَا إِلَٰهَ إِلَّا اللهُ، اللهُ أَعَزُّ وَأَجَلُّ وَأَكْبَرُ مِمَّا أَخَافُ وَأَحْذَرُ',
    'بِكَ اللَّهُمَّ أَعُوذُ مِنْ شَرِّ نَفْسِي، وَمِنْ شَرِّ غَيْرِي، وَمِنْ شَرِّ مَا خَلَقَ رَبِّي وَذَرْءًا وَبَرْءًا',
    'وَبِكَ اللَّهُمَّ أَحْتَرِزُ مِنْهُمْ',
    'وَبِكَ اللَّهُمَّ أَعُوذُ مِنْ شُرُورِهِمْ',
    `وَبِكَ اللَّهُمَّ أَدْرَأُ فِي نُحُورِهِمْ، وَأُقَدِّمُ بَيْنَ يَدَيَّ وَأَيْدِيهِمْ: [${BASMALA} ${[1, 2, 3, 4].map((n) => diyanetAyah(112, n)).join(' ')} (٣)]`,
    'وَمِثْلُ ذَلِكَ عَنْ يَمِينِي وَعَنْ أَيْمَانِهِمْ، وَمِثْلُ ذَلِكَ عَنْ شَمَالِي وَعَنْ شَمَائِلِهِمْ، وَمِثْلُ ذَلِكَ عَنْ أَمَامِي وَأَمَامِهِمْ، وَمِثْلُ ذَلِكَ مِنْ خَلْفِي وَمِنْ خَلْفِهِمْ، وَمِثْلُ ذَلِكَ مِنْ فَوْقِي وَمِنْ فَوْقِهِمْ، وَمِثْلُ ذَلِكَ مِنْ تَحْتِي وَمِنْ تَحْتِهِمْ، وَمِثْلُ ذَلِكَ مُحِيطٌ بِي وَبِهِمْ',
    'اللَّهُمَّ إِنِّي أَسْأَلُكَ لِي وَلَهُمْ مِنْ خَيْرِكَ بِخَيْرِكَ الَّذِي لَا يَمْلِكُهُ غَيْرُكَ',
    `اللَّهُمَّ اجْعَلْنِي وَإِيَّاهُمْ فِي عِبَادِكَ وَعِيَاذِكَ وَعِيَالِكَ وَجِوَارِكَ وَأَمَانَتِكَ وَحِزْرِكَ وَحِزْبِكَ وَكَنَفِكَ، مِنْ كُلِّ شَيْطَانٍ وَإِنْسٍ وَجِنٍّ وَبَاغٍ وَحَاسِدٍ وَسَبْعٍ وَحَيَّةٍ وَعَقْرَبٍ، وَمِنْ كُلِّ دَابَّةٍ أَنْتَ ﴿${diyanetAyah(11, 56).slice(diyanetAyah(11, 56).indexOf("اٰخِذٌ"))}﴾`,
    'حَسْبِيَ الرَّبُّ مِنْ الْمَرْبُوبِينَ',
    'حَسْبِيَ الْخَالِقُ مِنْ الْمَخْلُوقِينَ',
    'حَسْبِيَ الرَّازِقُ مِنْ الْمَرْزُوقِينَ',
    'حَسْبِيَ السَّاتِرُ مِنْ الْمَسْتُورِينَ',
    'حَسْبِيَ النَّاصِرُ مِنْ الْمَنْصُورِينَ',
    'حَسْبِيَ الْقَاهِرُ مِنْ الْمَقْهُورِينَ',
    'حَسْبِيَ الَّذِي هُوَ حَسْبِي',
    'حَسْبِي مَنْ لَمْ يَزَلْ حَسْبِي اللهُ وَنِعْمَ الْوَكِيلُ',
    `حَسْبِي اللهُ مِنْ جَمِيعِ خَلْقِهِ ﴿${diyanetAyah(7, 196)}﴾`,
    `﴿${diyanetAyah(17, 45)}﴾`,
    `${diyanetAyah(17, 46)}`,
    `﴿${diyanetAyah(9, 129).slice(diyanetAyah(9, 129).indexOf("حَسْبِیَ"))}﴾`,
    'وَ[لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ الْعَلِيِّ الْعَظِيمِ (٣)]',
    'خَبَأْتُ نَفْسِي فِي خَزَائِنِ ﴿بِسْمِ اللهِ الرَّحْمَٰنِ الرَّحِيمِ﴾ أَقْفَالُهَا ثِقْتِي بِاللهِ، مَفَاتِيحُهَا لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ',
    'أُدَافِعُ بِكَ اللَّهُمَّ عَنْ نَفْسِي مَا أُطِيقُ وَمَا لَا أُطِيقُ، لَا طَاقَةَ لِمَخْلُوقٍ مَعَ قُدْرَةِ الْخَالِقِ',
    '[حَسْبِي اللهُ وَنِعْمَ الْوَكِيلُ (٧)]، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ الْعَلِيِّ الْعَظِيمِ',
    'وَصَلَّى اللهُ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ وَعَلَىٰ آلِهِ الطَّيِّبِينَ الطَّاهِرِينَ وَصَحْبِهِ الْكِرَامِ الْبَرَرَةِ أَجْمَعِينَ وَسَلَّمَ',
  ],
  latin: [
    'Bismillâhir-rahmânir-rahîm.',
    '“Bismillâh, [Allâhü ekber (3)]” diyerek — Akuulu alâ nefsî ve alâ dînî ve alâ ehlî ve alâ evlâdî ve alâ mâlî ve alâ ashâbî ve alâ edyânihim ve alâ emvâlihim — elfe “Bismillâh, [Allâhü ekber (3)]”.',
    'Akuulu alâ nefsî ve alâ dînî ve alâ ehlî ve alâ evlâdî ve alâ mâlî ve alâ ashâbî ve alâ edyânihim ve alâ emvâlihim — elfe elfe “Bismillâh, [Allâhü ekber (3)]”.',
    'Akuulu alâ nefsî ve alâ dînî ve alâ ehlî ve alâ evlâdî ve alâ mâlî ve alâ ashâbî ve alâ edyânihim ve alâ emvâlihim — elfe elfe elfe “Bismillâh, [Allâhü ekber (3)]”.',
    'Lâ havle ve lâ kuvvete illâ billâhil-‘aliyyil-‘azîm.',
    'Bismillâhi ve billâhi ve minallâhi ve ilallâhi ve alallâhi ve fillâhi, ve lâ havle ve lâ kuvvete illâ billâhil-‘aliyyil-‘azîm.',
    'Bismillâhi ‘alâ dînî ve ‘alâ nefsî ve ‘alâ evlâdî, bismillâhi ‘alâ mâlî ve ‘alâ ehlî, bismillâhi ‘alâ külli şey’in e‘tânîhi rabbî, bismillâhi rabbis-semâvâtis-seb‘i ve rabbil-ardînes-seb‘i ve rabbil-‘arşil-‘azîm.',
    'Bismillâhil-‘azîm. [Bismillâhillezî lâ yedurru ma‘asmihî şey’ün fi’l-ardı ve lâ fis-semâi ve hüves-semî‘ul-‘alîm (3)].',
    'Bismillâhi hayril-esmâi fi’l-ardı ve fis-semâ’.',
    'Bismillâhi eftetihu ve bihî ahtim, [Allâhü celle celâlüh (3)] rabbî lâ üşrikü bihî şey’en, [Allâhü celle celâlüh (3)] rabbî lâ ilâhe illallâh, Allâhü e‘azzü ve ecellü ve ekberü mimmâ ehâfü ve ahzar.',
    'Bikellâhümme e‘ûzü min şerri nefsî, ve min şerri ğayrî, ve min şerri mâ halaka rabbî ve zer‘an ve ber’en.',
    'Ve bikellâhümme ahterizü minhüm.',
    'Ve bikellâhümme e‘ûzü min şurûrihim.',
    'Ve bikellâhümme edra’ü fî nuhûrihim, ve uqaddimu beyne yedeyye ve eydîhim: [Bismillâhir-rahmânir-rahîm. Kul hüvallâhü ahad, Allâhüs- Samed, lem yelid ve lem yûled ve lem yekün lehû küfüven ahad (3)].',
    'Ve mislu zâlike ‘an yemînî ve ‘an eymânihim, ve mislu zâlike ‘an şimâlî ve ‘an şemâilihim, ve mislu zâlike ‘an emâmî ve emâmihim, ve mislu zâlike min halfî ve min halfihim, ve mislu zâlike min fevkî ve min fevkıhim, ve mislu zâlike min tahtî ve min tahtihim, ve mislu zâlike muhîtun bî ve bihim.',
    'Allâhümme innî es’elüke lî ve lehüm min hayrike bi-hayrike’llezî lâ yemlikühû ğayruke.',
    'Allâhümmec-‘alnî ve iyyâhüm fî ‘ibâdike ve ‘iyâdike ve ‘iyâlike ve civârike ve emânetike ve hizrike ve hizbike ve kenefike, min külli şeytânin ve insîn ve cinnin ve bâğin ve hâsidin ve seb‘in ve hayyetin ve ‘aqrebin, ve min külli dâbbetin ente âhızün binâsıyetihâ, inne rabbî ‘alâ sırâtım-müstakîm.',
    'Hasbiyer-rabbü mine’l-merbûbîn.',
    'Hasbiyel-hâliku mine’l-mahlûkîn.',
    'Hasbiyer-râzikü mine’l-merzûkîn.',
    'Hasbiyes-sâtirü mine’l-mestûrîn.',
    'Hasbiyen-nâsıru mine’l-mansûrîn.',
    'Hasbiyel-kâhirü mine’l-makhûrîn.',
    'Hasbiyellezî hüve hasbî.',
    'Hasbî men lem yezel hasbiyallâhü ve ni‘me’l-vekîl.',
    'Hasbiyallâhü min cemî‘i halkıhî, inne veliyyiyallâhüllezî nezzele’l-kitâbe ve hüve yetevellâs-sâlihîn.',
    'Ve izâ kare’tel-kur’âne ce‘alnâ beyneke ve beyne’llezîne lâ yu’minûne bi’l-âhireti hicâben mestûrâ.',
    'Ve ce‘alnâ ‘alâ kulûbihim ekinneten en yefqahûhü ve fî âzânihim vakra. Ve izâ zekerterrabeke fi’l-kur’âni vahdehû vellev ‘alâ edbârihim nüfûrâ.',
    'Hasbiyallâhü lâ ilâhe illâ hüve, ‘aleyhi tevekkeltü ve hüve rabbul-‘arşil-‘azîm.',
    'Ve [lâ havle ve lâ kuvvete illâ billâhil-‘aliyyil-‘azîm (3)].',
    'Habe’tü nefsî fî hazâini bismillâhir-rahmânir-rahîm. Aqfâlühâ siqatî billâh, mefâtîhuhâ lâ havle ve lâ kuvvete illâ billâh.',
    'Üdâfi‘u bikellâhümme ‘an nefsî mâ utîku ve mâ lâ utîk, lâ tâkate li-mahlûkin ma‘a kudreti’l-hâlik.',
    '[Hasbiyallâhü ve ni‘me’l-vekîl (7)], ve lâ havle ve lâ kuvvete illâ billâhil-‘aliyyil-‘azîm.',
    'Ve sallallâhü ‘alâ seyyidinâ Muhammedin ve ‘alâ âlihi’t-tayyibîne’t-tâhirîne ve sahbi’l-kirâmi’l-berereti ecma‘îne ve sellem.',
  ],
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
    meaning: 'Kendisinden başka ilâh olmayan, Hayy ve Kayyûm olan Azîm Allah’tan af dilerim ve O’na tövbe ederim.',
  },
  {
    id: 'selam', title: 'Selâm Zikri', type: 'read',
    arabic: 'اَللّٰهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    latin: 'Allâhümme ente’s-selâmü ve minke’s-selâm, tebârekte yâ ze’l-celâli ve’l-ikrâm.',
    meaning: 'Allah’ım! Sen Selâm’sın, selâm Sendendir. Ne yücesin ey Celâl ve İkrâm sahibi!',
  },
  {
    id: 'zikr-duasi', title: 'Zikir ve Şükre Yardım Duası', type: 'read',
    arabic: 'اَللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ، وَشُكْرِكَ، وَحُسْنِ عِبَادَتِكَ وَلَا تَجْعَلْنِي مِنَ الْغَافِلِينَ',
    latin: 'Allâhümme e’innî ‘alâ zikrike ve şükrike ve hüsni ‘ibâdetike ve lâ tec’alnî mine’l-ğâfilîn.',
    meaning: 'Allah’ım! Seni zikretmeme, Sana şükretmeme ve Sana en güzel şekilde kulluk etmeme bana yardım et; beni gafillerden eyleme.',
  },
  {
    id: 'euzu-besmele-kursi', title: 'Eûzü-Besmele ve Âyetü’l-Kürsî', type: 'read',
    arabic: [
      'أَعُوذُ بِاللّٰهِ مِنَ الشَّيْطَانِ الرَّجِيمِ بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ',
      AYETUL_KURSI.arabic,
    ],
    latin: 'E’ûzü billâhi mine’ş-şeytâni’r-racîm. Bismillâhir-rahmânir-rahîm. ' + AYETUL_KURSI.latin,
    meaning: 'Kovulmuş şeytandan Allah’a sığınırım. Rahmân ve Rahîm olan Allah’ın adıyla. Sonra Âyetü’l-Kürsî: Allah — O’ndan başka ilâh yoktur; diridir, kayyûmdur. O’nu ne bir uyuklama tutar ne de uyku. Göklerde ve yerde ne varsa O’nundur. O’nun izni olmaksızın katında kim şefaat edebilir? O, önlerindekini ve arkalarındakini bilir. O’nun ilminden — dilediği kadarı hariç — hiçbir şey kavrayamazlar. Kürsüsü gökleri ve yeri kaplamıştır; onların korunması O’na ağır gelmez. O yücedir, büyüktür. (Bakara 2:255)',
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
    id: 'tahlil', title: 'Tahlil', type: 'counter', target: 1,
    arabic: 'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ، وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    latin: 'Lâ ilâhe illallâhü vahdehû lâ şerîke leh, lehü’l-mülkü ve lehü’l-hamdü ve hüve ‘alâ külli şey’in kadîr.',
    meaning: 'Allah’tan başka ilâh yoktur; O birdir, ortağı yoktur. Mülk O’nundur, hamd O’nadır; O her şeye hakkıyla gücü yetendir.',
  },
  {
    id: 'dua', title: 'Dua', type: 'read',
    note: 'Sonra dua edilir.',
  },
  {
    id: 'la-ilahe', title: 'Lâ ilâhe illallâh', type: 'counter', target: 20,
    arabic: 'لَا إِلَهَ إِلَّا اللّٰهُ', latin: 'Lâ ilâhe illallâh',
    note: 'En az 20 defa okunur; vakit varsa 200 defa.',
    meaning: 'Allah’tan başka ilâh yoktur.',
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
    meaning: 'Allah’ın nimetleri ve lütufları sayısınca Allah’ım Peygamberimiz Muhammed’e ve âline salât, selâm ve berekât ihsan eyle: …Efendimize (seyyidinâ), Sevgilimize (habîbinâ), En bahtiyarımıza (es’adinâ), Şefaatçimize (şefî’inâ).',
  },
  {
    id: 'salaten-tuncinâ', title: 'Salâten Tüncînâ', type: 'read',
    arabic: 'صَلَاةً تُنْجِينَا بِهَا مِنْ جَمِيعِ الْأَهْوَالِ وَالْاٰفَاتِ وَتَقْضِي لَنَا بِهَا جَمِيعَ الْحَاجَاتِ وَتُطَهِّرُنَا بِهَا مِنْ جَمِيعِ السَّيِّئَاتِ وَتَرْفَعُنَا بِهَا عِنْدَكَ أَعْلَى الدَّرَجَاتِ وَتُبَلِّغُنَا بِهَا أَقْصَى الْغَايَاتِ مِنْ جَمِيعِ الْخَيْرَاتِ فِي الْحَيَاةِ وَبَعْدَ الْمَمَاتِ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ',
    latin: 'Salâten tüncînâ bihâ min cemî’il-ehvâli ve’l-âfât. Ve takdî lenâ bihâ cemî’al-hâcât. Ve tütahhirunâ bihâ min cemî’is-seyyiât. Ve terfe’unâ bihâ ‘ındeke a’led-deracât. Ve tübelliğunâ bihâ aksal-ğâyât, min cemî’il-hayrât fi’l-hayâti ve ba’de’l-memât. Birahmetike yâ erhamer-râhimîn.',
    meaning: 'Bize onunla her türlü korku ve âfetten kurtuluşu, bütün ihtiyaçlarımızın yerine gelmesini, her türlü günahtan temizlenmemizi, Senin katında en yüce derecelere yükselmemizi ve dünya ile âhirette tüm hayırların en son gayelerine ulaşmamızı ihsan edeceğin bir salât… Rahmetin hakkı için ey merhametlilerin en merhametlisi!',
  },
]

export const RIZIK_DUASI = {
      id: 'rizik-duasi', title: 'Rızık Duası', type: 'read',
      arabic: [
        'اللَّهُمَّ يَا مَنْ هُوَ هَكَذَا وَلَا يَزَالُ، أَسْأَلُكَ بِأَزَلِيَّتِكَ فِي دَيْمُومِيَّةِ وَحْدَانِيَّتِكَ، وَبِكُلِّ آلَائِكَ، وَبِقِدَمِ ذَاتِكَ الْكَرِيمَةِ،',
        'بِجَلَالِ الْجَلَالِ، بِكَمَالِ الْكَمَالِ، بِقَهْرِ قَهْرِ مَيْمُونِ وَحْدَانِيَّتِكَ، بِحَقِّ صَمَدَانِيَّتِكَ، يَا أَوَّلُ يَا آخِرُ،',
        'بِالْحَوْلِ وَالطَّوْلِ، وَالْهَيْبَةِ وَالْعَظَمَةِ وَالْعَرْشِ وَالْكُرْسِيِّ، وَبِجَاهِ سَيِّدِنَا مُحَمَّدٍ الْقُرَشِيِّ (صلى الله عليه وسلم)؛',
        'أَنْ تُيَسِّرَ لِي رِزْقِي بِلَا تَعَبٍ وَلَا مَنٍّ مِنْ أَحَدٍ،',
        'وَاجْعَلْهُ سَبَبًا لِعُبُودِيَّتِكَ، وَمُشَاهَدَةً لِأَحْكَامِ الرُّبُوبِيَّةِ،',
        'وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ وَلَا أَقَلَّ مِنْ ذَلِكَ أَلَا إِلَى اللهِ تَصِيرُ الْأُمُورُ',
      ],
      latin: [
        'Allâhümme yâ men hüve hâkezâ ve lâ yezâl, es’elüke bi-ezeliyyetike fî deymûmiyyeti vahdâniyyetike ve bi-külli âlâike ve bi-kıdemi zâtike’l-kerîmeti,',
        'bi-celâli’l-celâli, bi-kemâli’l-kemâli, bi-kahri kahri meymûni vahdâniyyetike bi-hakkı samedâniyyetike, yâ Evvelü yâ Âhiru,',
        'bi’l-havli ve’t-tavli ve’l-heybeti ve’l-‘azameti ve’l-‘arşi ve’l-kürsiyyi, ve bi-câhi seyyidinâ Muhammedini’l-Kuraşiyyi (sallallâhu aleyhi ve sellem);',
        'en tüyessira lî rızkî bilâ te’abin ve lâ mennin min ehadin,',
        'vec’alhü sebeben li-‘ubûdiyyetike ve müşâhedeten li-ahkâmi’r-rubûbiyyeti,',
        've lâ tekilnî ilâ nefsî tarfete ‘aynin ve lâ ekalle min zâlik. Elâ ilallâhi tesîru’l-umûr.',
      ],
      meaning: 'Allah’ım! Ezelîliğinle, birliğinin devamlılığıyla, bütün nimetlerinle; celâlinin celâli, kemâlinin kemâli hürmetine; Samedâniyetinin hakkı için; yâ Evvel, yâ Âhir; kudret, kuvvet, heybet, azamet, Arş ve Kürsî hürmetine; Efendimiz Muhammed el-Kuraşî’nin (s.a.v.) câhı hakkına: rızkımı hiçbir yorgunluk çekmeden, hiç kimsenin minneti olmaksızın kolaylaştırmanı; onu kulluğuma ve rubûbiyet hükümlerini müşahede etmeme vesile kılmanı; beni bir göz kırpması — hatta ondan daha azı — kadar bile nefsime bırakmamanı Senden dilerim. Bilesiniz ki bütün işler Allah’a döner.',
      endNote: { text: 'Dua bittikten sonra İKİ ÂYET geriden başla:', ayahs: [74, 75], tail: 'âyetlerinden itibaren Vâkıa sûresini sonuna kadar oku.' },
    }

const HASR5_STEP = (id) => ({ id, title: 'Haşr Suresi’nin Son 5 Ayeti', type: 'read', ...HASR5 })

// Namaza özel katman
const PRAYER_STEPS = {
  sabah: [
    {
      id: 'celal-21', title: 'Yâ Ze’l-Celâli ve’l-İkrâm', type: 'counter', target: 21,
      arabic: 'يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', latin: 'Yâ ze’l-celâli ve’l-ikrâm',
      note: 'Yâsîn okunmadan önce 21 defa çekilir.',
      meaning: 'Ey Celâl ve İkrâm sahibi!',
    },
    {
      id: 'yasin', title: 'Yâsîn Suresi (36)', type: 'read',
      quran: { sura: 36 },
      note: `58. ayetine gelindiğinde bu ayet 12 defa tekrar edilir: ${diyanetAyah(36, 58)} — Selâmün kavlen min rabbin rahîm.`,
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
      hotAyat: 76, hotStep: 'rizik-duasi', highlightAyat: [74, 75],
      note: `76. ayete gelindiğinde ayetin altındaki “Rızık Duasını Oku” düğmesine dokun — dua yeni pencerede açılır. Dua bittikten sonra iki ayet geriden (74. ayet: ${diyanetAyah(56, 74)}) devam et ve sûre sonuna kadar oku.`,
    },
    {
      id: 'esma-7', title: 'Esmâ-i Hüsnâ (7)', type: 'counter', target: 4,
      arabic: 'كَرِيمٌ، بَاسِطٌ، فَتَّاحٌ، رَزَّاقٌ، غَنِيٌّ، مُغْنِي، مُتَفَضِّلٌ',
      latin: 'Kerîmün, Bâsitun, Fettâhun, Rezzâkun, Ganiyyun, Muğnî, Mütefaddılun',
      meaning: 'Kerîm (Cömert), Bâsit (Genişleten/Açan), Fettâh (Fetheden), Rezzâk (Rızık veren), Ganiyy (Zengin), Muğnî (Zenginleştiren), Mütefaddıl (Lütfeden).',
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

const HIZB_MEANING = [
  'İmam en-Nevevî’ye nisbet edilen Hıfz Hizbi’nin serbest Türkçe anlamı: âyet ve hadis kısımları meal/hadis mânâsına göredir.',
  'Rahmân ve Rahîm olan Allah’ın adıyla.',
  '“Bismillah, Allahü ekber (3 kere)” diyerek: kendime, dinime, âileme, evlâdıma, malıma, arkadaşlarıma ve onların dinleri ve malları için — bin defa “Bismillah, Allahü ekber (3)” derim.',
  'Aynısını milyon defa: kendime, dinime, âileme, evlâdıma, malıma, arkadaşlarıma ve onların dinleri ve malları için — milyon defa “Bismillah, Allahü ekber (3)” derim.',
  'Aynısını milyar defa: kendime, dinime, âileme, evlâdıma, malıma, arkadaşlarıma ve onların dinleri ve malları için — milyar defa “Bismillah, Allahü ekber (3)” derim.',
  'Güç ve kuvvet ancak yüce ve ulu Allah’ındır; O’ndan başka yardım yoktur.',
  'Allah’ın adıyla, Allah’la, Allah’tan, Allah’a, Allah üzerine ve Allah’ta; ve güç ve kuvvet ancak yüce ve ulu Allah’ındır.',
  'Allah’ın adıyla dinim üzerine, canım üzerine ve evlâtlarım üzerine; Allah’ın adıyla malım üzerine ve âilem üzerine; Allah’ın adıyla bana verdiği her şey üzerine; Allah’ın adıyla, yedi kat göğün ve yedi kat yerin Rabbi ve yüce Arş’ın Rabbi olan Allah’ın adıyla.',
  'Azamet sahibi Allah’ın adıyla: “İsminin zikriyle beraber, yerde ve gökte hiçbir şey insana zarar vermez; O hakkıyla işiten ve bilendir” (3 defa). (Hadis-i Şerif)',
  'Allah’ın adıyla ki, yerde ve gökte isimlerin en hayırlısı O’nundur.',
  'Allah’ın adıyla başlarım ve O’nunla bitiririm. “Allah — celle celâlüh — (3)”; Rabbimdir, O’na hiçbir şeyi ortak koşmam. “Allah — celle celâlüh — (3)”; Rabbimdir; Allah’tan başka ilâh yoktur. Allah, korktuğum ve çekindiğim her şeyden daha aziz, daha celil ve daha büyüktür.',
  'Allah’ım! Senden; nefsimin şerrinden, başkasının şerrinden ve Rabbimin yarattığı ve yayıp saçtığı şeylerin şerrinden Sana sığınırım.',
  'Allah’ım! Yine Senin yardımınla onlardan korunurum.',
  'Allah’ım! Onların şerlerinden Sana sığınırım.',
  'Allah’ım! Senin yardımınla onların göğüslerini (üstüme atılmalarını) geri defederim; ellerimle onların elleri arasına girerim: [Rahmân ve Rahîm olan Allah’ın adıyla. De ki: O Allah birdir. Allah sameddir — her şey O’na muhtaçtır, O hiçbir şeye muhtaç değildir. O doğurmamış ve doğurulmamıştır. Hiçbir şey O’na denk değildir. (3 defa İhlâs Suresi)]',
  'Aynısını sağ tarafıma ve sağ tarafımdakiler için; aynısını sol tarafıma ve sol tarafımdakiler için; aynısını önüme ve önümdakilere; aynısını arkama ve arkamdakilere; aynısını üstüme ve üstümdekilere; aynısını altıma ve altımdakilere; aynısı benim ve onların etrafını kuşatmıştır.',
  'Allah’ım! Bana ve onlara, Senin hakkındaki hayrından — Sen’den başka kimsenin tasarruf edemeyeceği hayrdan — ihsan et.',
  'Allah’ım! Beni ve onları: kulların, himâye ettiklerin (ıyâdike), âile halkın (ıyâlike), komşuluğun (civârike), emânetin (emânetike), güvenliğin (hızr), hizbin ve koruman (kenef) içine al; her türlü şeytandan, insî ve cinnî şerrinden, azgın ve hasetçi güçlerden, yırtıcı hayvan, yılan ve akrepten; ve nâsiyesini (perçemini) elinde tuttuğun her canlıdan koru — “Şüphesiz Rabbim doğru yol üzeredir” (Hûd 11:56’dan bölüm).',
  'Merbûblar arasında (onlara yeten) Rabbim bana yeter.',
  'Yaratılmışlar arasında Yaratan bana yeter.',
  'Rızık verilenler arasında Rızık Veren bana yeter.',
  '(Sıra) gizli kalanlar arasında Örten bana yeter.',
  'Yardıma erişenler arasında Yardım Eden bana yeter.',
  'Kahredilenler arasında Kahreden (ezici güç sahibi) bana yeter.',
  'Kendisi bana yeten tek Yeter bana yeter.',
  'Durmadan bana yeten; Allah bana yeter, O ne güzel Vekil’dir.',
  'Allah, bütün yaratıklarına karşı bana yeter: “Şüphesiz benim velim, Kitab’ı indiren Allah’tır; O, salih kullarının velisidir” (A’râf 7:196).',
  '“Kur’ân’ı okuduğun zaman, seninle âhirete inanmayanlar arasına görünmez (kapalı) bir perde koyarız” (İsrâ 17:45).',
  '“Onların kalpleri üzerine Kur’ân’ı anlamamaları için örtüler, kulakları üzerine ağırlık koyarız. (Kâfirler) sen Kur’ân’da sadece Rabbini zikrettiğin zaman arkalarına dönüp kaçarlar” (İsrâ 17:46).',
  '“Allah bana yeter; O’ndan başka ilâh yoktur; O’na tevekkül ettim; O, büyük Arş’ın Rabbidir” (Tevbe 9:129).',
  'Ve güç ve kuvvet ancak yüce ve ulu Allah’ındır (3 defa).',
  'Canımı Rahmân ve Rahîm olan Allah’ın hazinelerine gizledim; onların kilitleri Allah’a olan güvenimdir, anahtarları güç ve kuvvet yalnız Allah’ındır.',
  'Allah’ım! Senin yardımınla nefsimi; gücümün yettiğine ve yetmediğine karşı savunurum. Hiçbir yaratığın, Yaratan’ın kudreti yanında tâkatı yoktur.',
  '“Allah bana yeter, O ne güzel Vekil’dir (7 defa)”; ve güç ve kuvvet ancak yüce ve ulu Allah’ındır.',
  'Allah salât etsin Efendimiz Muhammed’e ve âli temiz ve pâk olanlarına ve sahabilerine — kerîm ve berr (ihsanı bol) olanların cümlesine — ve selâm etsin.',
]

const DUA_NOTE_EMPTY = 'Sonra dua edilir.'
const DUA_NOTE_SABAH_AKSAM = 'Sabah ve akşam namazları sonrası: İmam en-Nevevî’ye nisbet edilen Hıfz (korunma) Hizbi okunur. Köşeli parantez içindeki (٣) ve (٧) sayıları o kısmın kaç defa tekrar edileceğini gösterir. Diğer namazlarda bu bölüm boştur; dilediğin duayı oku.'

function duaStepFor(prayerId, lang = 'tr') {
  const notes = localizedDuaNotes(lang)
  if (prayerId === 'sabah' || prayerId === 'aksam') {
    return localizeStep({
      id: 'dua', title: 'Dua', type: 'read',
      arabic: HIZB_AL_HIFZ.arabic,
      latin: HIZB_AL_HIFZ.latin,
      meaning: localizedHizbMeaning(lang) ?? HIZB_MEANING,
      note: notes?.sabahAksam ?? DUA_NOTE_SABAH_AKSAM,
    }, lang)
  }
  return localizeStep({ id: 'dua', title: 'Dua', type: 'read', note: notes?.empty ?? DUA_NOTE_EMPTY }, lang)
}

export function getStepsFor(prayerId, lang = 'tr') {
  const common = COMMON_STEPS.map((s) => (s.id === 'dua' ? duaStepFor(prayerId, lang) : localizeStep(s, lang)))
  return [...common, ...(PRAYER_STEPS[prayerId] ?? []).map((s) => localizeStep(s, lang)), localizeStep(CLOSING_STEP, lang)]
}

export function getRizikDuasi(lang = 'tr') {
  return localizedRizik(RIZIK_DUASI, lang)
}

export const TOTAL_COMMON = COMMON_STEPS.length
