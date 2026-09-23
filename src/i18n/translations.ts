export type Language = 'uz' | 'en';

export interface Translations {
  nav: {
    tagline: string;
    newQuiz: string;
    library: string;
    adminPanel: string;
    myQuizzes: string;
    dashboard: string;
    login: string;
    register: string;
    logout: string;
    language: string;
    langUz: string;
    langEn: string;
  };
  home: {
    heroBadge: string;
    heroTitle: string;
    heroSubtitle: string;
    dropzoneTitle: string;
    dropzoneSubtitle: string;
    browseFiles: string;
    fileLimitNote: string;
    processingPdf: string;
    extractingPages: string;
    errorInvalidPdf: string;
    errorEmptyPdf: string;
    errorExtractFailed: string;
    previewBadge: string;
    changeFile: string;
    statPages: string;
    statWords: string;
    statChars: string;
    statSize: string;
    sampleExcerptTitle: string;
    startConfigBtn: string;
    sampleBooksHeading: string;
    sampleBooksSub: string;
    takeQuizBtn: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
  };
  settings: {
    backHome: string;
    title: string;
    subtitle: string;
    selectedBook: string;
    numQuestions: string;
    questionsCount: string;
    difficultyTitle: string;
    diffEasy: string;
    diffEasyDesc: string;
    diffMedium: string;
    diffMediumDesc: string;
    diffHard: string;
    diffHardDesc: string;
    diffMixed: string;
    diffMixedDesc: string;
    questionTypesTitle: string;
    typeMultipleChoice: string;
    typeTrueFalse: string;
    typeShortAnswer: string;
    focusTopicsTitle: string;
    focusTopicsDesc: string;
    allTopics: string;
    generateBtn: string;
  };
  config: {
    chooseAnotherBook: string;
    docReady: string;
    sampleText: string;
    textExtractedVerified: string;
    title: string;
    subtitle: string;
    questionCount: string;
    difficulty: string;
    difficultyEasy: string;
    difficultyEasyDesc: string;
    difficultyMedium: string;
    difficultyMediumDesc: string;
    difficultyHard: string;
    difficultyHardDesc: string;
    difficultyMixed: string;
    difficultyMixedDesc: string;
    questionTypes: string;
    questionTypesHint: string;
    selected: string;
    typeMC: string;
    typeMCDesc: string;
    typeTF: string;
    typeTFDesc: string;
    typeSA: string;
    typeSADesc: string;
    guaranteeOnlyBook: string;
    generateBtn: string;
  };
  loading: {
    stage1Title: string;
    stage1Desc: string;
    stage2Title: string;
    stage2Desc: string;
    stage3Title: string;
    stage3Desc: string;
    doneBadge: string;
    bookLabel: string;
    questionsCountLabel: string;
    difficultyLabel: string;
    failedTitle: string;
    tryAgain: string;
    adjustSettings: string;
  };
  quiz: {
    questionOf: string;
    answeredCount: string;
    exitQuiz: string;
    questionTitle: string;
    answered: string;
    unanswered: string;
    typeMultipleChoice: string;
    typeTrueFalse: string;
    typeShortAnswer: string;
    typeMC: string;
    typeTF: string;
    typeSA: string;
    diffEasy: string;
    diffMedium: string;
    diffHard: string;
    trueLabel: string;
    falseLabel: string;
    tfTrue: string;
    tfFalse: string;
    yourAnswer: string;
    placeholderShort: string;
    shortAnswerPrompt: string;
    shortAnswerPlaceholder: string;
    previous: string;
    next: string;
    submitQuiz: string;
    unansweredModalTitle: string;
    unansweredModalDesc: string;
    reviewQuestionBtn: string;
    submitAnywayBtn: string;
    submitAnyway: string;
    progressHeader: string;
    questionsLeft: string;
    allAnswered: string;
  };
  results: {
    badgeCompleted: string;
    title: string;
    correctOutOf: string;
    correct: string;
    incorrect: string;
    skipped: string;
    reviewBtn: string;
    reviewAnswers: string;
    retakeBtn: string;
    retake: string;
    viewHistory: string;
    history: string;
    uploadAnother: string;
    scoreLabels: {
      excellent: string;
      veryGood: string;
      good: string;
      keepPracticing: string;
    };
  };
  review: {
    backToSummary: string;
    title: string;
    book: string;
    result: string;
    bookInfo: string;
    retakeQuiz: string;
    retake: string;
    myQuizzes: string;
    filterAll: string;
    filterIncorrect: string;
    filterCorrect: string;
    noQuestionsFilter: string;
    noQuestionsFound: string;
    questionNumber: string;
    badgeCorrect: string;
    badgeIncorrect: string;
    badgeUnanswered: string;
    correct: string;
    unanswered: string;
    incorrect: string;
    yourAnswer: string;
    noAnswerProvided: string;
    notAnswered: string;
    correctAnswerBook: string;
    semanticEval: string;
    semanticFeedback: string;
    explanationBook: string;
    bookExplanation: string;
    sourceExcerpt: string;
    backToResults: string;
    allQuizHistory: string;
    allHistory: string;
  };
  myQuizzes: {
    title: string;
    subtitle: string;
    newQuizBtn: string;
    newQuiz: string;
    searchPlaceholder: string;
    noMatchTitle: string;
    noQuizzesFound: string;
    noCompletedTitle: string;
    noQuizzesYet: string;
    noMatchDesc: string;
    searchTryAnother: string;
    noCompletedDesc: string;
    emptySubtitle: string;
    uploadBookBtn: string;
    uploadBook: string;
    questionsSuffix: string;
    scoreLabel: string;
    score: string;
    difficultyLabel: string;
    level: string;
    openResultBtn: string;
    openResults: string;
    retakeTooltip: string;
    deleteTooltip: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    uploadNewBookBtn: string;
    uploadNewBook: string;
    totalQuizzes: string;
    totalQuizzesSub: string;
    quizzedBooks: string;
    questionsAnswered: string;
    questionsAnsweredSub: string;
    activeRecall: string;
    averageScore: string;
    averageScoreSub: string;
    allQuizzesTaken: string;
    bestScore: string;
    bestScoreSub: string;
    personalRecord: string;
    recentQuizzes: string;
    recentQuizzesSub: string;
    recentSubtitle: string;
    viewAll: string;
    noQuizzesYet: string;
  };
  footer: {
    tagline: string;
    poweredBy: string;
    guarantee: string;
    createdBy: string;
    copyright: string;
    allRightsReserved: string;
  };
  evaluating: {
    title: string;
    subtitle: string;
  };
  library: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allGenres: string;
    sortBy: string;
    sortRecent: string;
    sortAlphabetical: string;
    sortPages: string;
    readBook: string;
    takeQuiz: string;
    pages: string;
    noBooksFound: string;
    noBooksDesc: string;
    showingResults: string;
    previous: string;
    next: string;
    page: string;
    of: string;
    authRequiredNotice: string;
  };
  admin: {
    title: string;
    subtitle: string;
    addNewBook: string;
    editBook: string;
    deleteBook: string;
    deleteConfirm: string;
    tableTitle: string;
    tableAuthor: string;
    tableGenre: string;
    tablePages: string;
    tableSize: string;
    tableDate: string;
    tableActions: string;
    statsTotalBooks: string;
    statsGenres: string;
    statsStorage: string;
    statsUploadLimit: string;
    formTitle: string;
    formAuthor: string;
    formGenre: string;
    formDesc: string;
    formCover: string;
    formCoverPlaceholder: string;
    formPdf: string;
    formPdfNote: string;
    uploadProgress: string;
    uploadSuccess: string;
    saveBook: string;
    saving: string;
    cancel: string;
    unauthorizedTitle: string;
    unauthorizedDesc: string;
    loginAsAdmin: string;
  };
  reader: {
    backToLibrary: string;
    page: string;
    of: string;
    zoomIn: string;
    zoomOut: string;
    fitWidth: string;
    fullscreen: string;
    exitFullscreen: string;
    createQuiz: string;
    loadingDocument: string;
    errorLoading: string;
    toc: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    name: string;
    email: string;
    password: string;
    loginBtn: string;
    registerBtn: string;
    quickDemoAdmin: string;
    quickDemoUser: string;
    haveAccount: string;
    noAccount: string;
    authRequiredToRead: string;
    adminOnly: string;
  };
}

