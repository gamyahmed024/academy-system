import type { Lang } from "./index";

/** Text of the richer welcome-page sections: learning path, word demo, culture band. */
export type LandingMore = {
  pathTitle: string;
  pathText: string;
  /** Five stations, from placement to reading. */
  path: [string, string][];
  tryTitle: string;
  tryText: string;
  tryHint: string;
  listen: string;
  rootLabel: string;
  close: string;
  /** Meanings of DEMO_WORDS, in the same order. */
  meanings: string[];
  sentenceMeaning: string;
  cultureTitle: string;
  cultureText: string;
  credits: string;
  /** The free-trial request form */
  trial: TrialText;
  /** {n} lessons, {m} minutes, {p} formatted price */
  pricing: {
    title: string;
    text: string;
    lessons: string;
    minutes: string;
    perMonth: string;
    perLesson: string;
    popular: string;
    choose: string;
  };
  faqTitle: string;
  /** {h} = hours of free cancellation */
  faq: [string, string][];
};

export type TrialText = {
  cta: string;
  title: string;
  text: string;
  name: string;
  email: string;
  whatsapp: string;
  whatsappHint: string;
  country: string;
  timezone: string;
  forWhom: string;
  forMe: string;
  forChild: string;
  level: string;
  levels: [string, string, string, string];
  times: string;
  timesHint: string;
  message: string;
  optional: string;
  send: string;
  sending: string;
  sent: string;
  problems: {
    name: string;
    email: string;
    whatsapp: string;
    choice: string;
    tooMany: string;
    other: string;
  };
};

/** The demo sentence, word by word: vowelled Arabic, Latin transliteration, root. */
export const DEMO_WORDS: { ar: string; tr: string; root?: string }[] = [
  { ar: "أَهْلًا وَسَهْلًا", tr: "ahlan wa-sahlan" },
  { ar: "أَنَا", tr: "anā" },
  { ar: "أَتَعَلَّمُ", tr: "ataʿallamu", root: "ع ل م" },
  { ar: "اللُّغَةَ", tr: "al-lughata", root: "ل غ و" },
  { ar: "العَرَبِيَّةَ", tr: "al-ʿarabiyyata", root: "ع ر ب" },
];

