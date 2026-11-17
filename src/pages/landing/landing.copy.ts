import { LangEnum } from '@shared/interfaces';

interface LandingItem {
  title: string;
  text: string;
}

export interface LandingPresentationCopy {
  title: string;
  description: string;
  open: string;
  close: string;
  loading: string;
  unavailable: string;
  retry: string;
}

interface LandingCopy {
  title: string;
  description: string;
  skip: string;
  nav: {
    label: string;
    how: string;
    presentation: string;
    verify: string;
    language: string;
    signIn: string;
    account: string;
    menu: string;
  };
  hero: {
    label: string;
    title: string;
    text: string;
    download: string;
    verify: string;
    pause: string;
    resume: string;
    recorder: {
      title: string;
      emergency: string;
      verifiable: string;
      location: string;
      stop: string;
      shortcutLabel: string;
      shortcutGesture: string;
      shortcutSetup: string;
    };
  };
  how: { title: string; steps: [LandingItem, LandingItem, LandingItem] };
  deck: LandingPresentationCopy;
  situations: { title: string; items: LandingItem[] };
  verify: LandingItem & { action: string };
  faq: { title: string; items: (LandingItem & { download?: boolean })[] };
  article: string;
  contact: string;
}

export const LANDING_COPY: Record<LangEnum, LandingCopy> = {
  [LangEnum.RUS]: {
    title: 'E-stream — проверяемая видеозапись',
    description: 'Записывайте важные события, сохраняйте видео удалённо и оповещайте доверенных людей в режиме SOS.',
    skip: 'К содержимому',
    nav: {
      label: 'Основная навигация',
      how: 'Как это работает',
      presentation: 'Презентация',
      verify: 'Верификация',
      language: 'Язык сайта',
      signIn: 'Войти',
      account: 'Мой профиль',
      menu: 'Меню'
    },
    hero: {
      label: 'Личная безопасность и проверяемая видеозапись',
      title: 'Запишите то, что важно.',
      text: 'Храните видео вне телефона и оповещайте доверенных людей через SOS.',
      download: 'Скачать для Android',
      verify: 'Проверить запись',
      pause: 'Приостановить демонстрацию',
      resume: 'Возобновить демонстрацию',
      recorder: {
        title: 'Видео регистратор',
        emergency: 'Экстренная',
        verifiable: 'Проверяемая',
        location: 'Передавать геолокацию',
        stop: 'Остановить запись',
        shortcutLabel: 'SOS с экрана блокировки',
        shortcutGesture: 'Громкость вниз ×3',
        shortcutSetup: 'Android · после настройки'
      }
    },
    how: {
      title: 'От съёмки до проверки',
      steps: [
        { title: 'Запишите', text: 'Начните обычную съёмку или включите SOS, чтобы оповестить выбранных людей.' },
        { title: 'Сохраните', text: 'При доступной сети части записи загружаются в удалённое хранилище.' },
        { title: 'Подтвердите', text: 'Проверьте, откуда взялась запись и совпадает ли файл с сохранённой версией.' }
      ]
    },
    deck: {
      title: 'Презентация E-stream',
      description: 'Путь записи, работа SOS, доступ к материалам и сценарии для команд.',
      open: 'Смотреть',
      close: 'Закрыть презентацию',
      loading: 'Загрузка презентации…',
      unavailable: 'Не удалось загрузить презентацию.',
      retry: 'Повторить'
    },
    situations: {
      title: 'Когда запись пригодится',
      items: [
        {
          title: 'В дороге и в незнакомом месте',
          text: 'Если обстановка тревожит, зафиксируйте происходящее и оповестите тех, кому доверяете.'
        },
        { title: 'На работе и на выезде', text: 'Сохраните ход работ, состояние объекта или детали важной встречи.' },
        {
          title: 'Когда вы стали свидетелем',
          text: 'Сохраните исходную запись события, чтобы к ней можно было вернуться и проверить её происхождение.'
        }
      ]
    },
    verify: {
      title: 'Уже есть запись E-stream?',
      text: 'Проверьте MP4, пакет доказательств или ссылку на MP4 прямо в браузере.',
      action: 'Открыть верификацию'
    },
    faq: {
      title: 'Частые вопросы',
      items: [
        {
          title: 'Что подтверждает верификация?',
          text: 'Проверка помогает подтвердить происхождение записи и совпадение файла с сохранённой версией. Обстоятельства события оцениваются отдельно.'
        },
        {
          title: 'Что будет, если пропадёт интернет?',
          text: 'Запись может продолжаться на устройстве. Уже загруженные части остаются в хранилище, а передача оставшихся возобновляется, когда связь возвращается. Статус виден в приложении.'
        },
        {
          title: 'Кого оповестит SOS?',
          text: 'Оповещения получают доверенные люди, которых вы выбрали заранее. Передача сигнала и видео зависит от доступности сети.'
        },
        { title: 'Где скачать приложение?', text: 'Для Android доступен установочный APK.', download: true }
      ]
    },
    article: 'Подробная статья об E-stream',
    contact: 'Поддержка'
  },
  [LangEnum.ENG]: {
    title: 'E-stream — Verifiable video recording',
    description: 'Record important events, save video remotely, and alert trusted people with SOS.',
    skip: 'Skip to content',
    nav: {
      label: 'Main navigation',
      how: 'How it works',
      presentation: 'Presentation',
      verify: 'Verification',
      language: 'Site language',
      signIn: 'Sign in',
      account: 'My profile',
      menu: 'Menu'
    },
    hero: {
      label: 'Personal safety and verifiable video',
      title: 'Record what matters.',
      text: 'Keep recordings off your phone and alert people you trust with SOS.',
      download: 'Download for Android',
      verify: 'Verify a recording',
      pause: 'Pause demo',
      resume: 'Resume demo',
      recorder: {
        title: 'Video Recorder',
        emergency: 'Emergency',
        verifiable: 'Verifiable',
        location: 'Share location',
        stop: 'Stop recording',
        shortcutLabel: 'SOS from the lock screen',
        shortcutGesture: 'Volume Down ×3',
        shortcutSetup: 'Android · after setup'
      }
    },
    how: {
      title: 'From capture to verification',
      steps: [
        { title: 'Record', text: 'Start a regular recording or turn on SOS to alert the people you selected.' },
        { title: 'Save', text: 'Recorded segments upload to remote storage when a connection is available.' },
        { title: 'Verify', text: 'Check where a recording came from and whether the file matches the saved version.' }
      ]
    },
    deck: {
      title: 'E-stream presentation',
      description: 'Follow a recording, see how SOS works, and explore access and team use cases.',
      open: 'Watch',
      close: 'Close presentation',
      loading: 'Loading presentation…',
      unavailable: 'The presentation could not load.',
      retry: 'Try again'
    },
    situations: {
      title: 'When a recording can help',
      items: [
        {
          title: 'On the road or somewhere unfamiliar',
          text: 'If a situation concerns you, document what is happening and alert someone you trust.'
        },
        {
          title: 'At work or in the field',
          text: 'Keep a record of work in progress, the condition of a site, or the details of an important meeting.'
        },
        {
          title: 'When you witness an event',
          text: 'Keep the original recording so you can review it later and verify where it came from.'
        }
      ]
    },
    verify: {
      title: 'Already have an E-stream recording?',
      text: 'Verify an MP4, an evidence package, or an MP4 link right in your browser.',
      action: 'Open verification'
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        {
          title: 'What does verification confirm?',
          text: 'It helps confirm a recording’s origin and whether the file matches the stored version. The circumstances of the event are assessed separately.'
        },
        {
          title: 'What if I lose my internet connection?',
          text: 'Recording can continue on the device. Uploaded segments remain in storage and the remaining segments resume uploading when the connection returns. You can check the status in the app.'
        },
        {
          title: 'Who gets an SOS alert?',
          text: 'Alerts go to the trusted people you selected in advance. The signal and video depend on an available connection.'
        },
        { title: 'Where can I get the app?', text: 'The Android app is available as an APK installer.', download: true }
      ]
    },
    article: 'An in-depth look at E-stream',
    contact: 'Support'
  },
  [LangEnum.ESP]: {
    title: 'E-stream — Grabación de vídeo verificable',
    description: 'Graba eventos importantes, guarda el vídeo de forma remota y avisa a tus contactos de confianza con SOS.',
    skip: 'Ir al contenido',
    nav: {
      label: 'Navegación principal',
      how: 'Cómo funciona',
      presentation: 'Presentación',
      verify: 'Verificación',
      language: 'Idioma del sitio',
      signIn: 'Iniciar sesión',
      account: 'Mi perfil',
      menu: 'Menú'
    },
    hero: {
      label: 'Seguridad personal y vídeo verificable',
      title: 'Graba lo que importa.',
      text: 'Guarda los vídeos fuera del teléfono y avisa a tus contactos de confianza con SOS.',
      download: 'Descargar para Android',
      verify: 'Verificar grabación',
      pause: 'Pausar la demostración',
      resume: 'Reanudar la demostración',
      recorder: {
        title: 'Grabador de video',
        emergency: 'Emergencia',
        verifiable: 'Verificable',
        location: 'Compartir ubicación',
        stop: 'Detener grabación',
        shortcutLabel: 'SOS desde la pantalla de bloqueo',
        shortcutGesture: 'Bajar volumen ×3',
        shortcutSetup: 'Android · tras configurarlo'
      }
    },
    how: {
      title: 'De la grabación a la verificación',
      steps: [
        { title: 'Graba', text: 'Inicia una grabación normal o activa SOS para avisar a los contactos seleccionados.' },
        { title: 'Guarda', text: 'Cuando hay conexión, los fragmentos se suben al almacenamiento remoto.' },
        { title: 'Verifica', text: 'Comprueba el origen de la grabación y si el archivo coincide con la versión guardada.' }
      ]
    },
    deck: {
      title: 'Presentación de E-stream',
      description: 'El recorrido de una grabación, el modo SOS, los permisos y el uso en equipos.',
      open: 'Ver',
      close: 'Cerrar presentación',
      loading: 'Cargando presentación…',
      unavailable: 'No se pudo cargar la presentación.',
      retry: 'Reintentar'
    },
    situations: {
      title: 'Cuándo puede ayudar una grabación',
      items: [
        {
          title: 'De viaje o en un lugar desconocido',
          text: 'Si algo te inquieta, documenta lo que sucede y avisa a alguien de confianza.'
        },
        {
          title: 'En el trabajo o sobre el terreno',
          text: 'Deja constancia de los trabajos en curso, del estado de un lugar o de los detalles de una reunión importante.'
        },
        { title: 'Cuando presencias un suceso', text: 'Conserva la grabación original para consultarla y verificar su origen más tarde.' }
      ]
    },
    verify: {
      title: '¿Ya tienes una grabación de E-stream?',
      text: 'Verifica un MP4, un paquete de evidencias o un enlace a un MP4 en el navegador.',
      action: 'Abrir verificación'
    },
    faq: {
      title: 'Preguntas frecuentes',
      items: [
        {
          title: '¿Qué confirma la verificación?',
          text: 'Ayuda a confirmar el origen de la grabación y si el archivo coincide con la versión guardada. Las circunstancias del suceso se evalúan por separado.'
        },
        {
          title: '¿Qué pasa si pierdo la conexión a internet?',
          text: 'La grabación puede continuar en el dispositivo. Los fragmentos ya subidos se conservan y la carga de los restantes se reanuda cuando vuelve la conexión. Puedes consultar el estado en la aplicación.'
        },
        {
          title: '¿Quién recibe el aviso SOS?',
          text: 'Los avisos llegan a los contactos de confianza que elegiste de antemano. El envío de la señal y del vídeo depende de la conexión.'
        },
        { title: '¿Dónde descargo la aplicación?', text: 'La aplicación para Android está disponible como instalador APK.', download: true }
      ]
    },
    article: 'Artículo en profundidad sobre E-stream',
    contact: 'Soporte'
  },
  [LangEnum.EST]: {
    title: 'E-stream — kontrollitav videosalvestus',
    description: 'Salvesta olulisi sündmusi, hoia videoid kaughoidlas ja teavita SOS-režiimis usaldusisikuid.',
    skip: 'Liigu sisu juurde',
    nav: {
      label: 'Peamenüü',
      how: 'Kuidas see töötab',
      presentation: 'Esitlus',
      verify: 'Kontrollimine',
      language: 'Veebilehe keel',
      signIn: 'Logi sisse',
      account: 'Minu profiil',
      menu: 'Menüü'
    },
    hero: {
      label: 'Isiklik turvalisus ja tõendatav video',
      title: 'Salvesta see, mis loeb.',
      text: 'Talleta video väljaspool telefoni ja teavita SOS-režiimis usaldusisikuid.',
      download: 'Laadi alla Androidile',
      verify: 'Kontrolli salvestist',
      pause: 'Peata esitlus',
      resume: 'Jätka esitlust',
      recorder: {
        title: 'Videosalvesti',
        emergency: 'Hädaolukord',
        verifiable: 'Tõendatav',
        location: 'Jaga asukohta',
        stop: 'Peata salvestamine',
        shortcutLabel: 'SOS lukustuskuvalt',
        shortcutGesture: 'Helitugevus alla ×3',
        shortcutSetup: 'Androidis pärast seadistamist'
      }
    },
    how: {
      title: 'Salvestamisest kontrollini',
      steps: [
        { title: 'Salvesta', text: 'Alusta tavalist salvestust või lülita valitud inimeste teavitamiseks sisse SOS.' },
        { title: 'Talleta', text: 'Võrguühenduse olemasolul laaditakse salvestise osad kaughoidlasse.' },
        { title: 'Kontrolli', text: 'Vaata, kust salvestis pärineb ja kas fail vastab talletatud versioonile.' }
      ]
    },
    deck: {
      title: 'E-streami esitlus',
      description: 'Salvestise teekond, SOS-režiim, ligipääs ja kasutusvõimalused meeskondadele.',
      open: 'Vaata',
      close: 'Sulge esitlus',
      loading: 'Esitlus laadib…',
      unavailable: 'Esitlust ei õnnestunud laadida.',
      retry: 'Proovi uuesti'
    },
    situations: {
      title: 'Millal võib salvestis aidata',
      items: [
        { title: 'Teel või tundmatus kohas', text: 'Kui olukord teeb muret, jäädvusta toimuv ja anna sellest usaldusisikule teada.' },
        { title: 'Tööl või välitöödel', text: 'Jäädvusta töö edenemine, objekti seisukord või olulise kohtumise üksikasjad.' },
        {
          title: 'Kui oled sündmuse tunnistaja',
          text: 'Hoia algne salvestis alles, et saaksid seda hiljem vaadata ja selle päritolu kontrollida.'
        }
      ]
    },
    verify: {
      title: 'Kas sul on juba E-streami salvestis?',
      text: 'Kontrolli MP4-faili, tõendipaketti või MP4-linki otse brauseris.',
      action: 'Ava kontrollimine'
    },
    faq: {
      title: 'Korduma kippuvad küsimused',
      items: [
        {
          title: 'Mida kontrollimine kinnitab?',
          text: 'See aitab kinnitada salvestise päritolu ja kontrollida, kas fail vastab talletatud versioonile. Sündmuse asjaolusid hinnatakse eraldi.'
        },
        {
          title: 'Mis juhtub, kui võrguühendus katkeb?',
          text: 'Salvestamine võib seadmes jätkuda. Üles laaditud osad jäävad hoidlasse ja ülejäänute üleslaadimine jätkub ühenduse taastumisel. Olekut näed rakenduses.'
        },
        {
          title: 'Kes saab SOS-teate?',
          text: 'Teate saavad sinu varem valitud usaldusisikud. Signaali ja video edastamine sõltub võrguühendusest.'
        },
        { title: 'Kust saab rakenduse alla laadida?', text: 'Androidi rakendus on saadaval APK-paigaldusfailina.', download: true }
      ]
    },
    article: 'Põhjalik artikkel E-streamist',
    contact: 'Kasutajatugi'
  },
  [LangEnum.ARM]: {
    title: 'E-stream — Ստուգելի տեսագրություն',
    description: 'Նկարահանեք կարևոր իրադարձությունները, պահեք տեսագրությունները հեռակա և SOS ռեժիմով տեղեկացրեք վստահելի մարդկանց։',
    skip: 'Անցնել բովանդակությանը',
    nav: {
      label: 'Հիմնական նավարկում',
      how: 'Ինչպես է աշխատում',
      presentation: 'Ներկայացում',
      verify: 'Ստուգում',
      language: 'Կայքի լեզուն',
      signIn: 'Մուտք գործել',
      account: 'Իմ պրոֆիլը',
      menu: 'Ընտրացանկ'
    },
    hero: {
      label: 'Անձնական անվտանգություն և ստուգելի տեսագրություն',
      title: 'Նկարահանեք կարևորը։',
      text: 'Պահեք տեսագրությունները հեռախոսից դուրս և SOS-ով տեղեկացրեք վստահելի մարդկանց։',
      download: 'Ներբեռնել Android-ի համար',
      verify: 'Ստուգել տեսագրությունը',
      pause: 'Դադարեցնել ցուցադրումը',
      resume: 'Շարունակել ցուցադրումը',
      recorder: {
        title: 'Տեսաձայնագրիչ',
        emergency: 'Արտակարգ',
        verifiable: 'Ստուգելի',
        location: 'Փոխանցել տեղադրությունը',
        stop: 'Դադարեցնել ձայնագրումը',
        shortcutLabel: 'SOS՝ կողպված էկրանից',
        shortcutGesture: 'Իջեցնել ձայնը ×3',
        shortcutSetup: 'Android-ում՝ կարգավորումից հետո'
      }
    },
    how: {
      title: 'Նկարահանումից մինչև ստուգում',
      steps: [
        { title: 'Նկարահանեք', text: 'Սկսեք սովորական տեսագրություն կամ միացրեք SOS ռեժիմը՝ ընտրված մարդկանց տեղեկացնելու համար։' },
        { title: 'Պահեք', text: 'Ցանցի առկայության դեպքում տեսագրության մասերը վերբեռնվում են հեռակա պահոց։' },
        { title: 'Ստուգեք', text: 'Պարզեք տեսագրության ծագումը և ստուգեք, թե արդյոք ֆայլը համապատասխանում է պահված տարբերակին։' }
      ]
    },
    deck: {
      title: 'E-stream-ի ներկայացումը',
      description: 'Տեսագրության ընթացքը, SOS ռեժիմը, հասանելիությունը և կիրառումը թիմերում։',
      open: 'Դիտել',
      close: 'Փակել ներկայացումը',
      loading: 'Ներկայացումը բեռնվում է…',
      unavailable: 'Չհաջողվեց բեռնել ներկայացումը։',
      retry: 'Կրկին փորձել'
    },
    situations: {
      title: 'Երբ տեսագրությունը կարող է օգնել',
      items: [
        {
          title: 'Ճանապարհին կամ անծանոթ վայրում',
          text: 'Եթե իրավիճակը մտահոգում է, նկարահանեք տեղի ունեցածը և տեղեկացրեք վստահելի մարդու։'
        },
        { title: 'Աշխատավայրում կամ տեղում', text: 'Պահպանեք աշխատանքների ընթացքը, տարածքի վիճակը կամ կարևոր հանդիպման մանրամասները։' },
        {
          title: 'Երբ իրադարձության ականատես եք',
          text: 'Պահեք սկզբնական տեսագրությունը՝ հետագայում այն դիտելու և դրա ծագումը ստուգելու համար։'
        }
      ]
    },
    verify: {
      title: 'Արդեն ունե՞ք E-stream տեսագրություն։',
      text: 'Ստուգեք MP4 ֆայլը, ապացույցների փաթեթը կամ MP4-ի հղումը հենց դիտարկիչում։',
      action: 'Անցնել ստուգմանը'
    },
    faq: {
      title: 'Հաճախ տրվող հարցեր',
      items: [
        {
          title: 'Ի՞նչ է հաստատում ստուգումը։',
          text: 'Այն օգնում է հաստատել տեսագրության ծագումը և պարզել՝ արդյոք ֆայլը համապատասխանում է պահված տարբերակին։ Իրադարձության հանգամանքները գնահատվում են առանձին։'
        },
        {
          title: 'Ի՞նչ կլինի, եթե ինտերնետ կապը կտրվի։',
          text: 'Տեսագրությունը կարող է շարունակվել սարքում։ Արդեն վերբեռնված մասերը կմնան պահոցում, իսկ մյուս մասերի փոխանցումը կվերսկսվի կապի վերականգնման դեպքում։ Կարգավիճակը տեսանելի է հավելվածում։'
        },
        {
          title: 'Ո՞վ կստանա SOS ծանուցումը։',
          text: 'Ծանուցումները ստանում են նախապես ընտրված վստահելի մարդիկ։ Ազդանշանի ու տեսանյութի փոխանցումը կախված է ցանցի հասանելիությունից։'
        },
        { title: 'Որտեղի՞ց ներբեռնել հավելվածը։', text: 'Android-ի հավելվածը հասանելի է APK տեղադրման ֆայլով։', download: true }
      ]
    },
    article: 'Մանրամասն հոդված E-stream-ի մասին',
    contact: 'Աջակցություն'
  }
};
