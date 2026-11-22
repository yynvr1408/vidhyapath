export type SupportedLang =
  | 'te'
  | 'hi'
  | 'en'
  | 'bn'
  | 'mr'
  | 'ta'
  | 'gu'
  | 'ur'
  | 'kn'
  | 'or'
  | 'ml'
  | 'pa'
  | 'as'
  | 'mai'
  | 'sat'
  | 'ks'
  | 'ne'
  | 'gom'
  | 'sd'
  | 'doi'
  | 'brx'
  | 'mni'
  | 'sa'
  | string;

export interface TranslationDictionary {
  // Common & Layout
  appTitle: string;
  tagline: string;
  gradeSubject: string;
  saved: string;
  offlineMode: string;
  noInternet: string;
  progressSafe: string;
  synced: string;
  lowDataNotice: string;
  listen: string;
  back: string;
  next: string;
  close: string;
  home: string;
  cancel: string;
  save: string;
  edit: string;
  delete: string;
  confirm: string;
  zeroPiiNotice: string;
  online: string;
  offlineSaved: string;
  simulateOffline: string;

  // Sidebar Navigation
  navMySyllabus: string;
  navAiTutor: string;
  navPractice: string;
  navProgress: string;
  navParentView: string;
  navSwitchProfile: string;

  // Bottom Navigation (Mobile Touch Bar)
  bottomNavSyllabus: string;
  bottomNavTutor: string;
  bottomNavPractice: string;
  bottomNavProgress: string;
  bottomNavParent: string;
  pressBackAgainToExit: string;

  // Screen 1: Profile Selector & PIN Modal
  landingTitle: string;
  landingSubtitle: string;
  tapToEnter: string;
  newStudentLabel: string;
  whoIsLearning: string;
  selectProfileSubtitle: string;
  enterPinPrompt: string;
  incorrectPin: string;
  addSampleProfile: string;
  nicknameLabel: string;
  classLabel: string;
  chooseAvatarLabel: string;
  setPinLabel: string;
  unlockProfileBtn: string;
  classText: string;

  // Page 1: My Syllabus (Learn)
  mySyllabusTitle: string;
  saveOffline: string;
  savedOffline: string;
  chapterProgress: string;
  practiceNow: string;
  workedExample: string;
  keyTakeaway: string;
  step: string;
  finalAnswer: string;

  // Page 2: AI Tutor (Ask Doubt)
  aiTutorTitle: string;
  chipExplainSimply: string;
  chipDailyExample: string;
  chipStepByStep: string;
  chipFormulaRecall: string;
  chipExamTip: string;
  pressMicToSpeak: string;
  typeDoubtPlaceholder: string;
  cameraPhoto: string;
  sendDoubt: string;
  thinking: string;
  tutorReplyHeader: string;
  offlinePreloadedBadge: string;
  frequentDoubtsHeader: string;

  // Page 3: Practice & Weak Topics
  practiceTitle: string;
  questionNumber: string;
  autoSavedNotice: string;
  needHint: string;
  nextHint: string;
  allHintsViewed: string;
  hintStep: string;
  voiceAnswer: string;
  greatJob: string;
  tryAgain: string;
  remedyHeading: string;
  correctOption: string;
  nextQuestion: string;
  sessionComplete: string;
  accuracy: string;
  correctCount: string;
  practiceMore: string;

  // Page 4: My Progress
  progressTitle: string;
  chaptersCompleted: string;
  quizzesFinished: string;
  overallAccuracy: string;
  topicsToRevise: string;
  reviseNow: string;
  weeklyStreak: string;
  activeDays: string;
  days: string[];

  // Page 5: Parent / Teacher View
  parentViewTitle: string;
  parentViewSubtitle: string;
  parentPinPrompt: string;
  parentPinHint: string;
  thisWeekSummary: string;
  topicStatusList: string;
  statusGood: string;
  statusPracticing: string;
  statusNeedsHelp: string;
  parentGuidance: string;
  practiceTogether: string;
  listenToReport: string;
  shareSummary: string;
  reportCopied: string;
  guardianZeroPii: string;
  sessionCompleteSub: string;

  // Extended UI Keys (Strict Trilingual)
  languageLabel: string;
  adminPortal: string;
  chapterLabel: string;
  autoFallbackBtn: string;
  manualOfflineBtn: string;
  lanternActiveBadge: string;
  photoDoubtPrompt: string;
  photoUploadTitle: string;
  voiceNotSupported: string;
  micDenied: string;
  networkRequiredVoice: string;
  voiceListening: string;
  voiceDisabledLowData: string;
  audioStop: string;
  audioUnavailable: string;
  signOut: string;
  stopAudio: string;
  completedSessions: string;
  averageAccuracy: string;
  unlockBtn: string;
  strongTopicsLabel: string;
  needsHelpTopicsLabel: string;
  checkUpdates: string;
  updateAvailable: string;
  updateNow: string;
  appUpToDate: string;
  checkingUpdates: string;
  currentVersionLabel: string;
  latestVersionLabel: string;
  appUpdate: string;
  done: string;
  changelog: string;
  reloadApp: string;
  updateCheckFailed: string;

