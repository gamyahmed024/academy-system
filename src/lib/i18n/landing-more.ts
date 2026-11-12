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
    meanings: ["عبارة ترحيب", "ضمير المتكلم", "أدرس وأكتسب المعرفة", "ما يتكلم به الناس", "لغة العرب"],
    sentenceMeaning: "أول جملة تتعلمها معنا.",
    cultureTitle: "لغة حيّة وحضارة عريقة",
    cultureText: "مع كل حصة تقترب أكثر من لغة يتكلمها مئات الملايين، ومن خطّها وعمارتها وآدابها.",
    credits: "مصادر الصور",
  },
  en: {
    pathTitle: "Your path through Arabic",
    pathText: "A clear route, so you know where you start and where you are going.",
    path: [
      ["Placement", "A short session to find your level and your goal."],
      ["Letters and sounds", "Pronounce and write the letters, and read your first words."],
      ["Words and sentences", "Everyday vocabulary and sentences you build yourself."],
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
    cultureText: "Every lesson brings you closer to a language spoken by hundreds of millions, and to its calligraphy, architecture and literature.",
    credits: "Photo credits",
  },
  fr: {
    pathTitle: "Votre parcours en arabe",
    pathText: "Un chemin clair : vous savez d'où vous partez et où vous allez.",
    path: [
      ["Test de niveau", "Une courte séance pour connaître votre niveau et votre objectif."],
      ["Lettres et sons", "Prononcez et écrivez les lettres, puis lisez vos premiers mots."],
      ["Mots et phrases", "Le vocabulaire du quotidien et des phrases que vous construisez vous-même."],
      ["Conversation", "Parlez avec votre enseignant dans des situations réelles."],
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
    cultureText: "Chaque cours vous rapproche d'une langue parlée par des centaines de millions de personnes, de sa calligraphie, de son architecture et de sa littérature.",
    credits: "Crédits photo",
  },
  de: {
    pathTitle: "Ihr Weg durch das Arabische",
    pathText: "Ein klarer Weg: Sie wissen, wo Sie beginnen und wohin es geht.",
    path: [
      ["Einstufung", "Ein kurzes Gespräch, um Ihr Niveau und Ihr Ziel zu klären."],
      ["Buchstaben und Laute", "Sie sprechen und schreiben die Buchstaben und lesen Ihre ersten Wörter."],
      ["Wörter und Sätze", "Alltagswortschatz und Sätze, die Sie selbst bilden."],
      ["Konversation", "Sie sprechen mit Ihrer Lehrkraft in echten Situationen."],
      ["Lesen", "Sie lesen arabische Texte und verstehen sie ohne Übersetzung."],
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
    cultureText: "Jede Stunde bringt Sie einer Sprache näher, die Hunderte Millionen Menschen sprechen, und ihrer Kalligrafie, Architektur und Literatur.",
    credits: "Bildnachweise",
  },
  es: {
    pathTitle: "Tu camino en el árabe",
    pathText: "Una ruta clara: sabes dónde empiezas y adónde vas.",
    path: [
      ["Prueba de nivel", "Una sesión breve para conocer tu nivel y tu objetivo."],
      ["Letras y sonidos", "Pronuncias y escribes las letras, y lees tus primeras palabras."],
      ["Palabras y frases", "Vocabulario cotidiano y frases que construyes tú mismo."],
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
    cultureText: "Cada clase te acerca a una lengua que hablan cientos de millones de personas, y a su caligrafía, su arquitectura y su literatura.",
    credits: "Créditos de las fotos",
  },
  tr: {
    pathTitle: "Arapça yolculuğunuz",
    pathText: "Net bir yol: nereden başladığınızı ve nereye vardığınızı bilirsiniz.",
    path: [
      ["Seviye belirleme", "Seviyenizi ve hedefinizi öğrendiğimiz kısa bir görüşme."],
      ["Harfler ve sesler", "Harfleri söyler, yazar ve ilk kelimelerinizi okursunuz."],
      ["Kelimeler ve cümleler", "Günlük kelimeler ve kendi kurduğunuz cümleler."],
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
    cultureText: "Her ders sizi yüz milyonlarca insanın konuştuğu bir dile, onun hat sanatına, mimarisine ve edebiyatına biraz daha yaklaştırır.",
    credits: "Fotoğraf kaynakları",
  },
  ru: {
    pathTitle: "Ваш путь в арабском",
    pathText: "Понятный маршрут: вы знаете, с чего начинаете и куда идёте.",
    path: [
      ["Определение уровня", "Короткая встреча, чтобы узнать ваш уровень и цель."],
      ["Буквы и звуки", "Вы произносите и пишете буквы и читаете первые слова."],
      ["Слова и предложения", "Повседневная лексика и предложения, которые вы строите сами."],
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
    cultureText: "Каждый урок приближает вас к языку, на котором говорят сотни миллионов людей, к его каллиграфии, архитектуре и литературе.",
    credits: "Авторы фотографий",
  },
};
