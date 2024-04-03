import { Signal } from "@angular/core";
import { LangTextI } from "@shared/interfaces";

export const INPUT_PLACEHOLDER: LangTextI = {
  ENG: 'Enter your username',
  ESP: 'Ingrese su nombre de usuario',
  RUS: 'Введите логин'
};

export const LOGO_TITLE: LangTextI = {
  ENG: 'msr-logo-title.svg',
  ESP: 'msr-logo-title.svg',
  RUS: 'msr-logo-title-ru.svg'
};

export const LOGO_TEXT: LangTextI = {
  ENG: 'msr-logo-title.svg',
  ESP: 'msr-logo-title.svg',
  RUS: 'msr-logo-title-ru.svg'
};

export const TEXT_MAIN: Record<string, LangTextI> = {
  innovative: {
    ENG: "Mobile Security Remote Recorder is an innovative safety solution designed to empower individuals with the ability to discreetly initiate video and audio recordings from their phone, instantly uploading the footage to a secure server. This cutting-edge system is tailored for moments when capturing and preserving real-time events is crucial for security and evidence purposes. Whether you're facing a threat, witnessing a critical incident, or simply want to ensure your safety in uncertain situations, MSR provides an immediate and secure way to record and store evidence without drawing attention.",
    RUS: "Мобильный Удаленный Регистратор - инновационное решение безопасности, разработанное для того, чтобы дать возможность людям записывать видео и аудиозаписи со своего телефона и мгновенно загружать полученные материалы на защищенный сервер. Эта передовая система адаптирована для ситуаций, когда захват и сохранение событий в реальном времени критичны с точки зрения безопасности и доказательств. Независимо от того, столкнулись ли вы с угрозой, стали свидетелем критического инцидента или просто хотите обеспечить свою безопасность в неопределенных ситуациях, МУР предоставляет немедленный и безопасный способ записи и хранения доказательств без привлечения внимания.",
    ESP: "",
  },
  citizen: {
    ENG: "Whether you're a concerned citizen witnessing an injustice or someone who frequently finds themselves in situations where safety is a concern, MSR empowers you to act swiftly and securely.",
    RUS: "Будь то обеспокоенный гражданин, становящийся свидетелем несправедливости, или человек, часто оказывающийся в ситуациях, когда безопасность вызывает опасения, МУР дает вам возможность действовать быстро и надежно.",
    ESP: "",
  },
  journalists: {
    ENG: "Journalists, private investigators, and security personnel can utilize MSR to discreetly gather evidence and record events without compromising their position or safety.",
    RUS: "Журналисты, частные детективы и сотрудники службы безопасности могут использовать МУР для конфиденциального сбора доказательств и записи событий, не подвергая свою позицию или безопасность риску.",
    ESP: "",
  },
  adventurers: {
    ENG: "Adventurers and explorers venturing into remote or potentially risky environments can rely on MSR for documenting encounters and ensuring a digital footprint of their journey is securely preserved.",
    RUS: "Путешественники и исследователи, отправляющиеся в отдаленные или потенциально опасные окружения, могут полагаться на МУР для документирования встреч и обеспечения безопасного сохранения цифрового следа своего путешествия.",
    ESP: "",
  },
  anyone: {
    ENG: "Anyone who values personal safety and the peace of mind knowing they can discreetly record situations that feel unsafe or threatening will find MSR indispensable.",
    RUS: "Любой, кто ценит личную безопасность и спокойствие, зная, что он может конфиденциально записывать ситуации, которые кажутся ему небезопасными или угрожающими, обнаружит, что МУР является незаменимым инструментом.",
    ESP: "",
  },

  believe: {
    ENG: "We believe in empowering individuals to safeguard their well-being and to document the world around them securely. Whether you're confronting a personal safety threat, capturing a moment of truth, or simply gathering memories without intrusion, MSR stands by to enhance your security and peace of mind in an ever-changing world.",
    RUS: "Мы верим в то, что нужно давать людям возможность защищать свое благополучие и безопасно документировать окружающий их мир. Будь вы сталкиваетесь с угрозой личной безопасности, фиксируете момент истины или просто собираете воспоминания без вмешательства, MSR готова помочь улучшить вашу безопасность и спокойствие в постоянно меняющемся мире.",
    ESP: "En MSR, creemos en empoderar a las personas para proteger su bienestar y documentar el mundo que les rodea de manera segura. Ya sea que estés enfrentando una amenaza a tu seguridad personal, capturando un momento de verdad, o simplemente recolectando recuerdos sin intrusión, MSR está aquí para mejorar tu seguridad y paz mental en un mundo en constante cambio.",
  },

  experience: {
    ENG: "Experience the next level of personal security and documentation with MSR: Mobile Security Remote Recorder — where technology meets tranquility.",
    RUS: "",
    ESP: "",
  },

  layout: {
    ENG: "This layout provides a comprehensive overview of the MSR product, highlighting its benefits, potential uses, and unique features. It's structured to engage various target audiences, emphasizing MSR's role as a versatile and essential tool for security and evidence gathering.",
    RUS: "",
    ESP: "",
  },

  // Features that set MSR apart:
  
  discreet: {
    "ENG": "Discreet Activation: Initiate recordings without drawing attention to your actions, providing a covert means to document events.",
    "RUS": "Кнопочная активация: Начинайте запись, не привлекая внимания к своим действиям, что обеспечивает скрытый способ документирования событий.",
    "ESP": "Activación Discreta: Inicia grabaciones sin atraer atención hacia tus acciones, proporcionando un medio encubierto para documentar eventos."
  },
  immediate: {
    "ENG": "Immediate Upload: Seamlessly upload your recordings to a secure server, ensuring your evidence is safe, sound, and accessible when needed.",
    "RUS": "Немедленная загрузка: Беспрепятственно загружайте ваши записи на защищенный сервер, гарантируя безопасность и доступность ваших данных когда это необходимо.",
    "ESP": "Carga Inmediata: Sube tus grabaciones a un servidor seguro sin inconvenientes, asegurando que tu evidencia esté segura y accesible cuando sea necesario."
  },
  friendly: {
    "ENG": "Alerting Trusted Individuals: A notification system has been developed to inform those you trust when you start an emergency recording. This includes the ability for them to view your broadcast and your location.",
    "RUS": "Оповещение доверенных людей: Разработанна система оповещения тех, кому вы доверяете, о том, что вы начали экстренную запись. С возможность просмотра ими вашей трансляции и вашего местоположения.",
    "ESP": "Alertando a Personas de Confianza: Se ha desarrollado un sistema de notificación para informar a aquellos en quienes confías cuando inicias una grabación de emergencia. Esto incluye la capacidad para ellos de ver tu transmisión y tu ubicación."
  },
  quality: {
    "ENG": "High-Quality Recordings: Capture clear and comprehensive audio and video recordings, crucial for evidence and clarity.",
    "RUS": "Записи высокого качества: Захватывайте четкие и полные аудио и видео записи, критически важные для доказательств и ясности.",
    "ESP": "Grabaciones de Alta Calidad: Captura grabaciones de audio y video claras y completas, cruciales para la evidencia y claridad."
  },
  advanced: {
    "ENG": "Advanced Security Protocols: With state-of-the-art encryption and privacy measures, your recordings are only accessible to you and those you choose to share them with.",
    "RUS": "Продвинутые протоколы безопасности: С передовым шифрованием и мерами конфиденциальности, ваши записи доступны только вам и тем, с кем вы решите ими поделиться.",
    "ESP": "Protocolos de Seguridad Avanzados: Con encriptación de última generación y medidas de privacidad, tus grabaciones solo están accesibles para ti y aquellos con quienes elijas compartirlas."
  },
  

  // MSR: Empowering Security Through Technology
  world: {
    "ENG": "In a world where uncertainty can lurk around every corner, MSR offers more than just a recording app; it's a commitment to personal safety and protection. However, in our world, financial commitments cannot be shifted onto us. We provide you with 10 MB of free storage, but you have the option to purchase a paid version where you can set the limits you need.",
    "RUS": "В мире, где неопределенность может подстерегать за каждым углом, MSR предлагает не просто приложение для записи, это обязательство личной безопасности и защиты. Но в нашем мире финансовые обязательства нельзя перекладывать на нас, мы предоставляем вам бесплатное хранилище на 10 мб., но вы можете приобрести платную версию, в которой самому можно установить необходимые вам лимиты.",
    "ESP": "En un mundo donde la incertidumbre puede acechar en cada esquina, MSR ofrece más que una simple aplicación de grabación; es un compromiso con la seguridad y protección personal. Sin embargo, en nuestro mundo, los compromisos financieros no pueden ser transferidos a nosotros. Te proporcionamos 10 MB de almacenamiento gratuito, pero tienes la opción de comprar una versión de pago donde puedes establecer los límites que necesitas."
  },
};