export const LANDING_MORE: Record<Lang, LandingMore> = {
  ar: {
    pathTitle: "رحلتك مع العربية",
    pathText: "مسار واضح تعرف فيه من أين تبدأ وإلى أين تصل.",
    path: [
      ["تحديد المستوى", "جلسة قصيرة نعرف بها مستواك وهدفك."],
      ["الحروف والأصوات", "تنطق الحروف وتكتبها وتقرأ كلماتك الأولى."],
      ["الكلمات والجمل", "مفردات الحياة اليومية وجمل تبنيها بنفسك."],
      ["المحادثة", "تتكلم مع مدرّسك في مواقف حقيقية."],
      ["القراءة والفهم", "تقرأ نصوصًا عربية وتفهمها دون ترجمة."],
    ],
    tryTitle: "جرّب الآن",
    tryText: "هكذا تبدو أول جملة ستقولها بالعربية.",
    tryHint: "اضغط على أي كلمة لترى نطقها ومعناها",
    listen: "استمع",
    rootLabel: "الجذر",
    close: "إغلاق",
    meanings: [
      "عبارة ترحيب",
      "ضمير المتكلم",
      "أدرس وأكتسب المعرفة",
      "ما يتكلم به الناس",
      "لغة العرب",
    ],
    sentenceMeaning: "أول جملة تتعلمها معنا.",
    cultureTitle: "لغة حيّة وحضارة عريقة",
    cultureText:
      "مع كل حصة تقترب أكثر من لغة يتكلمها مئات الملايين، ومن خطّها وعمارتها وآدابها.",
    credits: "مصادر الصور",
    pricing: {
      title: "الأسعار",
      text: "باقات شهرية واضحة، وأول حصة مجانية.",
      lessons: "{n} حصة في الشهر",
      minutes: "{m} دقيقة للحصة",
      perMonth: "شهريًا",
      perLesson: "{p} للحصة",
      popular: "الأكثر طلبًا",
      choose: "ابدأ بحصة مجانية",
    },
    faqTitle: "أسئلة شائعة",
    faq: [
      [
        "كيف تتم الحصص؟",
        "الحصص مباشرة أونلاين على Google Meet أو Zoom. من صفحتك الخاصة تضغط زرًا واحدًا فتدخل حصتك.",
      ],
      [
        "ماذا أحتاج لأبدأ؟",
        "كمبيوتر أو تابلت أو موبايل واتصال بالإنترنت، ويُفضَّل استخدام سماعات.",
      ],
      [
        "هل الحصة التجريبية مجانية فعلًا؟",
        "نعم، الحصة التجريبية مجانية ومدتها 30 دقيقة، وبلا أي التزام. نتعرف فيها على مستواك وهدفك ونقترح عليك الخطة المناسبة.",
      ],
      [
        "كيف تُحدَّد المواعيد؟",
        "تختار أيامًا وساعات ثابتة تناسبك، وتظهر لك دائمًا بتوقيت بلدك، ولا تتغير مع التوقيت الصيفي.",
      ],
      [
        "هل يمكنني الاعتذار عن حصة؟",
        "نعم. إذا اعتذرت قبل الحصة بـ {h} ساعة أو أكثر فلن تُخصم من رصيدك.",
      ],
      [
        "هل تُدرِّسون الأطفال؟",
        "نعم. وليّ الأمر يحصل على حساب واحد يتابع منه حصص أبنائه وحضورهم ورصيد العائلة.",
      ],
      [
        "كيف أدفع؟",
        "نتفق معك على طريقة الدفع المناسبة لك، ونقبل الدفع بأكثر من عملة.",
      ],
    ],
    trial: {
      cta: "احجز حصة تجريبية مجانية (30 دقيقة)",
      title: "احجز حصتك التجريبية المجانية (30 دقيقة)",
      text: "اترك بياناتك وسنتواصل معك خلال يوم عمل لنحدد موعد الحصة بتوقيت بلدك.",
      name: "الاسم",
      email: "البريد الإلكتروني",
      whatsapp: "رقم واتساب",
      whatsappHint: "مع كود الدولة، مثل ‎+49…",
      country: "البلد",
      timezone: "منطقتك الزمنية",
      forWhom: "الحصة لمن؟",
      forMe: "لي",
      forChild: "لابني أو ابنتي",
      level: "مستواك في العربية",
      levels: [
        "لا أعرف شيئًا بعد",
        "أعرف الحروف وبعض الكلمات",
        "أفهم وأتكلم قليلًا",
        "متقدم",
      ],
      times: "الأيام والأوقات المناسبة لك",
      timesHint: "مثلًا: السبت والأحد مساءً",
      message: "شيء تريد أن تخبرنا به؟",
      optional: "اختياري",
      send: "أرسل الطلب",
      sending: "جارٍ الإرسال…",
      sent: "وصلنا طلبك، شكرًا لك! سنتواصل معك قريبًا.",
      problems: {
        name: "اكتب اسمك من فضلك.",
        email: "اكتب بريدًا إلكترونيًا صحيحًا.",
        whatsapp: "اكتب رقم واتساب كاملًا مع كود الدولة، أو اتركه فارغًا.",
        choice: "اختر من القوائم من فضلك.",
        tooMany: "وصلتنا طلباتك بالفعل، سنتواصل معك قريبًا.",
        other: "حدثت مشكلة، حاول مرة أخرى.",
      },
    },
  },
  en: {
    pathTitle: "Your path through Arabic",
    pathText:
      "A clear route, so you know where you start and where you are going.",
    path: [
      ["Placement", "A short session to find your level and your goal."],
      [
        "Letters and sounds",
        "Pronounce and write the letters, and read your first words.",
      ],
      [
        "Words and sentences",
        "Everyday vocabulary and sentences you build yourself.",
      ],
      ["Conversation", "Speak with your teacher in real situations."],
      ["Reading", "Read Arabic texts and understand them without translating."],
    ],
    tryTitle: "Try it now",
    tryText: "This is what your first Arabic sentence looks like.",
    tryHint: "Tap any word to see how it sounds and what it means",
    listen: "Listen",
    rootLabel: "Root",
    close: "Close",
    meanings: ["Welcome", "I", "I am learning", "the language", "Arabic"],
    sentenceMeaning: "Welcome! I am learning the Arabic language.",
    cultureTitle: "A living language, a rich heritage",
    cultureText:
      "Every lesson brings you closer to a language spoken by hundreds of millions, and to its calligraphy, architecture and literature.",
    credits: "Photo credits",
    pricing: {
      title: "Prices",
      text: "Clear monthly packages, and your first lesson is free.",
      lessons: "{n} lessons a month",
      minutes: "{m} minutes per lesson",
      perMonth: "per month",
      perLesson: "{p} per lesson",
      popular: "Most popular",
      choose: "Start with a free lesson",
    },
    faqTitle: "Frequently asked questions",
    faq: [
      [
        "How do the lessons work?",
        "Lessons are live online on Google Meet or Zoom. From your personal page, one button takes you into your lesson.",
      ],
      [
        "What do I need to start?",
        "A computer, tablet or phone with an internet connection. Headphones help.",
      ],
      [
        "Is the trial lesson really free?",
        "Yes. The 30-minute trial lesson is free, with no commitment. We get to know your level and goal and suggest the right plan.",
      ],
      [
        "How are lesson times set?",
        "You choose fixed days and hours that suit you. They always show in your own time zone and don't shift when the clocks change.",
      ],
      [
        "Can I cancel a lesson?",
        "Yes. Cancel {h} hours or more before the lesson and it is not taken from your balance.",
      ],
      [
        "Do you teach children?",
        "Yes. A parent gets one account to follow their children's lessons, attendance and the family balance.",
      ],
      [
        "How do I pay?",
        "We agree with you on a payment method that suits you, and we accept several currencies.",
      ],
    ],
    trial: {
      cta: "Book a free 30-minute trial lesson",
      title: "Book your free 30-minute trial lesson",
      text: "Leave your details and we will get back to you within one working day to set a time in your time zone.",
      name: "Name",
      email: "Email",
      whatsapp: "WhatsApp number",
      whatsappHint: "With country code, e.g. +49…",
      country: "Country",
      timezone: "Your time zone",
      forWhom: "Who is the lesson for?",
      forMe: "Me",
      forChild: "My child",
      level: "Your Arabic level",
      levels: [
        "I don't know any yet",
        "I know the letters and some words",
        "I understand and speak a little",
        "Advanced",
      ],
      times: "Days and times that suit you",
      timesHint: "e.g. Saturday and Sunday evenings",
      message: "Anything you'd like to tell us?",
      optional: "optional",
      send: "Send request",
      sending: "Sending…",
      sent: "Thank you, we have your request! We will be in touch soon.",
      problems: {
        name: "Please write your name.",
        email: "Please write a valid email address.",
        whatsapp:
          "Write the full WhatsApp number with country code, or leave it empty.",
        choice: "Please choose from the lists.",
        tooMany: "We already have your requests. We will be in touch soon.",
        other: "Something went wrong. Please try again.",
      },
    },
  },
  fr: {
    pathTitle: "Votre parcours en arabe",
    pathText: "Un chemin clair : vous savez d'où vous partez et où vous allez.",
    path: [
      [
        "Test de niveau",
        "Une courte séance pour connaître votre niveau et votre objectif.",
      ],
      [
        "Lettres et sons",
        "Prononcez et écrivez les lettres, puis lisez vos premiers mots.",
      ],
      [
        "Mots et phrases",
        "Le vocabulaire du quotidien et des phrases que vous construisez vous-même.",
      ],
      [
        "Conversation",
        "Parlez avec votre enseignant dans des situations réelles.",
      ],
      ["Lecture", "Lisez des textes arabes et comprenez-les sans traduire."],
    ],
    tryTitle: "Essayez maintenant",
    tryText: "Voici à quoi ressemble votre première phrase en arabe.",
    tryHint: "Touchez un mot pour voir sa prononciation et son sens",
    listen: "Écouter",
    rootLabel: "Racine",
    close: "Fermer",
    meanings: ["Bienvenue", "je", "j'apprends", "la langue", "arabe"],
    sentenceMeaning: "Bienvenue ! J'apprends la langue arabe.",
    cultureTitle: "Une langue vivante, un riche héritage",
    cultureText:
      "Chaque cours vous rapproche d'une langue parlée par des centaines de millions de personnes, de sa calligraphie, de son architecture et de sa littérature.",
    credits: "Crédits photo",
    pricing: {
      title: "Tarifs",
      text: "Des forfaits mensuels clairs, et votre premier cours est gratuit.",
      lessons: "{n} cours par mois",
      minutes: "{m} minutes par cours",
      perMonth: "par mois",
      perLesson: "{p} par cours",
      popular: "Le plus choisi",
      choose: "Commencer par un cours gratuit",
    },
    faqTitle: "Questions fréquentes",
    faq: [
      [
        "Comment se passent les cours ?",
        "Les cours ont lieu en direct en ligne sur Google Meet ou Zoom. Depuis votre page personnelle, un seul bouton vous fait entrer dans le cours.",
      ],
      [
        "De quoi ai-je besoin pour commencer ?",
        "Un ordinateur, une tablette ou un téléphone avec une connexion internet. Un casque est conseillé.",
      ],
      [
        "Le cours d'essai est-il vraiment gratuit ?",
        "Oui. Le cours d'essai de 30 minutes est gratuit et sans engagement. Nous découvrons votre niveau et votre objectif et vous proposons le bon programme.",
      ],
      [
        "Comment les horaires sont-ils fixés ?",
        "Vous choisissez des jours et des heures fixes qui vous conviennent. Ils s'affichent toujours dans votre fuseau horaire et ne bougent pas au changement d'heure.",
      ],
      [
        "Puis-je annuler un cours ?",
        "Oui. Annulez {h} heures ou plus avant le cours et il n'est pas déduit de votre solde.",
      ],
      [
        "Enseignez-vous aux enfants ?",
        "Oui. Un parent dispose d'un compte unique pour suivre les cours de ses enfants, leur présence et le solde de la famille.",
      ],
      [
        "Comment payer ?",
        "Nous convenons avec vous d'un moyen de paiement qui vous convient, et nous acceptons plusieurs devises.",
      ],
    ],
    trial: {
      cta: "Réserver un cours d'essai gratuit (30 min)",
      title: "Réservez votre cours d'essai gratuit de 30 minutes",
      text: "Laissez vos coordonnées et nous vous répondrons sous un jour ouvré pour fixer un horaire dans votre fuseau horaire.",
      name: "Nom",
      email: "E-mail",
      whatsapp: "Numéro WhatsApp",
      whatsappHint: "Avec l'indicatif du pays, ex. +33…",
      country: "Pays",
      timezone: "Votre fuseau horaire",
      forWhom: "Pour qui est le cours ?",
      forMe: "Pour moi",
      forChild: "Pour mon enfant",
      level: "Votre niveau en arabe",
      levels: [
        "Je ne connais rien encore",
        "Je connais les lettres et quelques mots",
        "Je comprends et parle un peu",
        "Avancé",
      ],
      times: "Jours et horaires qui vous conviennent",
      timesHint: "ex. samedi et dimanche en soirée",
      message: "Quelque chose à nous dire ?",
      optional: "facultatif",
      send: "Envoyer la demande",
      sending: "Envoi…",
      sent: "Merci, nous avons bien reçu votre demande ! Nous vous contacterons bientôt.",
      problems: {
        name: "Veuillez indiquer votre nom.",
        email: "Veuillez indiquer une adresse e-mail valide.",
        whatsapp:
          "Indiquez le numéro WhatsApp complet avec l'indicatif, ou laissez vide.",
        choice: "Veuillez choisir dans les listes.",
        tooMany:
          "Nous avons déjà vos demandes. Nous vous contacterons bientôt.",
        other: "Une erreur est survenue. Veuillez réessayer.",
      },
    },
  },
  de: {
    pathTitle: "Ihr Weg durch das Arabische",
    pathText: "Ein klarer Weg: Sie wissen, wo Sie beginnen und wohin es geht.",
    path: [
      [
        "Einstufung",
        "Ein kurzes Gespräch, um Ihr Niveau und Ihr Ziel zu klären.",
      ],
      [
        "Buchstaben und Laute",
        "Sie sprechen und schreiben die Buchstaben und lesen Ihre ersten Wörter.",
      ],
      [
        "Wörter und Sätze",
        "Alltagswortschatz und Sätze, die Sie selbst bilden.",
      ],
      [
        "Konversation",
        "Sie sprechen mit Ihrer Lehrkraft in echten Situationen.",
      ],
      [
        "Lesen",
        "Sie lesen arabische Texte und verstehen sie ohne Übersetzung.",
      ],
    ],
    tryTitle: "Jetzt ausprobieren",
    tryText: "So sieht Ihr erster arabischer Satz aus.",
    tryHint: "Tippen Sie auf ein Wort, um Aussprache und Bedeutung zu sehen",
    listen: "Anhören",
    rootLabel: "Wurzel",
    close: "Schließen",
    meanings: ["Willkommen", "ich", "ich lerne", "die Sprache", "arabisch"],
    sentenceMeaning: "Willkommen! Ich lerne die arabische Sprache.",
    cultureTitle: "Eine lebendige Sprache, ein reiches Erbe",
    cultureText:
      "Jede Stunde bringt Sie einer Sprache näher, die Hunderte Millionen Menschen sprechen, und ihrer Kalligrafie, Architektur und Literatur.",
    credits: "Bildnachweise",
    pricing: {
      title: "Preise",
      text: "Klare Monatspakete, und Ihre erste Stunde ist kostenlos.",
      lessons: "{n} Stunden im Monat",
      minutes: "{m} Minuten pro Stunde",
      perMonth: "pro Monat",
      perLesson: "{p} pro Stunde",
      popular: "Am beliebtesten",
      choose: "Mit einer kostenlosen Stunde beginnen",
    },
    faqTitle: "Häufige Fragen",
    faq: [
      [
        "Wie laufen die Stunden ab?",
        "Die Stunden finden live online über Google Meet oder Zoom statt. Auf Ihrer persönlichen Seite bringt Sie ein Knopf direkt in die Stunde.",
      ],
      [
        "Was brauche ich zum Start?",
        "Einen Computer, ein Tablet oder ein Handy mit Internetverbindung. Kopfhörer sind hilfreich.",
      ],
      [
        "Ist die Probestunde wirklich kostenlos?",
        "Ja. Die 30-minütige Probestunde ist kostenlos und unverbindlich. Wir lernen Ihr Niveau und Ihr Ziel kennen und schlagen den passenden Plan vor.",
      ],
      [
        "Wie werden die Termine festgelegt?",
        "Sie wählen feste Tage und Uhrzeiten, die Ihnen passen. Sie werden immer in Ihrer Zeitzone angezeigt und verschieben sich nicht bei der Zeitumstellung.",
      ],
      [
        "Kann ich eine Stunde absagen?",
        "Ja. Wenn Sie {h} Stunden oder mehr vorher absagen, wird sie nicht von Ihrem Guthaben abgezogen.",
      ],
      [
        "Unterrichten Sie auch Kinder?",
        "Ja. Ein Elternteil bekommt ein Konto, über das es die Stunden, die Anwesenheit und das Familienguthaben aller Kinder verfolgt.",
      ],
      [
        "Wie bezahle ich?",
        "Wir vereinbaren mit Ihnen eine Zahlungsart, die Ihnen passt, und akzeptieren mehrere Währungen.",
      ],
    ],
    trial: {
      cta: "Kostenlose Probestunde (30 Min.) buchen",
      title: "Buchen Sie Ihre kostenlose 30-minütige Probestunde",
      text: "Hinterlassen Sie Ihre Angaben, und wir melden uns innerhalb eines Werktags, um einen Termin in Ihrer Zeitzone zu finden.",
      name: "Name",
      email: "E-Mail",
      whatsapp: "WhatsApp-Nummer",
      whatsappHint: "Mit Ländervorwahl, z. B. +49…",
      country: "Land",
      timezone: "Ihre Zeitzone",
      forWhom: "Für wen ist die Stunde?",
      forMe: "Für mich",
      forChild: "Für mein Kind",
      level: "Ihr Arabischniveau",
      levels: [
        "Ich kann noch gar nichts",
        "Ich kenne die Buchstaben und ein paar Wörter",
        "Ich verstehe und spreche ein wenig",
        "Fortgeschritten",
      ],
      times: "Passende Tage und Uhrzeiten",
      timesHint: "z. B. Samstag und Sonntag abends",
      message: "Möchten Sie uns noch etwas sagen?",
      optional: "optional",
      send: "Anfrage senden",
      sending: "Wird gesendet…",
      sent: "Danke, Ihre Anfrage ist angekommen! Wir melden uns bald.",
      problems: {
        name: "Bitte geben Sie Ihren Namen an.",
        email: "Bitte geben Sie eine gültige E-Mail-Adresse an.",
        whatsapp:
          "Geben Sie die vollständige WhatsApp-Nummer mit Vorwahl an oder lassen Sie das Feld leer.",
        choice: "Bitte wählen Sie aus den Listen.",
        tooMany: "Ihre Anfragen sind schon bei uns. Wir melden uns bald.",
        other: "Etwas ist schiefgelaufen. Bitte versuchen Sie es noch einmal.",
      },
    },
  },
  es: {
    pathTitle: "Tu camino en el árabe",
    pathText: "Una ruta clara: sabes dónde empiezas y adónde vas.",
    path: [
      [
        "Prueba de nivel",
        "Una sesión breve para conocer tu nivel y tu objetivo.",
      ],
      [
        "Letras y sonidos",
        "Pronuncias y escribes las letras, y lees tus primeras palabras.",
      ],
      [
        "Palabras y frases",
        "Vocabulario cotidiano y frases que construyes tú mismo.",
      ],
      ["Conversación", "Hablas con tu profesor en situaciones reales."],
      ["Lectura", "Lees textos árabes y los entiendes sin traducir."],
    ],
    tryTitle: "Pruébalo ahora",
    tryText: "Así es tu primera frase en árabe.",
    tryHint: "Toca cualquier palabra para ver cómo suena y qué significa",
    listen: "Escuchar",
    rootLabel: "Raíz",
    close: "Cerrar",
    meanings: ["Bienvenido", "yo", "estoy aprendiendo", "la lengua", "árabe"],
    sentenceMeaning: "¡Bienvenido! Estoy aprendiendo la lengua árabe.",
    cultureTitle: "Una lengua viva, una herencia rica",
    cultureText:
      "Cada clase te acerca a una lengua que hablan cientos de millones de personas, y a su caligrafía, su arquitectura y su literatura.",
    credits: "Créditos de las fotos",
    pricing: {
      title: "Precios",
      text: "Paquetes mensuales claros, y tu primera clase es gratis.",
      lessons: "{n} clases al mes",
      minutes: "{m} minutos por clase",
      perMonth: "al mes",
      perLesson: "{p} por clase",
      popular: "El más elegido",
      choose: "Empieza con una clase gratis",
    },
    faqTitle: "Preguntas frecuentes",
    faq: [
      [
        "¿Cómo son las clases?",
        "Las clases son en directo por internet en Google Meet o Zoom. Desde tu página personal, un solo botón te lleva a tu clase.",
      ],
      [
        "¿Qué necesito para empezar?",
        "Un ordenador, una tableta o un móvil con conexión a internet. Los auriculares ayudan.",
      ],
      [
        "¿La clase de prueba es de verdad gratis?",
        "Sí. La clase de prueba de 30 minutos es gratis y sin compromiso. Conocemos tu nivel y tu objetivo y te proponemos el plan adecuado.",
      ],
      [
        "¿Cómo se fijan los horarios?",
        "Eliges días y horas fijos que te vengan bien. Siempre se muestran en tu zona horaria y no cambian con el cambio de hora.",
      ],
      [
        "¿Puedo cancelar una clase?",
        "Sí. Si cancelas {h} horas o más antes de la clase, no se descuenta de tu saldo.",
      ],
      [
        "¿Dan clases a niños?",
        "Sí. El padre o la madre tiene una sola cuenta para seguir las clases de sus hijos, su asistencia y el saldo familiar.",
      ],
      [
        "¿Cómo pago?",
        "Acordamos contigo un método de pago que te convenga, y aceptamos varias monedas.",
      ],
    ],
    trial: {
      cta: "Reserva una clase de prueba gratis (30 min)",
      title: "Reserva tu clase de prueba gratis de 30 minutos",
      text: "Déjanos tus datos y te responderemos en un día hábil para fijar una hora en tu zona horaria.",
      name: "Nombre",
      email: "Correo electrónico",
      whatsapp: "Número de WhatsApp",
      whatsappHint: "Con el prefijo del país, p. ej. +34…",
      country: "País",
      timezone: "Tu zona horaria",
      forWhom: "¿Para quién es la clase?",
      forMe: "Para mí",
      forChild: "Para mi hijo o hija",
      level: "Tu nivel de árabe",
      levels: [
        "Todavía no sé nada",
        "Conozco las letras y algunas palabras",
        "Entiendo y hablo un poco",
        "Avanzado",
      ],
      times: "Días y horas que te vienen bien",
      timesHint: "p. ej. sábado y domingo por la tarde",
      message: "¿Algo que quieras contarnos?",
      optional: "opcional",
      send: "Enviar solicitud",
      sending: "Enviando…",
      sent: "¡Gracias, hemos recibido tu solicitud! Te contactaremos pronto.",
      problems: {
        name: "Escribe tu nombre, por favor.",
        email: "Escribe un correo electrónico válido.",
        whatsapp:
          "Escribe el número de WhatsApp completo con prefijo, o déjalo vacío.",
        choice: "Elige de las listas, por favor.",
        tooMany: "Ya tenemos tus solicitudes. Te contactaremos pronto.",
        other: "Algo salió mal. Inténtalo de nuevo.",
      },
    },
  },
  tr: {
    pathTitle: "Arapça yolculuğunuz",
    pathText:
      "Net bir yol: nereden başladığınızı ve nereye vardığınızı bilirsiniz.",
    path: [
      [
        "Seviye belirleme",
        "Seviyenizi ve hedefinizi öğrendiğimiz kısa bir görüşme.",
      ],
      [
        "Harfler ve sesler",
        "Harfleri söyler, yazar ve ilk kelimelerinizi okursunuz.",
      ],
      [
        "Kelimeler ve cümleler",
        "Günlük kelimeler ve kendi kurduğunuz cümleler.",
      ],
      ["Konuşma", "Öğretmeninizle gerçek durumlarda konuşursunuz."],
      ["Okuma", "Arapça metinleri çeviriye gerek kalmadan okur ve anlarsınız."],
    ],
    tryTitle: "Şimdi deneyin",
    tryText: "İlk Arapça cümleniz böyle görünüyor.",
    tryHint: "Okunuşunu ve anlamını görmek için bir kelimeye dokunun",
    listen: "Dinle",
    rootLabel: "Kök",
    close: "Kapat",
    meanings: ["Hoş geldiniz", "ben", "öğreniyorum", "dili", "Arap"],
    sentenceMeaning: "Hoş geldiniz! Arap dilini öğreniyorum.",
    cultureTitle: "Yaşayan bir dil, köklü bir miras",
    cultureText:
      "Her ders sizi yüz milyonlarca insanın konuştuğu bir dile, onun hat sanatına, mimarisine ve edebiyatına biraz daha yaklaştırır.",
    credits: "Fotoğraf kaynakları",
    pricing: {
      title: "Fiyatlar",
      text: "Net aylık paketler; ilk dersiniz ücretsiz.",
      lessons: "Ayda {n} ders",
      minutes: "Ders başına {m} dakika",
      perMonth: "aylık",
      perLesson: "Ders başına {p}",
      popular: "En çok tercih edilen",
      choose: "Ücretsiz bir dersle başlayın",
    },
    faqTitle: "Sık sorulan sorular",
    faq: [
      [
        "Dersler nasıl yapılıyor?",
        "Dersler Google Meet veya Zoom üzerinden canlı ve çevrim içi yapılır. Kişisel sayfanızdaki tek bir düğmeyle derse girersiniz.",
      ],
      [
        "Başlamak için neye ihtiyacım var?",
        "İnternet bağlantılı bir bilgisayar, tablet veya telefon. Kulaklık kullanmanız önerilir.",
      ],
      [
        "Deneme dersi gerçekten ücretsiz mi?",
        "Evet. 30 dakikalık deneme dersi ücretsiz ve hiçbir yükümlülük yok. Seviyenizi ve hedefinizi öğrenip size uygun planı öneririz.",
      ],
      [
        "Ders saatleri nasıl belirleniyor?",
        "Size uyan sabit gün ve saatleri seçersiniz. Saatler her zaman kendi saat diliminizde görünür ve saat değişikliğinde kaymaz.",
      ],
      [
        "Bir dersi iptal edebilir miyim?",
        "Evet. Dersten {h} saat veya daha önce iptal ederseniz bakiyenizden düşülmez.",
      ],
      [
        "Çocuklara da ders veriyor musunuz?",
        "Evet. Veli, tek bir hesaptan çocuklarının derslerini, devamını ve aile bakiyesini takip eder.",
      ],
      [
        "Nasıl ödeme yaparım?",
        "Size uygun ödeme yöntemini sizinle birlikte belirleriz; birden fazla para birimiyle ödeme kabul ediyoruz.",
      ],
    ],
    trial: {
      cta: "Ücretsiz deneme dersi al (30 dk)",
      title: "30 dakikalık ücretsiz deneme dersinizi ayırtın",
      text: "Bilgilerinizi bırakın, saat diliminize uygun bir zaman belirlemek için bir iş günü içinde size dönelim.",
      name: "Ad soyad",
      email: "E-posta",
      whatsapp: "WhatsApp numarası",
      whatsappHint: "Ülke koduyla, örn. +90…",
      country: "Ülke",
      timezone: "Saat diliminiz",
      forWhom: "Ders kimin için?",
      forMe: "Benim için",
      forChild: "Çocuğum için",
      level: "Arapça seviyeniz",
      levels: [
        "Henüz hiç bilmiyorum",
        "Harfleri ve birkaç kelimeyi biliyorum",
        "Biraz anlıyor ve konuşuyorum",
        "İleri",
      ],
      times: "Size uygun gün ve saatler",
      timesHint: "örn. cumartesi ve pazar akşamları",
      message: "Bize söylemek istediğiniz bir şey var mı?",
      optional: "isteğe bağlı",
      send: "Talebi gönder",
      sending: "Gönderiliyor…",
      sent: "Teşekkürler, talebiniz bize ulaştı! Yakında sizinle iletişime geçeceğiz.",
      problems: {
        name: "Lütfen adınızı yazın.",
        email: "Lütfen geçerli bir e-posta adresi yazın.",
        whatsapp:
          "WhatsApp numarasını ülke koduyla tam yazın veya boş bırakın.",
        choice: "Lütfen listelerden seçin.",
        tooMany: "Talepleriniz zaten bize ulaştı. Yakında size döneceğiz.",
        other: "Bir sorun oluştu. Lütfen tekrar deneyin.",
      },
    },
  },
  ru: {
    pathTitle: "Ваш путь в арабском",
    pathText: "Понятный маршрут: вы знаете, с чего начинаете и куда идёте.",
    path: [
      [
        "Определение уровня",
        "Короткая встреча, чтобы узнать ваш уровень и цель.",
      ],
      [
        "Буквы и звуки",
        "Вы произносите и пишете буквы и читаете первые слова.",
      ],
      [
        "Слова и предложения",
        "Повседневная лексика и предложения, которые вы строите сами.",
      ],
      ["Разговор", "Вы говорите с преподавателем в реальных ситуациях."],
      ["Чтение", "Вы читаете арабские тексты и понимаете их без перевода."],
    ],
    tryTitle: "Попробуйте сейчас",
    tryText: "Так выглядит ваше первое предложение на арабском.",
    tryHint: "Нажмите на любое слово, чтобы увидеть произношение и значение",
    listen: "Слушать",
    rootLabel: "Корень",
    close: "Закрыть",
    meanings: ["Добро пожаловать", "я", "я изучаю", "язык", "арабский"],
    sentenceMeaning: "Добро пожаловать! Я изучаю арабский язык.",
    cultureTitle: "Живой язык, богатое наследие",
    cultureText:
      "Каждый урок приближает вас к языку, на котором говорят сотни миллионов людей, к его каллиграфии, архитектуре и литературе.",
    credits: "Авторы фотографий",
    pricing: {
      title: "Цены",
      text: "Понятные месячные пакеты, а первый урок бесплатный.",
      lessons: "{n} уроков в месяц",
      minutes: "{m} минут на урок",
      perMonth: "в месяц",
      perLesson: "{p} за урок",
      popular: "Самый популярный",
      choose: "Начать с бесплатного урока",
    },
    faqTitle: "Частые вопросы",
    faq: [
      [
        "Как проходят уроки?",
        "Уроки идут вживую онлайн в Google Meet или Zoom. На вашей личной странице одна кнопка открывает урок.",
      ],
      [
        "Что нужно, чтобы начать?",
        "Компьютер, планшет или телефон с интернетом. Наушники не помешают.",
      ],
      [
        "Пробный урок правда бесплатный?",
        "Да. Пробный урок длится 30 минут, он бесплатный и ни к чему не обязывает. Мы узнаём ваш уровень и цель и предлагаем подходящий план.",
      ],
      [
        "Как назначается время уроков?",
        "Вы выбираете постоянные дни и часы, которые вам удобны. Время всегда показывается в вашем часовом поясе и не сдвигается при переходе на летнее время.",
      ],
      [
        "Можно ли отменить урок?",
        "Да. Если отменить урок за {h} часов или раньше, он не списывается с баланса.",
      ],
      [
        "Вы занимаетесь с детьми?",
        "Да. У родителя один аккаунт, где видны уроки, посещаемость детей и баланс семьи.",
      ],
      [
        "Как оплатить?",
        "Мы договоримся с вами об удобном способе оплаты и принимаем оплату в нескольких валютах.",
      ],
    ],
    trial: {
      cta: "Записаться на бесплатный пробный урок (30 мин)",
      title: "Запишитесь на бесплатный 30-минутный пробный урок",
      text: "Оставьте свои данные, и мы свяжемся с вами в течение рабочего дня, чтобы выбрать время в вашем часовом поясе.",
      name: "Имя",
      email: "Эл. почта",
      whatsapp: "Номер WhatsApp",
      whatsappHint: "С кодом страны, например +7…",
      country: "Страна",
      timezone: "Ваш часовой пояс",
      forWhom: "Для кого урок?",
      forMe: "Для меня",
      forChild: "Для моего ребёнка",
      level: "Ваш уровень арабского",
      levels: [
        "Пока ничего не знаю",
        "Знаю буквы и несколько слов",
        "Немного понимаю и говорю",
        "Продвинутый",
      ],
      times: "Удобные дни и время",
      timesHint: "например, суббота и воскресенье вечером",
      message: "Хотите что-нибудь добавить?",
      optional: "необязательно",
      send: "Отправить заявку",
      sending: "Отправляем…",
      sent: "Спасибо, ваша заявка получена! Скоро мы с вами свяжемся.",
      problems: {
        name: "Пожалуйста, напишите ваше имя.",
        email: "Пожалуйста, укажите правильный адрес почты.",
        whatsapp:
          "Укажите полный номер WhatsApp с кодом страны или оставьте поле пустым.",
        choice: "Пожалуйста, выберите из списков.",
        tooMany: "Ваши заявки уже у нас. Скоро мы с вами свяжемся.",
        other: "Что-то пошло не так. Попробуйте ещё раз.",
      },
    },
  },
};