  // AI Tutor redesign (low-literacy, tap-first UI)
  welcomeGreeting: string;
  welcomeSpeakCard: string;
  welcomePhotoCard: string;
  starterExplainChapter: string;
  starterDailyExample: string;
  speakBtn: string;
  listenReply: string;
  listeningNow: string;
  stopListening: string;
  replyChipSimpler: string;
  replyChipExample: string;
  replyChipStepByStep: string;
  tutorThinking: string;
  removePhoto: string;
  photoAttachedAlt: string;

  // Student PIN Recovery via Safety Question (Zero Email / Zero OTP)
  forgotPin: string;
  resetPinViaSafetyQuestion: string;
  securityQuestionLabel: string;
  securityAnswerLabel: string;
  enterSecurityAnswer: string;
  securityAnswerPlaceholder: string;
  verifyAnswer: string;
  incorrectSecurityAnswer: string;
  enterNewPin: string;
  pinResetSuccess: string;
  backToPin: string;
  noEmailOrOtpNeeded: string;
}

export const TRANSLATIONS: Record<SupportedLang, TranslationDictionary> = {
  te: {
    appTitle: 'విద్యాపథ్',
    tagline: 'చివరి మైలు విద్యార్థి కోసం స్మార్ట్ ట్యూటర్',
    gradeSubject: '10వ తరగతి గణితం (AP స్టేట్ బోర్డ్)',
    saved: 'సేవ్ అయింది',
    offlineMode: 'ఆఫ్‌లైన్ మోడ్ · జీరో డేటా',
    noInternet: 'ఇంటర్నెట్ లేదు',
    progressSafe: 'ప్రోగ్రెస్ సురక్షితం',
    synced: 'సర్వర్‌తో సేవ్ అయింది!',
    lowDataNotice: 'తక్కువ డేటా మోడ్ ఆన్‌లో ఉంది',
    listen: 'వినండి',
    back: 'వెనుకకు',
    next: 'ముందుకు',
    close: 'మూసివేయి',
    home: 'హోమ్',
    cancel: 'రద్దు చేయి',
    save: 'సేవ్ చేయి',
    edit: 'మార్చు',
    delete: 'తొలగించు',
    confirm: 'నిర్ధారించు',
    zeroPiiNotice: 'సురక్షితం · ఎలాంటి వ్యక్తిగత వివరాలు లేదా ఫోన్ నంబర్లు అవసరం లేదు',
    online: 'ఆన్‌లైన్',
    offlineSaved: 'ఆఫ్‌లైన్ - ఫోన్‌లో సేవ్ అయింది',
    simulateOffline: 'ఆఫ్‌లైన్ మోడ్ సిమ్యులేషన్',

    navMySyllabus: 'నా సిలబస్ (పాఠాలు)',
    navAiTutor: 'AI ట్యూటర్ (సందేహం)',
    navPractice: 'సాధన & బలహీన అంశాలు',
    navProgress: 'నా ప్రగతి',
    navParentView: 'తల్లిదండ్రులు / ఉపాధ్యాయుల వ్యూ',
    navSwitchProfile: 'ప్రొఫైల్ మార్చు (లాగౌట్)',

    bottomNavSyllabus: 'సిలబస్',
    bottomNavTutor: 'AI ట్యూటర్',
    bottomNavPractice: 'సాధన',
    bottomNavProgress: 'ప్రగతి',
    bottomNavParent: 'తల్లిదండ్రులు',
    pressBackAgainToExit: 'యాప్ నుండి నిష్క్రమించడానికి మళ్లీ వెనక్కి నొక్కండి',

    landingTitle: 'మీ ప్రొఫైల్ ఎంచుకోండి',
    landingSubtitle: 'మీ పేరుపై ట్యాప్ చేసి, 1234 పిన్ నమోదు చేయండి',
    tapToEnter: 'ప్రవేశించండి (పిన్: 1234)',
    newStudentLabel: 'కొత్త విద్యార్థి',
    whoIsLearning: 'ఎవరు చదువుకుంటున్నారు?',
    selectProfileSubtitle: 'కుటుంబ ఫోన్‌లో మీ ప్రొఫైల్‌ను ఎంచుకోండి',
    enterPinPrompt: '4 అంకెల పిన్ నమోదు చేయండి',
    incorrectPin: 'తప్పు పిన్! దయచేసి 1234 ను ప్రయత్నించండి.',
    addSampleProfile: '+ కొత్త ప్రొఫైల్ చేర్చండి',
    nicknameLabel: 'విద్యార్థి పేరు',
    classLabel: 'తరగతి (ఉదా: 9వ లేదా 10వ తరగతి)',
    chooseAvatarLabel: 'అవతార్ ఎంచుకోండి',
    setPinLabel: '4 అంకెల పిన్ సెట్ చేయండి (ఉదా: 1234)',
    unlockProfileBtn: 'ప్రొఫైల్ అన్‌లాక్ చేయండి',
    classText: 'వ తరగతి',

    mySyllabusTitle: 'నా సిలబస్ (అధ్యాయాలు)',
    saveOffline: 'ఆఫ్‌లైన్ డౌన్‌లోడ్',
    savedOffline: 'ఆఫ్‌లైన్‌లో సేవ్ అయింది ✓',
    chapterProgress: 'అధ్యాయ ప్రగతి',
    practiceNow: 'ఇప్పుడే సాధన చేయి',
    workedExample: 'సాధించిన ఉదాహరణ:',
    keyTakeaway: 'ముఖ్య గమనిక:',
    step: 'దశ',
    finalAnswer: 'తుది జవాబు:',

    aiTutorTitle: 'AI ట్యూటర్ (గణిత సహాయం)',
    chipExplainSimply: 'సులభంగా వివరించండి',
    chipDailyExample: 'నిత్యజీవిత ఉదాహరణ ఇవ్వండి',
    chipStepByStep: 'దశలవారీగా సాధించండి',
    chipFormulaRecall: 'సూత్రం గుర్తుచేయండి',
    chipExamTip: 'పరీక్ష ముఖ్యమైన చిట్కా',
    pressMicToSpeak: 'మైక్ నొక్కి మీ సందేహం మాట్లాడండి',
    typeDoubtPlaceholder: 'లేదా ఇక్కడ టైప్ చేయండి...',
    cameraPhoto: 'ఫోటో',
    sendDoubt: 'పంపు',
    thinking: 'ఆలోచిస్తున్నాను...',
    tutorReplyHeader: 'ట్యూటర్ వివరణ',
    offlinePreloadedBadge: 'ఆఫ్‌లైన్ నిల్వ',
    frequentDoubtsHeader: 'తరచుగా అడిగే సందేహాలు (ఆఫ్‌లైన్ సమాధానాలు):',

    practiceTitle: 'సాధన & బలహీన అంశాల పరీక్ష',
    questionNumber: 'ప్రశ్న',
    autoSavedNotice: 'సమాధానాలు మీ ఫోన్‌లోనే సురక్షితంగా ఆఫ్‌లైన్‌లో సేవ్ అవుతాయి',
    needHint: 'సూచన కావాలా?',
    nextHint: 'తదుపరి సూచన',
    allHintsViewed: 'అన్ని సూచనలు చూశారు',
    hintStep: 'సూచన దశ',
    voiceAnswer: 'వాయిస్ జవాబు',
    greatJob: 'చాలా బాగుంది! సరైన జవాబు!',
    tryAgain: 'ఒకసారి నిశితంగా పరిశీలిద్దాం',
    remedyHeading: 'గుర్తుంచుకోవలసిన విషయం:',
    correctOption: 'సరైన ఆప్షన్:',
    nextQuestion: 'తదుపరి ప్రశ్న',
    sessionComplete: 'అభినందనలు! సాధన పూర్తయింది',
    accuracy: 'ఖచ్చితత్వం',
    correctCount: 'సరైన జవాబులు',
    practiceMore: 'మరో 5 ప్రశ్నల సాధన చేయి',

    progressTitle: 'నా ప్రగతి సారాంశం',
    chaptersCompleted: 'పూర్తయిన అధ్యాయాలు',
    quizzesFinished: 'సాధన పరీక్షలు',
    overallAccuracy: 'సగటు ఖచ్చితత్వం',
    topicsToRevise: 'తిరిగి సాధన చేయవలసిన అంశాలు (బలహీనమైనవి):',
    reviseNow: 'ఇప్పుడే పునశ్చరణ చేయి',
    weeklyStreak: 'వారపు సాధన రోజులు',
    activeDays: 'ఈ వారం 5 రోజులు క్రియాశీలకంగా ఉన్నారు',
    days: ['సోమ', 'మంగళ', 'బుధ', 'గురు', 'శుక్ర', 'శని', 'ఆది'],

    parentViewTitle: 'తల్లిదండ్రులు & ఉపాధ్యాయుల వ్యూ',
    parentViewSubtitle: 'సులభమైన పురోగతి సమీక్ష',
    parentPinPrompt: 'సంరక్షకుని వ్యూ కోసం 4 అంకెల పిన్ నమోదు చేయండి',
    parentPinHint: 'డెమో పిన్: 1234',
    thisWeekSummary: 'ఈ వారం సారాంశం',
    topicStatusList: 'అధ్యాయాల నైపుణ్య స్థితి',
    statusGood: 'బాగా వచ్చు',
    statusPracticing: 'సాధన చేస్తున్నారు',
    statusNeedsHelp: 'మరింత శ్రద్ధ అవసరం',
    parentGuidance: 'తల్లిదండ్రులు / ఉపాధ్యాయులు చేయవలసిన సూచన:',
    practiceTogether: 'ఇంట్లో కలిసి సాధన చేసే సరదా ఆట:',
    listenToReport: 'వాయిస్ నివేదిక వినండి',
    shareSummary: 'వాట్సాప్ / SMS ద్వారా పంపండి',
    reportCopied: 'నివేదిక కాపీ అయింది! వాట్సాప్‌లో పంపవచ్చు.',
    guardianZeroPii: 'సురక్షిత విద్యార్థి ప్రొఫైల్',
    sessionCompleteSub: 'మీరు ఈ సెషన్‌లో 5 ప్రశ్నలను సాధన చేశారు',
    languageLabel: 'భాష:',
    adminPortal: 'అడ్మిన్ & ఉపాధ్యాయుల పోర్టల్',
    chapterLabel: 'అధ్యాయం:',
    autoFallbackBtn: '⚡ ఆటో ఫాల్‌బ్యాక్',
    manualOfflineBtn: '🔒 ఆఫ్‌లైన్ (0 డేటా)',
    lanternActiveBadge: '🏮 అధ్యాయ లాంతరు యాక్టివ్',
    photoDoubtPrompt: 'చిత్రంలో ఉన్న లెక్కను దశలవారీగా వివరించండి',
    photoUploadTitle: 'నోట్‌బుక్ / బోర్డు ఫోటో',
    voiceNotSupported: 'వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు. దయచేసి టైప్ చేయండి లేదా ఆప్షన్ ఎంచుకోండి.',
    micDenied: 'మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి బటన్ల ద్వారా ఎంచుకోండి.',
    networkRequiredVoice: 'వాయిస్ రికగ్నిషన్‌కు ఇంటర్నెట్ అవసరం. బటన్ల ద్వారా ఎంచుకోండి.',
    voiceListening: 'వింటున్నాము... మాట్లాడండి',
    voiceDisabledLowData: 'తక్కువ డేటా మోడ్‌లో వాయిస్ నిలిపివేయబడింది',
    audioStop: 'ఆపు',
    audioUnavailable: 'ఆడియో అందుబాటులో లేదు',
    signOut: 'లాగ్ అవుట్',
    stopAudio: 'ఆపు',
    completedSessions: 'పూర్తయిన సెషన్లు',
    averageAccuracy: 'సగటు ఖచ్చితత్వం',
    unlockBtn: 'అన్‌లాక్ చేయండి',
    strongTopicsLabel: 'బాగా వచ్చిన అంశాలు',
    needsHelpTopicsLabel: 'శ్రద్ధ అవసరమైన అంశాలు',
    checkUpdates: 'అప్‌డేట్‌లు తనిఖీ చేయి',
    updateAvailable: 'కొత్త అప్‌డేట్ సిద్ధంగా ఉంది!',
    updateNow: 'ఇప్పుడే అప్‌డేట్ చేసుకోండి',
    appUpToDate: 'తాజా వెర్షన్ ఇన్‌స్టాల్ అయింది',
    checkingUpdates: 'తనిఖీ చేస్తున్నాము...',
    currentVersionLabel: 'ప్రస్తుత వెర్షన్',
    latestVersionLabel: 'తాజా వెర్షన్',
    appUpdate: 'యాప్ అప్‌డేట్',
    done: 'పూర్తయింది',
    changelog: 'కొత్త మార్పులు',
    reloadApp: 'తాజా వెర్షన్‌ను లోడ్ చేయి',
    updateCheckFailed: 'అప్‌డేట్ తనిఖీ విఫలమైంది. ఇంటర్నెట్ సరిచూసుకోండి.',
    welcomeGreeting: 'హలో! మీ సందేహాన్ని అడగండి — మాట్లాడండి లేదా ఫోటో తీయండి.',
    welcomeSpeakCard: '🎤 మీ సందేహం మాట్లాడండి',
    welcomePhotoCard: '📷 ప్రశ్న ఫోటో తీయండి',
    starterExplainChapter: 'ఈ అధ్యాయాన్ని సులభంగా వివరించండి',
    starterDailyExample: 'రోజువారీ ఉదాహరణ ఇవ్వండి',
    speakBtn: 'మాట్లాడండి',
    listenReply: 'వినండి',
    listeningNow: 'వింటున్నాను... ఇప్పుడు మాట్లాడండి',
    stopListening: 'ఆపు',
    replyChipSimpler: 'ఇంకా సులభంగా చెప్పండి',
    replyChipExample: 'రోజువారీ ఉదాహరణ ఇవ్వండి',
    replyChipStepByStep: 'స్టెప్ బై స్టెప్ చెప్పండి',
    tutorThinking: 'ట్యూటర్ ఆలోచిస్తున్నాడు...',
    removePhoto: 'ఫోటోను తీసివేయి',
    photoAttachedAlt: 'ప్రశ్న ఫోటో',

    forgotPin: 'పిన్ మర్చిపోయారా?',
    resetPinViaSafetyQuestion: 'భద్రతా ప్రశ్నతో పిన్ రీసెట్ చేయండి',
    securityQuestionLabel: 'భద్రతా ప్రశ్న',
    securityAnswerLabel: 'మీ సమాధానం',
    enterSecurityAnswer: 'మీ భద్రతా ప్రశ్నకు సమాధానం ఇవ్వండి',
    securityAnswerPlaceholder: 'ఉదాహరణ: Maths లేదా మీ సమాధానం',
    verifyAnswer: 'సమాధానం సరిచూడండి',
    incorrectSecurityAnswer: 'సమాధానం సరిపోలలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.',
    enterNewPin: 'కొత్త 4-అంకెల పిన్ నమోదు చేయండి',
    pinResetSuccess: 'పిన్ విజయవంతంగా మార్చబడింది! తెరుస్తున్నాము...',
    backToPin: 'తిరిగి పిన్ నమోదుకు',
    noEmailOrOtpNeeded: 'ఈమెయిల్ లేదా OTP అవసరం లేదు (విద్యార్థి సురక్షిత మోడ్)',
  },

  en: {
    appTitle: 'Vidyapath',
    tagline: 'The Last-Mile Tutor for Class 10 Maths',
    gradeSubject: 'Class 10 Mathematics (State/CBSE)',
    saved: 'Saved',
    offlineMode: 'Offline Mode · Zero Data',
    noInternet: 'No Internet',
    progressSafe: 'Progress Safe',
    synced: 'Synced with server!',
    lowDataNotice: 'Low Data Mode Active',
    listen: 'Hear',
    back: 'Back',
    next: 'Next',
    close: 'Close',
    home: 'Home',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    zeroPiiNotice: 'Safe & Private · No personal data or phone numbers collected (Zero-PII)',
    online: 'Online',
    offlineSaved: 'Offline - Saved on Phone',
    simulateOffline: 'Simulate Offline Mode',

    navMySyllabus: 'My Syllabus (Learn)',
    navAiTutor: 'AI Tutor (Ask Doubt)',
    navPractice: 'Practice & Weak Topics',
    navProgress: 'My Progress',
    navParentView: 'Parent / Teacher View',
    navSwitchProfile: 'Switch Profile (Exit)',

    bottomNavSyllabus: 'Syllabus',
    bottomNavTutor: 'AI Tutor',
    bottomNavPractice: 'Practice',
    bottomNavProgress: 'Progress',
    bottomNavParent: 'Parent',
    pressBackAgainToExit: 'Press back again to exit the app',

    landingTitle: 'Select Your Profile',
    landingSubtitle: 'Tap your profile and enter PIN 1234 to start learning',
    tapToEnter: 'Enter (PIN: 1234)',
    newStudentLabel: 'New Student',
    whoIsLearning: 'Who is learning today?',
    selectProfileSubtitle: 'Select your student profile on this family phone',
    enterPinPrompt: 'Enter 4-Digit Student PIN',
    incorrectPin: 'Incorrect PIN! Try entering 1234.',
    addSampleProfile: '+ Add Sample Profile',
    nicknameLabel: 'Student Name / Nickname',
    classLabel: 'Class (e.g. Class 9 or 10)',
    chooseAvatarLabel: 'Choose Avatar',
    setPinLabel: 'Set 4-Digit PIN (e.g. 1234)',
    unlockProfileBtn: 'Unlock Profile',
    classText: 'Class',

    mySyllabusTitle: 'My Syllabus (Chapters)',
    saveOffline: 'Save Offline',
    savedOffline: 'Saved Offline ✓',
    chapterProgress: 'Chapter Progress',
    practiceNow: 'Practice Now',
    workedExample: 'Worked Example:',
    keyTakeaway: 'Key Takeaway:',
    step: 'Step',
    finalAnswer: 'Final Answer:',

    aiTutorTitle: 'AI Tutor (Ask Doubt)',
    chipExplainSimply: 'Explain simply',
    chipDailyExample: 'Give daily-life example',
    chipStepByStep: 'Solve step-by-step',
    chipFormulaRecall: 'Recall the formula',
    chipExamTip: 'Key exam tip',
    pressMicToSpeak: 'Tap mic and speak your doubt',
    typeDoubtPlaceholder: 'Or type here...',
    cameraPhoto: 'Photo',
    sendDoubt: 'Send',
    thinking: 'Thinking...',
    tutorReplyHeader: 'Tutor Explanation',
    offlinePreloadedBadge: 'Offline Pre-loaded',
    frequentDoubtsHeader: 'Frequently Asked Questions (Offline Answers):',

    practiceTitle: 'Practice & Weak Topics',
    questionNumber: 'Question',
    autoSavedNotice: 'Answers are auto-saved locally on your phone even if internet drops',
    needHint: 'Need a Hint?',
    nextHint: 'Next Hint',
    allHintsViewed: 'All Hints Viewed',
    hintStep: 'Hint Step',
    voiceAnswer: 'Voice Answer',
    greatJob: "Great job! That's correct!",
    tryAgain: "Let's inspect closely",
    remedyHeading: 'Key Concept to Remember (Remedy):',
    correctOption: 'Correct Option:',
    nextQuestion: 'Next Question',
    sessionComplete: 'Congratulations! Practice Complete',
    accuracy: 'Accuracy',
    correctCount: 'Correct Answers',
    practiceMore: 'Practice Another 5 Questions',

    progressTitle: 'My Learning Progress',
    chaptersCompleted: 'Chapters Completed',
    quizzesFinished: 'Practice Quizzes',
    overallAccuracy: 'Overall Accuracy',
    topicsToRevise: 'Topics to Revise (Weak Areas):',
    reviseNow: 'Revise Now',
    weeklyStreak: 'Weekly Study Days',
    activeDays: '5 days active this week',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],

    parentViewTitle: 'Parent & Teacher View',
    parentViewSubtitle: 'Simple, jargon-free student progress summary',
    parentPinPrompt: 'Enter 4-Digit Parent PIN to Unlock',
    parentPinHint: 'Demo PIN: 1234',
    thisWeekSummary: "This Week's Summary",
    topicStatusList: 'Chapter Mastery Status',
    statusGood: 'Good (Mastered)',
    statusPracticing: 'Practicing',
    statusNeedsHelp: 'Needs Help',
    parentGuidance: 'Guidance for Parents & Volunteers:',
    practiceTogether: 'Fun Activity to Practice at Home:',
    listenToReport: 'Listen to Report (Audio)',
    shareSummary: 'Share via WhatsApp / SMS',
    reportCopied: 'Progress report copied! Ready to paste into WhatsApp.',
    guardianZeroPii: 'Verified Student Profile (Zero-PII)',
    sessionCompleteSub: 'You solved 5 questions in this session',
    languageLabel: 'Language:',
    adminPortal: 'Admin & Teacher Portal',
    chapterLabel: 'Chapter:',
    autoFallbackBtn: '⚡ Auto Fallback',
    manualOfflineBtn: '🔒 Manual (0 Data)',
    lanternActiveBadge: '🏮 Chapter Lantern Active',
    photoDoubtPrompt: 'Please explain the math problem in this photo step-by-step',
    photoUploadTitle: 'Notebook / Blackboard Photo',
    voiceNotSupported: 'Voice recognition is not supported. Please type or select an option.',
    micDenied: 'Microphone permission was denied. Please select with buttons.',
    networkRequiredVoice: 'Voice recognition requires an internet connection. Please select with buttons.',
    voiceListening: 'Listening... please speak',
    voiceDisabledLowData: 'Voice is disabled in low data mode',
    audioStop: 'Stop',
    audioUnavailable: 'Audio unavailable',
    signOut: 'Sign Out',
    stopAudio: 'Stop',
    completedSessions: 'Sessions Completed',
    averageAccuracy: 'Average Accuracy',
    unlockBtn: 'Unlock',
    strongTopicsLabel: 'Strong Topics',
    needsHelpTopicsLabel: 'Needs Help',
    checkUpdates: 'Check for Updates',
    updateAvailable: 'New Update Available!',
    updateNow: 'Update Now',
    appUpToDate: 'App is up to date',
    checkingUpdates: 'Checking for updates...',
    currentVersionLabel: 'Current Version',
    latestVersionLabel: 'Latest Version',
    appUpdate: 'App Update',
    done: 'Done',
    changelog: "What's New",
    reloadApp: 'Reload to Update',
    updateCheckFailed: 'Update check failed. Check your internet connection.',
    welcomeGreeting: 'Hello! Ask your doubt — speak or take a photo.',
    welcomeSpeakCard: '🎤 Speak Your Doubt',
    welcomePhotoCard: '📷 Take Photo of Question',
    starterExplainChapter: 'Explain this chapter simply',
    starterDailyExample: 'Give a daily-life example',
    speakBtn: 'Speak',
    listenReply: 'Listen',
    listeningNow: 'Listening... Speak now',
    stopListening: 'Stop',
    replyChipSimpler: 'Make it simpler',
    replyChipExample: 'Give a daily-life example',
    replyChipStepByStep: 'Explain step-by-step',
    tutorThinking: 'Tutor is thinking...',
    removePhoto: 'Remove photo',
    photoAttachedAlt: 'Question photo',

    forgotPin: 'Forgot PIN?',
    resetPinViaSafetyQuestion: 'Reset PIN via Safety Question',
    securityQuestionLabel: 'Safety Question',
    securityAnswerLabel: 'Your Answer',
    enterSecurityAnswer: 'Answer your safety question',
    securityAnswerPlaceholder: 'e.g. Maths or your answer',
    verifyAnswer: 'Verify Answer',
    incorrectSecurityAnswer: 'Answer does not match. Please try again.',
    enterNewPin: 'Enter New 4-Digit PIN',
    pinResetSuccess: 'PIN reset successfully! Unlocking...',
    backToPin: 'Back to PIN',
    noEmailOrOtpNeeded: 'No email or OTP required (Student Safe Mode)',
  },

  hi: {
    appTitle: 'विद्यापथ',
    tagline: 'अंतिम छोर के छात्र के लिए गणित ट्यूटर',
    gradeSubject: 'कक्षा 10 गणित (स्टेट/सीबीएसई)',
    saved: 'सहेजा गया',
    offlineMode: 'ऑफलाइन मोड · शून्य डेटा',
    noInternet: 'इंटरनेट नहीं है',
    progressSafe: 'प्रगति सुरक्षित',
    synced: 'सर्वर के साथ सहेजा गया!',
    lowDataNotice: 'कम डेटा मोड सक्रिय',
    listen: 'सुनें',
    back: 'पीछे',
    next: 'आगे',
    close: 'बंद करें',
    home: 'होम',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    confirm: 'पुष्टि करें',
    zeroPiiNotice: 'सुरक्षित एवं निजी · कोई व्यक्तिगत डेटा या फोन नंबर एकत्र नहीं किया जाता',
    online: 'ऑनलाइन',
    offlineSaved: 'ऑफलाइन - फोन पर सहेजा गया',
    simulateOffline: 'ऑफलाइन मोड सिमुलेशन',

    navMySyllabus: 'मेरा पाठ्यक्रम (पाठ)',
    navAiTutor: 'AI ट्यूटर (संदेह पूछें)',
    navPractice: 'अभ्यास और कमजोर विषय',
    navProgress: 'मेरी प्रगति',
    navParentView: 'अभिभावक / शिक्षक दृश्य',
    navSwitchProfile: 'प्रोफ़ाइल बदलें (लॉगआउट)',

    bottomNavSyllabus: 'पाठ्यक्रम',
    bottomNavTutor: 'AI ट्यूटर',
    bottomNavPractice: 'अभ्यास',
    bottomNavProgress: 'प्रगति',
    bottomNavParent: 'अभिभावक',
    pressBackAgainToExit: 'ऐप से बाहर निकलने के लिए फिर से बैक दबाएं',

    landingTitle: 'अपनी प्रोफ़ाइल चुनें',
    landingSubtitle: 'अपने नाम पर टैप करें और पिन 1234 दर्ज करें',
    tapToEnter: 'प्रवेश करें (पिन: 1234)',
    newStudentLabel: 'नया छात्र',
    whoIsLearning: 'आज कौन पढ़ाई कर रहा है?',
    selectProfileSubtitle: 'साझा फोन पर अपना छात्र प्रोफ़ाइल चुनें',
    enterPinPrompt: '4 अंकों का पिन दर्ज करें',
    incorrectPin: 'गलत पिन! कृपया 1234 दर्ज करके देखें।',
    addSampleProfile: '+ नया प्रोफ़ाइल जोड़ें',
    nicknameLabel: 'छात्र का नाम',
    classLabel: 'कक्षा (उदा: कक्षा 9 या 10)',
    chooseAvatarLabel: 'अवतार चुनें',
    setPinLabel: '4 अंकों का पिन सेट करें (उदा: 1234)',
    unlockProfileBtn: 'प्रोफ़ाइल अनलॉक करें',
    classText: 'कक्षा',

    mySyllabusTitle: 'मेरा पाठ्यक्रम (अध्याय)',
    saveOffline: 'ऑफलाइन डाउनलोड',
    savedOffline: 'ऑफलाइन सहेजा गया ✓',
    chapterProgress: 'अध्याय प्रगति',
    practiceNow: 'अभी अभ्यास करें',
    workedExample: 'हल किया गया उदाहरण:',
    keyTakeaway: 'मुख्य बिंदु:',
    step: 'चरण',
    finalAnswer: 'अंतिम उत्तर:',

    aiTutorTitle: 'AI ट्यूटर (संदेह समाधान)',
    chipExplainSimply: 'सरल भाषा में समझाएं',
    chipDailyExample: 'दैनिक जीवन का उदाहरण दें',
    chipStepByStep: 'चरणबद्ध तरीके से हल करें',
    chipFormulaRecall: 'सूत्र याद दिलाएं',
    chipExamTip: 'परीक्षा हेतु मुख्य सुझाव',
    pressMicToSpeak: 'माइक दबाकर अपना संदेह बोलें',
    typeDoubtPlaceholder: 'या यहाँ लिखें...',
    cameraPhoto: 'फोटो',
    sendDoubt: 'भेजें',
    thinking: 'सोच रहा हूँ...',
    tutorReplyHeader: 'ट्यूटर की व्याख्या',
    offlinePreloadedBadge: 'ऑफलाइन उपलब्ध',
    frequentDoubtsHeader: 'अक्सर पूछे जाने वाले प्रश्न (ऑफलाइन उत्तर):',

    practiceTitle: 'अभ्यास और कमजोर विषय',
    questionNumber: 'प्रश्न',
    autoSavedNotice: 'उत्तर आपके फोन में स्वचालित रूप से ऑफलाइन सुरक्षित रहते हैं',
    needHint: 'संकेत चाहिए?',
    nextHint: 'अगला संकेत',
    allHintsViewed: 'सभी संकेत देख लिए',
    hintStep: 'संकेत चरण',
    voiceAnswer: 'बोलकर उत्तर दें',
    greatJob: 'बहुत बढ़िया! सही उत्तर!',
    tryAgain: 'आइए ध्यान से देखें',
    remedyHeading: 'याद रखने योग्य मुख्य बात (Remedy):',
    correctOption: 'सही विकल्प:',
    nextQuestion: 'अगला प्रश्न',
    sessionComplete: 'बधाई हो! अभ्यास पूरा हुआ',
    accuracy: 'सटीकता',
    correctCount: 'सही उत्तर',
    practiceMore: '5 और प्रश्नों का अभ्यास करें',

    progressTitle: 'मेरी सीखने की प्रगति',
    chaptersCompleted: 'पूर्ण किए गए अध्याय',
    quizzesFinished: 'अभ्यास क्विज़',
    overallAccuracy: 'औसत सटीकता',
    topicsToRevise: 'पुनरावृत्ति हेतु कमजोर विषय:',
    reviseNow: 'अभी दोहराएं',
    weeklyStreak: 'साप्ताहिक अध्ययन दिवस',
    activeDays: 'इस सप्ताह 5 दिन सक्रिय',
    days: ['सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'रवि'],

    parentViewTitle: 'अभिभावक और शिक्षक दृश्य',
    parentViewSubtitle: 'सरल, बिना किसी तकनीकी शब्दावली की प्रगति रिपोर्ट',
    parentPinPrompt: 'अभिभावक दृश्य के लिए 4 अंकों का पिन दर्ज करें',
    parentPinHint: 'डेमो पिन: 1234',
    thisWeekSummary: 'इस सप्ताह का सारांश',
    topicStatusList: 'अध्याय दक्षता स्थिति',
    statusGood: 'अच्छा (दक्ष)',
    statusPracticing: 'अभ्यासरत',
    statusNeedsHelp: 'अधिक ध्यान चाहिए',
    parentGuidance: 'अभिभावकों और स्वयंसेवकों के लिए सुझाव:',
    practiceTogether: 'घर पर साथ में अभ्यास हेतु गतिविधि:',
    listenToReport: 'रिपोर्ट सुनें (ऑडियो)',
    shareSummary: 'व्हाट्सएप / एसएमएस द्वारा भेजें',
    reportCopied: 'रिपोर्ट कॉपी हो गई! व्हाट्सएप पर भेज सकते हैं।',
    guardianZeroPii: 'सुरक्षित छात्र प्रोफ़ाइल',
    sessionCompleteSub: 'आपने इस सत्र में 5 प्रश्नों का अभ्यास किया',
    languageLabel: 'भाषा:',
    adminPortal: 'व्यवस्थापक और शिक्षक पोर्टल',
    chapterLabel: 'अध्याय:',
    autoFallbackBtn: '⚡ ऑटो फॉलबैक',
    manualOfflineBtn: '🔒 ऑफ़लाइन (0 डेटा)',
    lanternActiveBadge: '🏮 अध्याय लालटेन सक्रिय',
    photoDoubtPrompt: 'तस्वीर में दी गई समस्या को चरणबद्ध तरीके से समझाएं',
    photoUploadTitle: 'नोटबुक / बोर्ड की तस्वीर',
    voiceNotSupported: 'वॉइस पहचान उपलब्ध नहीं है। कृपया टाइप करें या विकल्प चुनें।',
    micDenied: 'माइक्रोफ़ोन की अनुमति अस्वीकृत है। कृपया बटन से चुनें।',
    networkRequiredVoice: 'वॉइस पहचान के लिए इंटरनेट आवश्यक है। कृपया बटन से चुनें।',
    voiceListening: 'सुन रहे हैं... बोलिए',
    voiceDisabledLowData: 'कम डेटा मोड में वॉइस अक्षम है',
    audioStop: 'रोकें',
    audioUnavailable: 'ऑडियो उपलब्ध नहीं है',
    signOut: 'साइन आउट',
    stopAudio: 'रोकें',
    completedSessions: 'पूर्ण सत्र',
    averageAccuracy: 'औसत सटीकता',
    unlockBtn: 'अनलॉक करें',
    strongTopicsLabel: 'मजबूत विषय',
    needsHelpTopicsLabel: 'अभ्यास की आवश्यकता',
    checkUpdates: 'अपडेट की जाँच करें',
    updateAvailable: 'नया अपडेट उपलब्ध है!',
    updateNow: 'अभी अपडेट करें',
    appUpToDate: 'नवीनतम वर्शन स्थापित है',
    checkingUpdates: 'जाँच हो रही है...',
    currentVersionLabel: 'वर्तमान वर्शन',
    latestVersionLabel: 'नवीनतम वर्शन',
    appUpdate: 'ऐप अपडेट',
    done: 'हो गया',
    changelog: 'क्या नया है',
    reloadApp: 'रीलोड करके अपडेट करें',
    updateCheckFailed: 'अपडेट जाँच विफल रही। कृपया इंटरनेट कनेक्शन जांचें।',
    welcomeGreeting: 'नमस्ते! अपना संदेह पूछें — बोलें या फोटो लें।',
    welcomeSpeakCard: '🎤 अपना संदेह बोलें',
    welcomePhotoCard: '📷 प्रश्न की फोटो लें',
    starterExplainChapter: 'इस अध्याय को सरल तरीके से समझाएं',
    starterDailyExample: 'दैनिक जीवन का उदाहरण दें',
    speakBtn: 'बोलें',
    listenReply: 'सुनें',
    listeningNow: 'सुन रहा हूँ... अब बोलें',
    stopListening: 'रोकें',
    replyChipSimpler: 'और सरल समझाएं',
    replyChipExample: 'दैनिक जीवन का उदाहरण दें',
    replyChipStepByStep: 'स्टेप-बाय-स्टेप समझाएं',
    tutorThinking: 'ट्यूटर सोच रहा है...',
    removePhoto: 'फोटो हटाएं',
    photoAttachedAlt: 'प्रश्न की फोटो',

    forgotPin: 'पिन भूल गए?',
    resetPinViaSafetyQuestion: 'सुरक्षा प्रश्न से पिन रीसेट करें',
    securityQuestionLabel: 'सुरक्षा प्रश्न',
    securityAnswerLabel: 'आपका उत्तर',
    enterSecurityAnswer: 'अपने सुरक्षा प्रश्न का उत्तर दें',
    securityAnswerPlaceholder: 'उदा: Maths या आपका उत्तर',
    verifyAnswer: 'उत्तर सत्यापित करें',
    incorrectSecurityAnswer: 'उत्तर मेल नहीं खा रहा है। कृपया पुनः प्रयास करें।',
    enterNewPin: 'नया 4-अंकीय पिन दर्ज करें',
    pinResetSuccess: 'पिन सफलतापूर्वक रीसेट हो गया! खोला जा रहा है...',
    backToPin: 'वापस पिन पर',
    noEmailOrOtpNeeded: 'ईमेल या ओटीपी की आवश्यकता नहीं (छात्र सुरक्षित मोड)',
  },
};

export function getTranslations(langOrPackId?: string): TranslationDictionary {
  if (!langOrPackId) return TRANSLATIONS.en;
  if (langOrPackId.startsWith('en') || langOrPackId.includes('-en')) return TRANSLATIONS.en;
  if (langOrPackId.startsWith('te') || langOrPackId.includes('-te')) return TRANSLATIONS.te;
  if (langOrPackId.startsWith('hi') || langOrPackId.includes('-hi')) return TRANSLATIONS.hi;
  return TRANSLATIONS.en;
}
