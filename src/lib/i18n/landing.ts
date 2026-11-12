import type { Lang } from "./index";

/** Text of the public welcome page (shown before sign-in). */
export type Landing = {
  metaDesc: string;
  signIn: string;
  heroTag: string;
  heroTitle: string;
  heroText: string;
  contact: string;
  programsTitle: string;
  programs: [string, string][];
  stepsTitle: string;
  steps: [string, string][];
  whyTitle: string;
  /** {h} = hours of free cancellation */
  why: [string, string][];
  ctaTitle: string;
  ctaText: string;
  rights: string;
};

export const LANDING: Record<Lang, Landing> = {
  ar: {
    metaDesc: "تعلّم العربية أونلاين مع مدرسين متخصصين، في مواعيد بتوقيت بلدك.",
    signIn: "تسجيل الدخول",
    heroTag: "العربية لغير الناطقين بها",
    heroTitle: "تعلّم العربية أونلاين، من أي مكان في العالم",
    heroText: "حصص مباشرة مع مدرسين متخصصين، في مواعيد تناسبك وبتوقيت بلدك.",
    contact: "تواصل معنا على واتساب",
    programsTitle: "ماذا نقدّم؟",
    programs: [
      ["العربية من البداية", "من الحروف والنطق حتى القراءة والكتابة بثقة، خطوة بخطوة."],
      ["المحادثة", "تدرّب على الكلام في مواقف الحياة اليومية مع مدرّسك مباشرة."],
      ["النحو والقراءة", "افهم قواعد اللغة ببساطة واقرأ النصوص العربية بنفسك."],
    ],
    stepsTitle: "كيف تبدأ؟",
    steps: [
      ["تواصل معنا", "أخبرنا بمستواك وهدفك من تعلّم العربية."],
      ["نحدّد مواعيدك", "نختار معك أيامًا وساعات ثابتة بتوقيت بلدك."],
      ["ابدأ التعلّم", "ادخل حصتك بضغطة واحدة من صفحتك الخاصة."],
    ],
    whyTitle: "لماذا تتعلّم معنا؟",
    why: [
      ["مواعيد بتوقيتك", "كل المواعيد تظهر بتوقيت بلدك، وتبقى ثابتة حتى مع التوقيت الصيفي."],
      ["صفحة خاصة بك", "حصصك القادمة ورصيدك وملاحظات مدرّسك وواجباتك في مكان واحد."],
      ["دخول الحصة بضغطة", "زر واحد يفتح لك حصتك المباشرة، بلا روابط تبحث عنها."],
      ["اعتذار مرن", "إذا اعتذرت قبل الحصة بـ {h} ساعة أو أكثر فلن تُخصم من رصيدك."],
      ["متابعة لأولياء الأمور", "وليّ الأمر يتابع حصص أبنائه وحضورهم ورصيد العائلة من حساب واحد."],
      ["بلغتك", "صفحتك متاحة بالعربية والإنجليزية والفرنسية والألمانية والإسبانية والتركية والروسية."],
    ],
    ctaTitle: "جاهز تبدأ؟",
    ctaText: "تواصل معنا اليوم ونرتّب لك أول حصة.",
    rights: "جميع الحقوق محفوظة",
  },
  en: {
    metaDesc: "Learn Arabic online with specialised teachers, at times that fit your time zone.",
    signIn: "Sign in",
    heroTag: "Arabic for non-native speakers",
    heroTitle: "Learn Arabic online, from anywhere in the world",
    heroText: "Live lessons with specialised teachers, at times that suit you and in your own time zone.",
    contact: "Contact us on WhatsApp",
    programsTitle: "What we offer",
    programs: [
      ["Arabic from the start", "From letters and pronunciation to reading and writing with confidence, step by step."],
      ["Conversation", "Practise speaking in everyday situations, live with your teacher."],
      ["Grammar and reading", "Understand how the language works and read Arabic texts on your own."],
    ],
    stepsTitle: "How to start",
    steps: [
      ["Get in touch", "Tell us your level and why you want to learn Arabic."],
      ["We set your schedule", "Together we choose fixed days and hours in your time zone."],
      ["Start learning", "Join your lesson with one tap from your personal page."],
    ],
    whyTitle: "Why learn with us?",
    why: [
      ["Times in your time zone", "Every lesson time is shown in your local time and stays the same through daylight saving changes."],
      ["Your own page", "Upcoming lessons, your balance, your teacher's notes and homework in one place."],
      ["Join in one tap", "One button opens your live lesson. No links to search for."],
      ["Flexible cancellation", "Cancel {h} hours or more before a lesson and it is not taken from your balance."],
      ["Parents stay informed", "A parent follows their children's lessons, attendance and the family balance from one account."],
      ["In your language", "Your page is available in Arabic, English, French, German, Spanish, Turkish and Russian."],
    ],
    ctaTitle: "Ready to start?",
    ctaText: "Contact us today and we will arrange your first lesson.",
    rights: "All rights reserved",
  },
  fr: {
    metaDesc: "Apprenez l'arabe en ligne avec des enseignants spécialisés, à des horaires adaptés à votre fuseau horaire.",
    signIn: "Se connecter",
    heroTag: "L'arabe pour les non-arabophones",
    heroTitle: "Apprenez l'arabe en ligne, où que vous soyez",
    heroText: "Des cours en direct avec des enseignants spécialisés, aux horaires qui vous conviennent et dans votre fuseau horaire.",
    contact: "Contactez-nous sur WhatsApp",
    programsTitle: "Ce que nous proposons",
    programs: [
      ["L'arabe dès le début", "Des lettres et de la prononciation jusqu'à la lecture et l'écriture en confiance, pas à pas."],
      ["Conversation", "Entraînez-vous à parler dans des situations du quotidien, en direct avec votre enseignant."],
      ["Grammaire et lecture", "Comprenez le fonctionnement de la langue et lisez des textes arabes par vous-même."],
    ],
    stepsTitle: "Comment commencer",
    steps: [
      ["Contactez-nous", "Indiquez-nous votre niveau et votre objectif."],
      ["Nous fixons vos horaires", "Nous choisissons ensemble des jours et heures fixes dans votre fuseau horaire."],
      ["Commencez à apprendre", "Rejoignez votre cours d'un seul geste depuis votre page personnelle."],
    ],
    whyTitle: "Pourquoi apprendre avec nous ?",
    why: [
      ["Des horaires à votre heure", "Chaque cours est affiché à votre heure locale et ne bouge pas au changement d'heure."],
      ["Votre page personnelle", "Vos prochains cours, votre solde, les notes de votre enseignant et vos devoirs au même endroit."],
      ["Rejoindre en un geste", "Un seul bouton ouvre votre cours en direct. Aucun lien à chercher."],
      ["Annulation flexible", "Annulez {h} heures ou plus avant un cours et il n'est pas déduit de votre solde."],
      ["Les parents restent informés", "Un parent suit les cours, la présence de ses enfants et le solde de la famille depuis un seul compte."],
      ["Dans votre langue", "Votre page existe en arabe, anglais, français, allemand, espagnol, turc et russe."],
    ],
    ctaTitle: "Prêt à commencer ?",
    ctaText: "Contactez-nous aujourd'hui et nous organiserons votre premier cours.",
    rights: "Tous droits réservés",
  },
  de: {
    metaDesc: "Arabisch online lernen mit spezialisierten Lehrkräften, zu Zeiten, die zu deiner Zeitzone passen.",
    signIn: "Anmelden",
    heroTag: "Arabisch für Nicht-Muttersprachler",
    heroTitle: "Arabisch online lernen, von überall auf der Welt",
    heroText: "Live-Unterricht mit spezialisierten Lehrkräften, zu Zeiten, die dir passen, in deiner eigenen Zeitzone.",
    contact: "Schreib uns auf WhatsApp",
    programsTitle: "Unser Angebot",
    programs: [
      ["Arabisch von Anfang an", "Von Buchstaben und Aussprache bis zum sicheren Lesen und Schreiben, Schritt für Schritt."],
      ["Konversation", "Übe das Sprechen in Alltagssituationen, live mit deiner Lehrkraft."],
      ["Grammatik und Lesen", "Verstehe, wie die Sprache funktioniert, und lies arabische Texte selbstständig."],
    ],
    stepsTitle: "So fängst du an",
    steps: [
      ["Melde dich bei uns", "Sag uns dein Niveau und dein Ziel."],
      ["Wir legen deine Termine fest", "Gemeinsam wählen wir feste Tage und Uhrzeiten in deiner Zeitzone."],
      ["Fang an zu lernen", "Tritt deiner Stunde mit einem Tipp von deiner persönlichen Seite aus bei."],
    ],
    whyTitle: "Warum bei uns lernen?",
    why: [
      ["Zeiten in deiner Zeitzone", "Jede Stunde wird in deiner Ortszeit angezeigt und bleibt auch bei der Zeitumstellung gleich."],
      ["Deine eigene Seite", "Kommende Stunden, dein Guthaben, Notizen deiner Lehrkraft und Hausaufgaben an einem Ort."],
      ["Mit einem Tipp dabei", "Ein Knopf öffnet deine Live-Stunde. Kein Suchen nach Links."],
      ["Flexibel absagen", "Sagst du {h} Stunden oder früher vor der Stunde ab, wird sie nicht von deinem Guthaben abgezogen."],
      ["Eltern behalten den Überblick", "Eltern sehen Stunden und Anwesenheit ihrer Kinder und das Familienguthaben in einem Konto."],
      ["In deiner Sprache", "Deine Seite gibt es auf Arabisch, Englisch, Französisch, Deutsch, Spanisch, Türkisch und Russisch."],
    ],
    ctaTitle: "Bereit anzufangen?",
    ctaText: "Melde dich heute, und wir planen deine erste Stunde.",
    rights: "Alle Rechte vorbehalten",
  },
  es: {
    metaDesc: "Aprende árabe en línea con profesores especializados, en horarios adaptados a tu zona horaria.",
    signIn: "Iniciar sesión",
    heroTag: "Árabe para no nativos",
    heroTitle: "Aprende árabe en línea, desde cualquier lugar del mundo",
    heroText: "Clases en directo con profesores especializados, en los horarios que te convienen y en tu propia zona horaria.",
    contact: "Escríbenos por WhatsApp",
    programsTitle: "Qué ofrecemos",
    programs: [
      ["Árabe desde cero", "De las letras y la pronunciación a leer y escribir con confianza, paso a paso."],
      ["Conversación", "Practica hablar en situaciones cotidianas, en directo con tu profesor."],
      ["Gramática y lectura", "Entiende cómo funciona el idioma y lee textos árabes por tu cuenta."],
    ],
    stepsTitle: "Cómo empezar",
    steps: [
      ["Contáctanos", "Cuéntanos tu nivel y tu objetivo."],
      ["Fijamos tu horario", "Elegimos contigo días y horas fijos en tu zona horaria."],
      ["Empieza a aprender", "Entra a tu clase con un toque desde tu página personal."],
    ],
    whyTitle: "¿Por qué aprender con nosotros?",
    why: [
      ["Horarios en tu zona horaria", "Cada clase se muestra en tu hora local y no cambia con el horario de verano."],
      ["Tu propia página", "Tus próximas clases, tu saldo, las notas de tu profesor y tus deberes en un solo lugar."],
      ["Entra con un toque", "Un botón abre tu clase en directo. Sin buscar enlaces."],
      ["Cancelación flexible", "Si cancelas {h} horas o más antes de la clase, no se descuenta de tu saldo."],
      ["Los padres están al tanto", "Un padre sigue las clases y la asistencia de sus hijos y el saldo familiar desde una sola cuenta."],
      ["En tu idioma", "Tu página está disponible en árabe, inglés, francés, alemán, español, turco y ruso."],
    ],
    ctaTitle: "¿Listo para empezar?",
    ctaText: "Contáctanos hoy y organizamos tu primera clase.",
    rights: "Todos los derechos reservados",
  },
  tr: {
    metaDesc: "Uzman öğretmenlerle, kendi saat diliminize uygun saatlerde çevrimiçi Arapça öğrenin.",
    signIn: "Giriş yap",
    heroTag: "Ana dili Arapça olmayanlar için Arapça",
    heroTitle: "Dünyanın her yerinden çevrimiçi Arapça öğrenin",
    heroText: "Uzman öğretmenlerle canlı dersler, size uygun saatlerde ve kendi saat diliminizde.",
    contact: "WhatsApp'tan bize yazın",
    programsTitle: "Neler sunuyoruz?",
    programs: [
      ["Sıfırdan Arapça", "Harfler ve telaffuzdan güvenle okuma ve yazmaya kadar, adım adım."],
      ["Konuşma", "Günlük durumlarda konuşmayı öğretmeninizle canlı olarak çalışın."],
      ["Dil bilgisi ve okuma", "Dilin nasıl işlediğini anlayın ve Arapça metinleri kendiniz okuyun."],
    ],
    stepsTitle: "Nasıl başlanır?",
    steps: [
      ["Bize ulaşın", "Seviyenizi ve hedefinizi bize anlatın."],
      ["Programınızı belirleyelim", "Kendi saat diliminizde sabit gün ve saatleri birlikte seçelim."],
      ["Öğrenmeye başlayın", "Kişisel sayfanızdan tek dokunuşla dersinize katılın."],
    ],
    whyTitle: "Neden bizimle öğrenmelisiniz?",
    why: [
      ["Kendi saatinizle", "Her ders yerel saatinizle gösterilir ve yaz saati değişse de aynı kalır."],
      ["Size özel sayfa", "Yaklaşan dersleriniz, bakiyeniz, öğretmeninizin notları ve ödevleriniz tek yerde."],
      ["Tek dokunuşla katılın", "Tek bir düğme canlı dersinizi açar. Bağlantı aramanıza gerek yok."],
      ["Esnek iptal", "Dersten {h} saat veya daha önce iptal ederseniz bakiyenizden düşülmez."],
      ["Veliler takip eder", "Veli, çocuklarının derslerini, yoklamasını ve aile bakiyesini tek hesaptan izler."],
      ["Kendi dilinizde", "Sayfanız Arapça, İngilizce, Fransızca, Almanca, İspanyolca, Türkçe ve Rusça olarak kullanılabilir."],
    ],
    ctaTitle: "Başlamaya hazır mısınız?",
    ctaText: "Bugün bize ulaşın, ilk dersinizi ayarlayalım.",
    rights: "Tüm hakları saklıdır",
  },
  ru: {
    metaDesc: "Учите арабский онлайн с опытными преподавателями в удобное время по вашему часовому поясу.",
    signIn: "Войти",
    heroTag: "Арабский для тех, для кого он не родной",
    heroTitle: "Учите арабский онлайн из любой точки мира",
    heroText: "Живые уроки с опытными преподавателями в удобное для вас время и по вашему часовому поясу.",
    contact: "Написать нам в WhatsApp",
    programsTitle: "Что мы предлагаем",
    programs: [
      ["Арабский с нуля", "От букв и произношения до уверенного чтения и письма, шаг за шагом."],
      ["Разговорная практика", "Учитесь говорить в повседневных ситуациях вживую с преподавателем."],
      ["Грамматика и чтение", "Поймите, как устроен язык, и читайте арабские тексты самостоятельно."],
    ],
    stepsTitle: "Как начать",
    steps: [
      ["Свяжитесь с нами", "Расскажите о своём уровне и цели."],
      ["Составим расписание", "Вместе выберем постоянные дни и часы по вашему часовому поясу."],
      ["Начните учиться", "Заходите на урок одним нажатием со своей личной страницы."],
    ],
    whyTitle: "Почему стоит учиться у нас?",
    why: [
      ["Время по вашему поясу", "Все уроки показаны по вашему местному времени и не сдвигаются при переходе на летнее время."],
      ["Личная страница", "Ближайшие уроки, баланс, заметки преподавателя и домашние задания в одном месте."],
      ["Вход одним нажатием", "Одна кнопка открывает ваш урок. Не нужно искать ссылки."],
      ["Гибкая отмена", "Если отменить урок за {h} ч или раньше, он не списывается с баланса."],
      ["Родители в курсе", "Родитель видит уроки и посещаемость детей и баланс семьи в одном аккаунте."],
      ["На вашем языке", "Страница доступна на арабском, английском, французском, немецком, испанском, турецком и русском."],
    ],
    ctaTitle: "Готовы начать?",
    ctaText: "Свяжитесь с нами сегодня, и мы назначим ваш первый урок.",
    rights: "Все права защищены",
  },
};
