/** Arabic (Egyptian) texts for the login page and the teacher / student / guardian pages. */
const ar = {
  dir: "rtl",
  dateLocale: "ar-EG-u-nu-latn",
  langName: "العربية",

  // login
  loginSubtitle: "سجّل دخولك علشان تكمل",
  email: "الإيميل",
  password: "كلمة السر",
  loginButton: "دخول",
  passwordChanged: "اتغيرت كلمة السر. ادخل بالجديدة.",
  wrongLogin: "الإيميل أو كلمة السر غلط",
  freeLesson: "حصة تجريبية مجانية",
  accountMessage: "أهلًا {name}! ده حسابك في {academy}، منه تشوف مواعيد حصصك وتدخل الحصة بضغطة. الرابط: {url} · الإيميل: {email} · كلمة السر: {password} . تقدر تغيّر كلمة السر بعد ما تدخل.",
  forgotLink: "نسيت كلمة السر؟",
  forgotTitle: "نسيت كلمة السر",
  forgotText: "اكتب الإيميل اللي بتدخل بيه، والأكاديمية هتبعتلك كلمة سر مؤقتة جديدة على الواتساب أو الإيميل في أقرب وقت.",
  forgotSend: "ابعت الطلب",
  forgotDone: "وصلنا طلبك. لو الإيميل ده عليه حساب عندنا، هنبعتلك كلمة سر جديدة قريب.",
  backToLogin: "رجوع لتسجيل الدخول",
  invalidEmail: "اكتب إيميل صحيح",

  // form + common
  save: "حفظ",
  pending: "لحظة…",
  saved: "اتحفظ",
  unexpected: "حصلت مشكلة غير متوقعة، جرّب تاني",
  joinLesson: "▶ ادخل الحصة",
  noLink: "مفيش رابط",
  home: "الرئيسية",
  language: "اللغة",

  // portal header
  roleTeacher: "مدرس",
  roleStudent: "طالب",
  roleGuardian: "ولي أمر",
  passwordLink: "كلمة السر",
  logout: "خروج",

  // password page
  changePasswordTitle: "تغيير كلمة السر",
  changePasswordSubtitle: "بعد التغيير هتدخل تاني بكلمة السر الجديدة",
  currentPassword: "كلمة السر الحالية",
  newPassword: "كلمة السر الجديدة (8 حروف على الأقل)",
  confirmPassword: "اكتبها تاني",
  changeButton: "غيّر",

  // shared
  hello: "أهلًا {name}",
  timesIn: "المواعيد بتوقيت {zone}",
  minutes: "{n} دقيقة",
  withTeacher: "مع {name}",
  moved: "اتنقلت",
  cancelled: "اتلغت",
  deducted: "اتخصمت",
  notDeducted: "متخصمتش",
  notLinked: "الحساب ده مش مربوط بحد في الأكاديمية. كلم الأكاديمية.",

  // student / guardian
  balanceOwn: "رصيدك (حصص)",
  balanceFamily: "رصيد العيلة (حصص)",
  nextTwoWeeks: "حصص الأسبوعين الجايين",
  children: "الأولاد",
  balanceNegative: "الرصيد بالسالب ({n}).",
  balanceLow: "الرصيد قرب يخلص.",
  renewHint: "كلم الأكاديمية علشان تجدد الباقة.",
  nextLesson: "الحصة الجاية",
  upcoming: "المواعيد الجاية",
  excusePolicy: "لو اعتذرت قبل الحصة بـ {h} ساعة أو أكتر، الحصة مش بتتخصم. بعد كده بتتخصم.",
  noUpcoming: "مفيش حصص في الأسبوعين الجايين.",
  excuse: "اعتذار",
  excuseConfirmFree: "تأكيد الاعتذار عن الحصة دي؟ مش هتتخصم من الرصيد.",
  excuseConfirmLate: "فاضل أقل من {h} ساعة على الحصة، فلو اعتذرت هتتخصم من الرصيد. تأكيد؟",
  excuseDoneFree: "اتسجل الاعتذار، والحصة مش هتتخصم",
  excuseDoneLate: "اتسجل الاعتذار. الاعتذار جه متأخر عن المهلة، فالحصة هتتخصم من الرصيد",
  recentLessons: "آخر الحصص",
  noRecent: "لسه مفيش حصص متسجلة.",
  payments: "المدفوعات",
  noPayments: "مفيش مدفوعات.",
  lessonsAdded: "+{n} حصة",

  // teacher
  todayLessons: "حصص النهارده",
  needRecording: "محتاجة تسجيل حضور",
  monthLessons: "حصص الشهر ده",
  monthPay: "مستحقات الشهر ده",
  noMeetingLink: "لسه ملكش رابط حصة ثابت. ابعت رابط Meet أو Zoom بتاعك للأكاديمية علشان يظهر لطلابك.",
  recordThese: "سجّل الحضور للحصص دي",
  record: "سجّل",
  weekLessons: "حصصك الأسبوع ده",
  noLessons: "مفيش حصص.",
  recorded: "اتسجل",
  yourPay: "مستحقاتك",
  payPerLesson: "أجر الحصة: {amount}",
  noClosedMonths: "لسه مفيش شهور اتقفلت.",
  month: "الشهر",
  lessons: "الحصص",
  amount: "المبلغ",
  paidOut: "الصرف",
  paidOn: "اتصرف {date}",
  notYet: "لسه",

  // teacher lesson page
  lessonCancelled: "الحصة دي اتلغت",
  notStarted: "الحصة لسه مبدأتش. قبلها تقدر تسجل بس إنك هتلغيها.",
  studentExcused: "الطالب اعتذر عن الحصة دي.",
  noteHomework: "ملاحظة / الواجب",

  // attendance states
  att_present: "حضر",
  att_late: "اتأخر",
  att_absent: "غاب من غير اعتذار",
  att_excused: "اعتذر",
  att_teacher_cancelled: "المدرس لغى",

  // install as an app (phone home screen)
  installApp: "ثبّت التطبيق",
  installTitle: "ثبّت التطبيق على موبايلك",
  installIos1: "افتح الموقع من متصفح Safari.",
  installIos2: "دوس على زر المشاركة (المربع اللي طالع منه سهم ⬆).",
  installIos3: "اختار «إضافة إلى الشاشة الرئيسية» وبعدين «إضافة».",
  installOther: "افتح قائمة المتصفح (⋮) واختار «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».",
  installOk: "تمام",
};

export default ar;
export type Dict = { [K in keyof typeof ar]: string };
