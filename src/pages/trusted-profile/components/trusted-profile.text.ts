import { LangTextI } from '@shared/interfaces';

const label = (ENG: string, RUS: string, ESP: string, EST: string, ARM: string): LangTextI => ({ ENG, RUS, ESP, EST, ARM });

export const TRUSTED_PROFILE_TEXT = {
  trusted: label('Trusted person', 'Доверенный человек', 'Persona de confianza', 'Usaldusisik', 'Վստահելի անձ'),
  missing: label('This person is no longer in your trusted list.', 'Этот человек больше не в вашем списке доверенных.', 'Esta persona ya no está en tu lista de confianza.', 'See inimene pole enam sinu usaldusisikute loendis.', 'Այս անձն այլևս ձեր վստահելիների ցանկում չէ։'),
  profileError: label('Could not load the trusted profile.', 'Не удалось загрузить профиль доверенного.', 'No se pudo cargar el perfil de confianza.', 'Usaldusisiku profiili ei õnnestunud laadida.', 'Չհաջողվեց բեռնել վստահելի անձի էջը։'),
  restricted: label('Access to this person’s recordings and messages is restricted.', 'Доступ к записям и сообщениям этого человека ограничен.', 'El acceso a las grabaciones y mensajes de esta persona está restringido.', 'Ligipääs selle inimese salvestistele ja sõnumitele on piiratud.', 'Այս անձի ձայնագրությունների և հաղորդագրությունների հասանելիությունը սահմանափակված է։'),
  content: label('Shared content', 'Доступные материалы', 'Contenido compartido', 'Jagatud sisu', 'Համօգտագործված նյութեր'),
  recordings: label('SOS recordings', 'Экстренные видео', 'Grabaciones SOS', 'SOS-salvestised', 'SOS տեսագրություններ'),
  messages: label('Messages', 'Сообщения', 'Mensajes', 'Sõnumid', 'Հաղորդագրություններ'),
  noRecordings: label('No SOS recordings yet.', 'Экстренных записей пока нет.', 'Aún no hay grabaciones SOS.', 'SOS-salvestisi veel pole.', 'Դեռ SOS տեսագրություններ չկան։'),
  noMessages: label('No messages yet.', 'Сообщений пока нет.', 'Aún no hay mensajes.', 'Sõnumeid veel pole.', 'Դեռ հաղորդագրություններ չկան։'),
  messageError: label('Could not load messages.', 'Не удалось загрузить сообщения.', 'No se pudieron cargar los mensajes.', 'Sõnumeid ei õnnestunud laadida.', 'Չհաջողվեց բեռնել հաղորդագրությունները։'),
  liveError: label('Could not check for a live broadcast.', 'Не удалось проверить, идёт ли трансляция.', 'No se pudo comprobar si hay una transmisión en vivo.', 'Otseülekande olemasolu ei õnnestunud kontrollida.', 'Չհաջողվեց ստուգել ուղիղ հեռարձակման առկայությունը։'),
  unread: label('Unread', 'Непрочитанное', 'Sin leer', 'Lugemata', 'Չկարդացված'),
  unreadCount: label('Unread: {count}', 'Непрочитанных: {count}', 'Sin leer: {count}', 'Lugemata: {count}', 'Չկարդացված՝ {count}'),
  message: label('Non-urgent message', 'Несрочное сообщение', 'Mensaje no urgente', 'Mittekiireloomuline sõnum', 'Ոչ հրատապ հաղորդագրություն'),
  recordedOn: label('Recorded {date}', 'Записано {date}', 'Grabado {date}', 'Salvestatud {date}', 'Ձայնագրվել է {date}'),
  stream: label('SOS broadcast', 'Трансляция SOS', 'Transmisión SOS', 'SOS-otseülekanne', 'SOS հեռարձակում'),
  live: label('Live', 'В эфире', 'En vivo', 'Otseülekanne', 'Ուղիղ եթերում'),
  watchLive: label('Watch live', 'Смотреть трансляцию', 'Ver en vivo', 'Vaata otse', 'Դիտել ուղիղ եթերը'),
  recording: label('SOS recording', 'Экстренная запись', 'Grabación SOS', 'SOS-salvestis', 'SOS տեսագրություն'),
  play: label('Watch', 'Смотреть', 'Ver', 'Vaata', 'Դիտել'),
  unavailable: label('The recording link is no longer available.', 'Ссылка на запись больше недоступна.', 'El enlace a la grabación ya no está disponible.', 'Salvestise link pole enam saadaval.', 'Տեսագրության հղումն այլևս հասանելի չէ։'),
  processing: label('The recording is being processed.', 'Запись обрабатывается.', 'Se está procesando la grabación.', 'Salvestist töödeldakse.', 'Տեսագրությունը մշակվում է։'),
  sealed: label('Verifiable', 'Проверяемая', 'Verificable', 'Kontrollitav', 'Ստուգելի'),
  evidencePending: label('Verification pending', 'Готовится к проверке', 'Verificación pendiente', 'Ootab kontrolli', 'Ստուգումը սպասվում է'),
  evidenceFailed: label('Verification unavailable', 'Проверка недоступна', 'Verificación no disponible', 'Kontroll pole saadaval', 'Ստուգումն անհասանելի է'),
  removeCancel: label('Cancel', 'Отмена', 'Cancelar', 'Loobu', 'Չեղարկել'),
  location: label('Open recording location on a map', 'Показать место записи на карте', 'Mostrar la ubicación de la grabación en un mapa', 'Näita salvestise asukohta kaardil', 'Ցույց տալ տեսագրման վայրը քարտեզի վրա'),
  incomplete: label('This recording contains gaps.', 'В записи есть пропуски.', 'Esta grabación tiene interrupciones.', 'Salvestises on lünki.', 'Տեսագրության մեջ բացեր կան։'),
};