export const translations: Record<Language, Translations> = {
  uz: {
    nav: {
      tagline: "Istalgan kitobni aqlli testga aylantiring",
      newQuiz: "Yangi test",
      library: "Kutubxona",
      adminPanel: "Admin Panel",
      myQuizzes: "Mening testlarim",
      dashboard: "Talaba paneli",
      login: "Kirish",
      register: "Ro'yxatdan o'tish",
      logout: "Chiqish",
      language: "Til",
      langUz: "O'zbekcha",
      langEn: "English",
    },
    home: {
      heroBadge: "Faqat kitobingiz faktlariga asoslangan bilim sinovi",
      heroTitle: "Istalgan kitobni aqlli testga aylantiring.",
      heroSubtitle: "PDF kitobingizni yuklang — sun'iy intellekt matnni chuqur tahlil qiladi va faqat kitob mazmuni asosida professional test yaratib beradi.",
      dropzoneTitle: "Kitobingizni bu yerga tashlang yoki fayl tanlang",
      dropzoneSubtitle: "O'quv qo'llanmalari, darsliklar, badiiy va ilmiy kitoblar (PDF)",
      browseFiles: "PDF fayl tanlash",
      fileLimitNote: "Maksimal 100MB • Faqat haqiqiy kitob matnlari bo'yicha baholash",
      processingPdf: "PDF kitob o'qilmoqda...",
      extractingPages: "Sahifalar ajratilmoqda va matn tahlilga tayyorlanmoqda",
      errorInvalidPdf: "Noto'g'ri fayl formati. Iltimos, PDF hujjat (.pdf) yuklang.",
      errorEmptyPdf: "Tanlangan fayl bo'sh (0 bayt). Iltimos, to'g'ri hujjat yuklang.",
      errorExtractFailed: "PDF fayldan matnni ajratib bo'lmadi. Iltimos, skaner qilinmagan, o'qilishi mumkin bo'lgan PDF yuklang.",
      previewBadge: "Kitob tahlilga tayyor",
      changeFile: "Faylni almashtirish",
      statPages: "Sahifalar",
      statWords: "So'zlar soni",
      statChars: "Belgilar",
      statSize: "Hajmi",
      sampleExcerptTitle: "Kitobdan parcha:",
      startConfigBtn: "Test parametrlarini sozlash",
      sampleBooksHeading: "Yoki tayyor namuna kitoblar bilan sinab ko'ring",
      sampleBooksSub: "Fayl yuklamasdan tizim qanday ishlashini tezkor tekshiring",
      takeQuizBtn: "Test topshirish",
      feature1Title: "Faqat kitob faktlari (Zero Hallucination)",
      feature1Desc: "Barcha savollar, variantlar va to'g'ri javoblar faqat kitobingizning asl matniga tayanadi. Tashqi yolg'on ma'lumotlar kiritilmaydi.",
      feature2Title: "Eslab qolish metodikasi (Active Recall)",
      feature2Desc: "Shunchaki matnni qayta o'qish o'rniga, aqlli testlar orqali o'qiganlaringizni xotirada uzoq muddatga mustahkamlang.",
      feature3Title: "Tezkor tahlil va izohlar",
      feature3Desc: "Har bir savol bo'yicha kitobdan aniq iqtibos va tushunarli izohlar bilan bilimingizni to'liq baholang.",
    },
    settings: {
      backHome: "Bosh sahifaga qaytish",
      title: "Test parametrlarini sozlash",
      subtitle: "Kitobingiz bo'yicha test savollari soni va qiyinlik darajasini belgilang.",
      selectedBook: "Tanlangan kitob",
      numQuestions: "Savollar soni",
      questionsCount: "ta savol",
      difficultyTitle: "Qiyinlik darajasi",
      diffEasy: "Oson",
      diffEasyDesc: "Asosiy faktlar, atamalar va umumiy ma'lumotlar",
      diffMedium: "O'rtacha",
      diffMediumDesc: "Tushunchalar, sabab-oqibat va qoidalar",
      diffHard: "Qiyin",
      diffHardDesc: "Chuqur tahlil, nozik detallar va bog'liqliklar",
      diffMixed: "Aralash",
      diffMixedDesc: "Har xil darajadagi savollar majmuasi",
      questionTypesTitle: "Savol turlari",
      typeMultipleChoice: "Bir nechta variantli (Test)",
      typeTrueFalse: "Rost / Yolg'on",
      typeShortAnswer: "Qisqa yozma javob",
      focusTopicsTitle: "Asosiy mavzular / Boblar bo'yicha qamrov",
      focusTopicsDesc: "Sun'iy intellekt kitobingizdan quyidagi muhim bo'limlar va mavzularni ajratib oldi:",
      allTopics: "Barcha boblar va mavzular to'liq qamrab olinadi",
      generateBtn: "Testni yaratish va boshlash",
    },
    config: {
      chooseAnotherBook: "Boshqa kitob tanlash",
      docReady: "Hujjat tayyor",
      sampleText: "Namuna kitob",
      textExtractedVerified: "Matn to'liq o'qildi",
      title: "Test parametrlarini sozlash",
      subtitle: "Kitobingiz bo'yicha test savollari soni va qiyinlik darajasini belgilang.",
      questionCount: "Savollar soni",
      difficulty: "Qiyinlik darajasi",
      difficultyEasy: "Oson",
      difficultyEasyDesc: "Asosiy faktlar, atamalar va umumiy ma'lumotlar",
      difficultyMedium: "O'rtacha",
      difficultyMediumDesc: "Tushunchalar, sabab-oqibat va qoidalar",
      difficultyHard: "Qiyin",
      difficultyHardDesc: "Chuqur tahlil, nozik detallar va bog'liqliklar",
      difficultyMixed: "Aralash",
      difficultyMixedDesc: "Har xil darajadagi savollar majmuasi",
      questionTypes: "Savol turlari",
      questionTypesHint: "Bir nechtasini tanlash mumkin",
      selected: "ta tanlandi",
      typeMC: "Bir nechta variantli (Test)",
      typeMCDesc: "4 ta javob variantidan to'g'risini tanlash",
      typeTF: "Rost / Yolg'on",
      typeTFDesc: "Kitobdagi fakt haqiqat yoki yolg'onligini aniqlash",
      typeSA: "Qisqa yozma javob",
      typeSADesc: "Kitob faktlari bo'yicha o'z so'zingiz bilan javob yozish",
      guaranteeOnlyBook: "Savollar faqat kitob matniga asoslanadi",
      generateBtn: "Testni yaratish va boshlash",
    },
    loading: {
      stage1Title: "Kitobingiz o'qilmoqda...",
      stage1Desc: "Matn bo'laklari va boblar tuzilishi ajratib olinmoqda",
      stage2Title: "Muhim mavzular tahlil qilinmoqda...",
      stage2Desc: "Tushunchalar, asosiy atamalar, personajlar va hodisalar aniqlanmoqda",
      stage3Title: "Savollar yaratilmoqda...",
      stage3Desc: "Faqat kitobga asoslangan aniq savollar va javoblar kaliti shakllantirilmoqda",
      doneBadge: "Tayyor",
      bookLabel: "Kitob",
      questionsCountLabel: "Savollar soni",
      difficultyLabel: "Daraja",
      failedTitle: "Test yaratishda xatolik yuz berdi",
      tryAgain: "Qayta urinish",
      adjustSettings: "Sozlamalarni o'zgartirish",
    },
    quiz: {
      questionOf: "-savol /",
      answeredCount: "ta belgilandi",
      exitQuiz: "Testdan chiqish",
      questionTitle: "-savol",
      answered: "Javob berilgan",
      unanswered: "Javob berilmagan",
      typeMultipleChoice: "Variantli",
      typeTrueFalse: "Rost / Yolg'on",
      typeShortAnswer: "Qisqa javob",
      typeMC: "Variantli",
      typeTF: "Rost / Yolg'on",
      typeSA: "Qisqa javob",
      diffEasy: "Oson",
      diffMedium: "O'rtacha",
      diffHard: "Qiyin",
      trueLabel: "Rost (To'g'ri)",
      falseLabel: "Yolg'on (Noto'g'ri)",
      tfTrue: "Rost",
      tfFalse: "Yolg'on",
      yourAnswer: "Sizning javobingiz",
      placeholderShort: "Kitob mazmuni asosida qisqa va lo'nda javob yozing...",
      shortAnswerPrompt: "Sizning javobingiz (kitob matni va tushunchasi bo'yicha baholanadi):",
      shortAnswerPlaceholder: "Kitob mazmuni asosida qisqa va lo'nda javob yozing...",
      previous: "Oldingisi",
      next: "Keyingisi",
      submitQuiz: "Testni topshirish",
      unansweredModalTitle: "Sizda javob berilmagan savollar mavjud.",
      unansweredModalDesc: "Siz barcha savollarni belgilamadingiz. Quyidagi tugmalar orqali o'sha savolga qaytishingiz yoki testni shundayligicha topshirishingiz mumkin.",
      reviewQuestionBtn: "-savolni ko'rish",
      submitAnywayBtn: "Shunday topshirish",
      submitAnyway: "Shunday topshirish",
      progressHeader: "Test jarayoni",
      questionsLeft: "ta savol qoldi",
      allAnswered: "Barcha savollar belgilandi",
    },
    results: {
      badgeCompleted: "Test yakunlandi",
      title: "Sizning natijangiz",
      correctOutOf: "to'g'ri",
      correct: "To'g'ri",
      incorrect: "Noto'g'ri",
      skipped: "O'tkazilgan",
      reviewBtn: "Javoblar va izohlarni ko'rish",
      reviewAnswers: "Javoblar va izohlarni ko'rish",
      retakeBtn: "Testni qayta topshirish",
      retake: "Testni qayta topshirish",
      viewHistory: "Testlar tarixi",
      history: "Testlar tarixi",
      uploadAnother: "Boshqa kitob yuklash",
      scoreLabels: {
        excellent: "A'lo",
        veryGood: "Juda yaxshi",
        good: "Yaxshi",
        keepPracticing: "Mashq qilish kerak",
      },
    },
    review: {
      backToSummary: "Natijalar xulosasiga qaytish",
      title: "Javoblarni tahlil qilish",
      book: "Kitob",
      result: "Natija",
      bookInfo: "Kitob",
      retakeQuiz: "Testni qayta topshirish",
      retake: "Testni qayta topshirish",
      myQuizzes: "Mening testlarim",
      filterAll: "Barcha savollar",
      filterIncorrect: "Noto'g'ri",
      filterCorrect: "To'g'ri",
      noQuestionsFilter: "Ushbu filtr bo'yicha savollar topilmadi.",
      noQuestionsFound: "Ushbu filtr bo'yicha savollar topilmadi.",
      questionNumber: "-savol",
      badgeCorrect: "To'g'ri",
      badgeIncorrect: "Noto'g'ri",
      badgeUnanswered: "Javobsiz",
      correct: "To'g'ri",
      unanswered: "Javobsiz",
      incorrect: "Noto'g'ri",
      yourAnswer: "Sizning javobingiz",
      noAnswerProvided: "(Javob belgilanmagan)",
      notAnswered: "(Javob belgilanmagan)",
      correctAnswerBook: "To'g'ri javob (Kitob bo'yicha)",
      semanticEval: "Ma'noviy baholash:",
      semanticFeedback: "Ma'noviy baholash:",
      explanationBook: "Kitob asosidagi izoh",
      bookExplanation: "Kitob asosidagi izoh",
      sourceExcerpt: "Kitobdan havola / parcha:",
      backToResults: "Natijalarga qaytish",
      allQuizHistory: "Barcha testlar tarixi",
      allHistory: "Barcha testlar tarixi",
    },
    myQuizzes: {
      title: "Mening testlarim",
      subtitle: "Avval topshirilgan testlar natijalari, ballar tarixi va kitob javoblarini ko'ring.",
      newQuizBtn: "Yangi test",
      newQuiz: "Yangi test",
      searchPlaceholder: "Kitob nomi yoki fayl nomi bo'yicha qidirish...",
      noMatchTitle: "Qidiruv bo'yicha testlar topilmadi",
      noQuizzesFound: "Qidiruv bo'yicha testlar topilmadi",
      noCompletedTitle: "Hali testlar topshirilmagan",
      noQuizzesYet: "Hali testlar topshirilmagan",
      noMatchDesc: "Boshqa kitob nomi bilan qidirib ko'ring.",
      searchTryAnother: "Boshqa kitob nomi bilan qidirib ko'ring.",
      noCompletedDesc: "Bilimingizni sinash uchun birinchi kitobingizni PDF formatida yuklang.",
      emptySubtitle: "Bilimingizni sinash uchun birinchi kitobingizni PDF formatida yuklang.",
      uploadBookBtn: "Kitob yuklash",
      uploadBook: "Kitob yuklash",
      questionsSuffix: "ta savol",
      scoreLabel: "Ball",
      score: "Ball",
      difficultyLabel: "Daraja",
      level: "Daraja",
      openResultBtn: "Natija va javoblarni ochish",
      openResults: "Natija va javoblarni ochish",
      retakeTooltip: "Testni qayta topshirish",
      deleteTooltip: "O'chirish",
    },
    dashboard: {
      title: "Talaba paneli",
      subtitle: "Kitob o'qish natijalari, test ballari va o'quv yutuqlaringizni kuzatib boring.",
      uploadNewBookBtn: "Yangi kitob yuklash",
      uploadNewBook: "Yangi kitob yuklash",
      totalQuizzes: "Jami testlar",
      totalQuizzesSub: "Tekshirilgan kitoblar",
      quizzedBooks: "Tekshirilgan kitoblar",
      questionsAnswered: "Yechilgan savollar",
      questionsAnsweredSub: "Faol eslab qolish savollari",
      activeRecall: "Faol eslab qolish savollari",
      averageScore: "O'rtacha ball",
      averageScoreSub: "Barcha topshirilgan testlar",
      allQuizzesTaken: "Barcha topshirilgan testlar",
      bestScore: "Eng yuqori ball",
      bestScoreSub: "Eng yuqori ko'rsatkich",
      personalRecord: "Eng yuqori ko'rsatkich",
      recentQuizzes: "Yaqinda topshirilgan testlar",
      recentQuizzesSub: "Eng so'nggi bilimni tekshirish testlari",
      recentSubtitle: "Eng so'nggi bilimni tekshirish testlari",
      viewAll: "Barchasini ko'rish",
      noQuizzesYet: "Hali testlar topshirilmagan.",
    },
    footer: {
      tagline: "Aqlli kitob mutolaasi va bilimlarni mustahkamlash",
      poweredBy: "Gemini 3.8 Flash asosida",
      guarantee: "Faqat kitob faktlariga asoslangan",
      createdBy: "Yaratgan: Mirzajonova Gulnavoz",
      copyright: "Mualliflik huquqi himoyalangan",
      allRightsReserved: "Barcha huquqlar himoyalangan",
    },
    evaluating: {
      title: "Test natijalari hisoblanmoqda...",
      subtitle: "Javoblar kitob mazmuni bilan solishtirilmoqda va qisqa javoblar baholanmoqda.",
    },
    library: {
      title: "Kitoblar kutubxonasi",
      subtitle: "Yuklangan kitoblar katalogi. Istalgan kitobni to'g'ridan-to'g'ri o'qing yoki unga asoslangan test topshiring.",
      searchPlaceholder: "Kitob nomi, muallif yoki mavzu bo'yicha qidirish...",
      allGenres: "Barcha janrlar",
      sortBy: "Saralash:",
      sortRecent: "Eng yangi",
      sortAlphabetical: "Alifbo bo'yicha (A-Z)",
      sortPages: "Sahifalar soni bo'yicha",
      readBook: "O'qish (PDF)",
      takeQuiz: "Test topshirish",
      pages: "bet",
      noBooksFound: "Mos kitob topilmadi",
      noBooksDesc: "Qidiruv so'zini o'zgartirib ko'ring yoki boshqa janrni tanlang.",
      showingResults: "kitoblar ko'rsatilmoqda",
      previous: "Oldingi",
      next: "Keyingi",
      page: "Sahifa",
      of: "dan",
      authRequiredNotice: "Kitoblarni ko'rish va o'qish uchun iltimos, tizimga kiring yoki ro'yxatdan o'ting.",
    },
    admin: {
      title: "Kutubxona Admin Paneli",
      subtitle: "Kitoblarni boshqarish: yangi kitoblar qo'shish, tahrirlash va o'chirish. 500 MB gacha PDF fayllarni yuklash.",
      addNewBook: "Yangi kitob qo'shish",
      editBook: "Kitobni tahrirlash",
      deleteBook: "Kitobni o'chirish",
      deleteConfirm: "Haqiqatan ham ushbu kitobni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.",
      tableTitle: "Kitob nomi",
      tableAuthor: "Muallif",
      tableGenre: "Janr",
      tablePages: "Sahifalar",
      tableSize: "Hajmi",
      tableDate: "Yuklangan sana",
      tableActions: "Amallar",
      statsTotalBooks: "Jami kitoblar",
      statsGenres: "Janrlar soni",
      statsStorage: "Katalog hajmi",
      statsUploadLimit: "Yuklash limiti (500 MB)",
      formTitle: "Kitob nomi",
      formAuthor: "Muallif",
      formGenre: "Janr",
      formDesc: "Kitob haqida qisqacha tavsif",
      formCover: "Muqova rasmi (URL yoki fayl)",
      formCoverPlaceholder: "https://... yoki rasm yuklang",
      formPdf: "PDF faylini yuklash (500 MB gacha)",
      formPdfNote: "Fayl hajmi 500 MB gacha bo'lishi mumkin. PDF sahifalari avtomatik tahlil qilinadi.",
      uploadProgress: "Fayl yuklanmoqda va qayta ishlanmoqda...",
      uploadSuccess: "Fayl muvaffaqiyatli yuklandi!",
      saveBook: "Kitobni saqlash",
      saving: "Saqlanmoqda...",
      cancel: "Bekor qilish",
      unauthorizedTitle: "Ruxsat etilmagan",
      unauthorizedDesc: "Admin panelga faqat tizimga kirgan va administrator huquqiga ega foydalanuvchilar kira oladi.",
      loginAsAdmin: "Admin sifatida kirish",
    },
    reader: {
      backToLibrary: "Kutubxonaga qaytish",
      page: "Sahifa",
      of: "dan",
      zoomIn: "Kattalashtirish",
      zoomOut: "Kichraytirish",
      fitWidth: "Kenglikka moslash",
      fullscreen: "To'liq ekran",
      exitFullscreen: "Ekrandan chiqish",
      createQuiz: "Ushbu kitobdan test yaratish",
      loadingDocument: "PDF hujjat yuklanmoqda...",
      errorLoading: "PDF faylni yuklashda xatolik yuz berdi.",
      toc: "Mundarija",
    },
    auth: {
      loginTitle: "Tizimga kirish",
      loginSubtitle: "Kitoblarni o'qish va testlardan to'liq foydalanish uchun profilingizga kiring.",
      registerTitle: "Ro'yxatdan o'tish",
      registerSubtitle: "O'z shaxsiy hisobingizni oching va kitoblar xazinasidan foydalaning.",
      name: "Ism va familiyangiz",
      email: "Elektron pochta (Email)",
      password: "Parol (kamida 6 belgi)",
      loginBtn: "Kirish",
      registerBtn: "Ro'yxatdan o'tish",
      quickDemoAdmin: "Demo Admin (Mirzajonova Gulnavoz)",
      quickDemoUser: "Demo Foydalanuvchi (Talaba)",
      haveAccount: "Hisobingiz bormi? Kirish",
      noAccount: "Hisobingiz yo'qmi? Ro'yxatdan o'ting",
      authRequiredToRead: "Kutubxonadagi kitoblarni ko'rish va o'qish uchun tizimga kiring.",
      adminOnly: "Ushbu bo'lim faqat administratorlar uchun mo'ljallangan.",
    },
  },
  en: {
    nav: {
      tagline: "Turn any book into an intelligent quiz",
      newQuiz: "New Quiz",
      library: "Library",
      adminPanel: "Admin Panel",
      myQuizzes: "My Quizzes",
      dashboard: "Student Dashboard",
      login: "Log In",
      register: "Sign Up",
      logout: "Log Out",
      language: "Language",
      langUz: "O'zbekcha",
      langEn: "English",
    },
    home: {
      heroBadge: "100% Grounded in Your Book's Facts",
      heroTitle: "Turn any book into an intelligent quiz.",
      heroSubtitle: "Upload your book PDF — AI deeply analyzes the text and creates a professional quiz grounded strictly in the book's content.",
      dropzoneTitle: "Drop your book PDF here or browse files",
      dropzoneSubtitle: "Textbooks, study guides, non-fiction & fiction books (PDF)",
      browseFiles: "Choose PDF File",
      fileLimitNote: "Up to 100MB • Grounded strictly in book text",
      processingPdf: "Reading book PDF...",
      extractingPages: "Extracting pages and preparing text for analysis",
      errorInvalidPdf: "Invalid file format. Please upload a PDF document (.pdf).",
      errorEmptyPdf: "The selected file is empty (0 bytes). Please upload a valid document.",
      errorExtractFailed: "Failed to extract text from PDF. Please make sure the PDF has readable text and is not a scanned image.",
      previewBadge: "Book Ready for Assessment",
      changeFile: "Change file",
      statPages: "Pages",
      statWords: "Words",
      statChars: "Characters",
      statSize: "File Size",
      sampleExcerptTitle: "Book Excerpt Preview:",
      startConfigBtn: "Configure Quiz Settings",
      sampleBooksHeading: "Or try with preloaded sample books",
      sampleBooksSub: "Experience how the platform evaluates comprehension without uploading a file",
      takeQuizBtn: "Take Quiz",
      feature1Title: "Strictly Grounded (Zero Hallucination)",
      feature1Desc: "Every question, answer key, and distractor is provably tied to the book's text. No fabricated external facts.",
      feature2Title: "Active Recall Methodology",
      feature2Desc: "Instead of passive re-reading, active quiz retrieval strengthens memory consolidation and long-term retention.",
      feature3Title: "Instant Explanations & Citations",
      feature3Desc: "Get instant feedback with direct excerpt references and clear explanations explaining why answers are correct.",
    },
    settings: {
      backHome: "Back to Home",
      title: "Configure Quiz Settings",
      subtitle: "Set the number of questions, difficulty level, and question types for your book quiz.",
      selectedBook: "Selected Book",
      numQuestions: "Number of Questions",
      questionsCount: "questions",
      difficultyTitle: "Difficulty Level",
      diffEasy: "Easy",
      diffEasyDesc: "Key facts, vocabulary, definitions, and foundational recall",
      diffMedium: "Medium",
      diffMediumDesc: "Concepts, relationships, cause-and-effect, and rules",
      diffHard: "Hard",
      diffHardDesc: "Deep analysis, intricate details, synthesis, and nuanced distinctions",
      diffMixed: "Mixed",
      diffMixedDesc: "A balanced distribution across easy, medium, and hard tiers",
      questionTypesTitle: "Question Types",
      typeMultipleChoice: "Multiple Choice",
      typeTrueFalse: "True / False",
      typeShortAnswer: "Short Answer",
      focusTopicsTitle: "Core Topics / Chapter Coverage",
      focusTopicsDesc: "The AI identified the following key sections and concepts from your book:",
      allTopics: "Full book coverage across all chapters and sections",
      generateBtn: "Generate & Start Quiz",
    },
    config: {
      chooseAnotherBook: "Choose another book",
      docReady: "Document Ready",
      sampleText: "Sample Book",
      textExtractedVerified: "Text fully extracted & verified",
      title: "Configure Quiz Parameters",
      subtitle: "Set the number of questions, difficulty level, and question types for your book quiz.",
      questionCount: "Number of Questions",
      difficulty: "Difficulty Level",
      difficultyEasy: "Easy",
      difficultyEasyDesc: "Key facts, vocabulary, definitions, and foundational recall",
      difficultyMedium: "Medium",
      difficultyMediumDesc: "Concepts, relationships, cause-and-effect, and rules",
      difficultyHard: "Hard",
      difficultyHardDesc: "Deep analysis, intricate details, synthesis, and nuanced distinctions",
      difficultyMixed: "Mixed",
      difficultyMixedDesc: "A balanced distribution across easy, medium, and hard tiers",
      questionTypes: "Question Types",
      questionTypesHint: "Multiple can be selected",
      selected: "selected",
      typeMC: "Multiple Choice",
      typeMCDesc: "Pick the single correct choice out of 4 options",
      typeTF: "True / False",
      typeTFDesc: "Determine whether factual assertions from the book are true or false",
      typeSA: "Short Written Answer",
      typeSADesc: "Write concise answers evaluated semantically against the book",
      guaranteeOnlyBook: "Grounded strictly in book text",
      generateBtn: "Generate & Start Quiz",
    },
    loading: {
      stage1Title: "Reading your book...",
      stage1Desc: "Extracting text chunks and chapter structures",
      stage2Title: "Analyzing important topics...",
      stage2Desc: "Identifying concepts, key definitions, characters, and events",
      stage3Title: "Creating your questions...",
      stage3Desc: "Crafting strictly grounded questions and unambiguous answer keys",
      doneBadge: "Done",
      bookLabel: "Book",
      questionsCountLabel: "Questions",
      difficultyLabel: "Difficulty",
      failedTitle: "Quiz Generation Failed",
      tryAgain: "Try Again",
      adjustSettings: "Adjust Settings",
    },
    quiz: {
      questionOf: "Question",
      answeredCount: "answered",
      exitQuiz: "Exit Quiz",
      questionTitle: "Question",
      answered: "Answered",
      unanswered: "Unanswered",
      typeMultipleChoice: "Multiple Choice",
      typeTrueFalse: "True / False",
      typeShortAnswer: "Short Answer",
      typeMC: "Multiple Choice",
      typeTF: "True / False",
      typeSA: "Short Answer",
      diffEasy: "Easy",
      diffMedium: "Medium",
      diffHard: "Hard",
      trueLabel: "True",
      falseLabel: "False",
      tfTrue: "True",
      tfFalse: "False",
      yourAnswer: "Your Answer",
      placeholderShort: "Type your concise answer based on the book...",
      shortAnswerPrompt: "Your Answer (evaluated on meaning and book facts):",
      shortAnswerPlaceholder: "Type your concise answer based on the book...",
      previous: "Previous",
      next: "Next",
      submitQuiz: "Submit Quiz",
      unansweredModalTitle: "You still have unanswered questions.",
      unansweredModalDesc: "You have not answered all questions. You can jump directly to any unanswered question below, or submit as is.",
      reviewQuestionBtn: "Review Question",
      submitAnywayBtn: "Submit Anyway",
      submitAnyway: "Submit Anyway",
      progressHeader: "Quiz Progress",
      questionsLeft: "questions left",
      allAnswered: "All questions answered",
    },
    results: {
      badgeCompleted: "Quiz Completed",
      title: "Your Result",
      correctOutOf: "Correct",
      correct: "Correct",
      incorrect: "Incorrect",
      skipped: "Skipped",
      reviewBtn: "Review Answers with Explanations",
      reviewAnswers: "Review Answers with Explanations",
      retakeBtn: "Retake Quiz",
      retake: "Retake Quiz",
      viewHistory: "View Quiz History",
      history: "View Quiz History",
      uploadAnother: "Upload Another Book",
      scoreLabels: {
        excellent: "Excellent",
        veryGood: "Very Good",
        good: "Good",
        keepPracticing: "Keep Practicing",
      },
    },
    review: {
      backToSummary: "Back to Result Summary",
      title: "Review Answers",
      book: "Book",
      result: "Result",
      bookInfo: "Book",
      retakeQuiz: "Retake Quiz",
      retake: "Retake Quiz",
      myQuizzes: "My Quizzes",
      filterAll: "All Questions",
      filterIncorrect: "Incorrect",
      filterCorrect: "Correct",
      noQuestionsFilter: "No questions match this filter.",
      noQuestionsFound: "No questions match this filter.",
      questionNumber: "Question",
      badgeCorrect: "Correct",
      badgeIncorrect: "Incorrect",
      badgeUnanswered: "Unanswered",
      correct: "Correct",
      unanswered: "Unanswered",
      incorrect: "Incorrect",
      yourAnswer: "Your Answer",
      noAnswerProvided: "(No answer provided)",
      notAnswered: "(No answer provided)",
      correctAnswerBook: "Correct Answer (Book Key)",
      semanticEval: "Semantic Evaluation:",
      semanticFeedback: "Semantic Evaluation:",
      explanationBook: "Explanation Based on the Book",
      bookExplanation: "Explanation Based on the Book",
      sourceExcerpt: "Book Excerpt / Citation:",
      backToResults: "Back to Results",
      allQuizHistory: "View All Quiz History",
      allHistory: "View All Quiz History",
    },
    myQuizzes: {
      title: "My Quizzes",
      subtitle: "Review your past quiz performances, score histories, and book answers.",
      newQuizBtn: "New Quiz",
      newQuiz: "New Quiz",
      searchPlaceholder: "Search by book name or file name...",
      noMatchTitle: "No quizzes match your search",
      noQuizzesFound: "No quizzes match your search",
      noCompletedTitle: "No quizzes completed yet",
      noQuizzesYet: "No quizzes completed yet",
      noMatchDesc: "Try searching with a different book title.",
      searchTryAnother: "Try searching with a different book title.",
      noCompletedDesc: "Upload a book PDF to generate your first intelligent knowledge assessment.",
      emptySubtitle: "Upload a book PDF to generate your first intelligent knowledge assessment.",
      uploadBookBtn: "Upload a Book",
      uploadBook: "Upload a Book",
      questionsSuffix: "Questions",
      scoreLabel: "Score",
      score: "Score",
      difficultyLabel: "Difficulty",
      level: "Difficulty",
      openResultBtn: "Open Result & Answers",
      openResults: "Open Result & Answers",
      retakeTooltip: "Retake Quiz",
      deleteTooltip: "Delete record",
    },
    dashboard: {
      title: "Student Dashboard",
      subtitle: "Track your reading retention, quiz scores, and academic milestones.",
      uploadNewBookBtn: "Upload New Book",
      uploadNewBook: "Upload New Book",
      totalQuizzes: "Total Quizzes",
      totalQuizzesSub: "Books assessed",
      quizzedBooks: "Books assessed",
      questionsAnswered: "Questions Answered",
      questionsAnsweredSub: "Active recall items",
      activeRecall: "Active recall items",
      averageScore: "Average Score",
      averageScoreSub: "Across all completed quizzes",
      allQuizzesTaken: "Across all completed quizzes",
      bestScore: "Best Score",
      bestScoreSub: "Highest mastery record",
      personalRecord: "Highest mastery record",
      recentQuizzes: "Recent Quizzes",
      recentQuizzesSub: "Your most recent reading retention assessments",
      recentSubtitle: "Your most recent reading retention assessments",
      viewAll: "View All",
      noQuizzesYet: "No quizzes completed yet.",
    },
    footer: {
      tagline: "Smart Book Reading & Active Recall",
      poweredBy: "Powered by Gemini 3.8 Flash",
      guarantee: "Zero Hallucinations Guarantee",
      createdBy: "Created by Mirzajonova Gulnavoz",
      copyright: "Copyright protected",
      allRightsReserved: "All rights reserved",
    },
    evaluating: {
      title: "Grading Your Quiz...",
      subtitle: "Evaluating answers against book content and assessing short-answer semantics.",
    },
    library: {
      title: "Book Library & Catalog",
      subtitle: "Catalog of curated books. Read any book directly in the built-in PDF reader or generate an active recall quiz.",
      searchPlaceholder: "Search by book title, author, or keyword...",
      allGenres: "All Genres",
      sortBy: "Sort by:",
      sortRecent: "Recently Added",
      sortAlphabetical: "Alphabetical (A-Z)",
      sortPages: "Page Count",
      readBook: "Read (PDF)",
      takeQuiz: "Take Quiz",
      pages: "pages",
      noBooksFound: "No books found",
      noBooksDesc: "Try adjusting your search query or selecting a different genre.",
      showingResults: "books displayed",
      previous: "Previous",
      next: "Next",
      page: "Page",
      of: "of",
      authRequiredNotice: "Please log in or register to view and read books in the library.",
    },
    admin: {
      title: "Library Admin Panel",
      subtitle: "Manage books catalog: add, edit, and delete books. Supports PDF uploads up to 500 MB.",
      addNewBook: "Add New Book",
      editBook: "Edit Book",
      deleteBook: "Delete Book",
      deleteConfirm: "Are you sure you want to delete this book? This action cannot be undone.",
      tableTitle: "Book Title",
      tableAuthor: "Author",
      tableGenre: "Genre",
      tablePages: "Pages",
      tableSize: "Size",
      tableDate: "Uploaded Date",
      tableActions: "Actions",
      statsTotalBooks: "Total Books",
      statsGenres: "Categories",
      statsStorage: "Catalog Size",
      statsUploadLimit: "Upload Limit (500 MB)",
      formTitle: "Book Title",
      formAuthor: "Author",
      formGenre: "Genre",
      formDesc: "Book Description",
      formCover: "Cover Image (URL or file)",
      formCoverPlaceholder: "https://... or upload an image",
      formPdf: "Upload PDF Book (up to 500 MB)",
      formPdfNote: "Supports files up to 500 MB. Document structure and pages will be parsed automatically.",
      uploadProgress: "Uploading and processing PDF file...",
      uploadSuccess: "File uploaded successfully!",
      saveBook: "Save Book",
      saving: "Saving...",
      cancel: "Cancel",
      unauthorizedTitle: "Access Restricted",
      unauthorizedDesc: "Only authenticated administrators can access the Admin Panel.",
      loginAsAdmin: "Log In as Admin",
    },
    reader: {
      backToLibrary: "Back to Library",
      page: "Page",
      of: "of",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      fitWidth: "Fit Width",
      fullscreen: "Fullscreen",
      exitFullscreen: "Exit Fullscreen",
      createQuiz: "Create Quiz from This Book",
      loadingDocument: "Loading PDF document...",
      errorLoading: "Failed to render PDF document.",
      toc: "Contents",
    },
    auth: {
      loginTitle: "Log In to Your Account",
      loginSubtitle: "Sign in to read books and unlock all AI active recall quizzes.",
      registerTitle: "Create an Account",
      registerSubtitle: "Join to access the library and track your book comprehension.",
      name: "Full Name",
      email: "Email Address",
      password: "Password (min 6 characters)",
      loginBtn: "Log In",
      registerBtn: "Sign Up",
      quickDemoAdmin: "Demo Admin (Mirzajonova Gulnavoz)",
      quickDemoUser: "Demo User (Student)",
      haveAccount: "Already have an account? Log in",
      noAccount: "Don't have an account? Sign up",
      authRequiredToRead: "Please sign in to read books in the built-in reader.",
      adminOnly: "This area is restricted to administrators.",
    },
  },
};
