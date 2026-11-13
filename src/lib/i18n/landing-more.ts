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
    trial: {
      cta: "احجز حصة تجريبية مجانية",
      title: "احجز حصتك التجريبية المجانية",
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
    trial: {
      cta: "Book a free trial lesson",
      title: "Book your free trial lesson",
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
    trial: {
      cta: "Réserver un cours d'essai gratuit",
      title: "Réservez votre cours d'essai gratuit",
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
    trial: {
      cta: "Kostenlose Probestunde buchen",
      title: "Buchen Sie Ihre kostenlose Probestunde",
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
    trial: {
      cta: "Reserva una clase de prueba gratis",
      title: "Reserva tu clase de prueba gratis",
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
    trial: {
      cta: "Ücretsiz deneme dersi al",
      title: "Ücretsiz deneme dersinizi ayırtın",
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
    trial: {
      cta: "Записаться на бесплатный пробный урок",
      title: "Запишитесь на бесплатный пробный урок",
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
