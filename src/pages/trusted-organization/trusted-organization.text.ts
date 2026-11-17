import { LangTextI } from '@shared/interfaces';
import { TRUST_ACCESS_TEXT } from '../../widgets/trusted-people/access/trust-access.text';
import { TRUSTED_PEOPLE_TEXT } from '../../widgets/trusted-people/components/trusted-people.text';

const label = (ENG: string, RUS: string, ESP: string, EST: string, ARM: string): LangTextI => ({ ENG, RUS, ESP, EST, ARM });

export const TRUSTED_ORGANIZATION_TEXT = {
  ...TRUSTED_PEOPLE_TEXT,
  ...TRUST_ACCESS_TEXT,
  trusted: label('Trusted organization', 'Доверенная организация', 'Organización de confianza', 'Usaldusorganisatsioon', 'Վստահելի կազմակերպություն'),
  request: label('Trust request', 'Запрос доверия', 'Solicitud de confianza', 'Usaldustaotlus', 'Վստահության հարցում'),
  confirmDecline: label('Decline the request from {name}?', 'Отклонить запрос от организации {name}?', '¿Rechazar la solicitud de {name}?', 'Kas lükata organisatsiooni {name} taotlus tagasi?', 'Մերժե՞լ {name} կազմակերպության հարցումը։'),
  confirmRemove: label('Remove {name} from your trusted contacts?', 'Удалить организацию {name} из доверенных?', '¿Quitar a {name} de tus contactos de confianza?', 'Kas eemaldada organisatsioon {name} usalduskontaktide hulgast?', 'Հեռացնե՞լ {name} կազմակերպությունը վստահելի կոնտակտներից։'),
  trustedSince: label('Trusted since {date}', 'В доверенных с {date}', 'De confianza desde el {date}', 'Usaldatud alates {date}', 'Վստահելի է {date}-ից'),
  activeDescription: label(
    'This organization is in your trusted list.', 'Эта организация входит в список ваших доверенных контактов.',
    'Esta organización está en tu lista de confianza.', 'See organisatsioon on sinu usaldusloendis.', 'Այս կազմակերպությունը ձեր վստահելի ցանկում է։'
  ),
  pendingDescription: label(
    'This organization wants to become a trusted contact.', 'Организация хочет стать вашим доверенным контактом.',
    'Esta organización quiere ser un contacto de confianza.', 'See organisatsioon soovib saada usalduskontaktiks.',
    'Այս կազմակերպությունը ցանկանում է դառնալ ձեր վստահելի կոնտակտը։'
  ),
  unavailable: label(
    'This organization or trust request is no longer available.', 'Организация или запрос доверия больше недоступны.',
    'Esta organización o solicitud de confianza ya no está disponible.', 'See organisatsioon või usaldustaotlus pole enam saadaval.',
    'Այս կազմակերպությունը կամ վստահության հարցումն այլևս հասանելի չէ։'
  ),
  loadError: label(
    'Could not load the organization. Try again.', 'Не удалось загрузить страницу организации. Попробуйте ещё раз.',
    'No se pudo cargar la organización. Inténtalo de nuevo.', 'Organisatsiooni laadimine ebaõnnestus. Proovi uuesti.',
    'Չհաջողվեց բեռնել կազմակերպության էջը։ Փորձեք կրկին։'
  ),
  noContract: label('Request without a contract', 'Запрос без договора', 'Solicitud sin contrato', 'Taotlus ilma lepinguta', 'Հարցում առանց պայմանագրի'),
  noContractBody: label(
    'The organization sent this request without attaching a contract. You can accept or decline the request.',
    'Организация отправила запрос без договора. Вы можете принять или отклонить запрос.',
    'La organización envió esta solicitud sin adjuntar un contrato. Puedes aceptarla o rechazarla.',
    'Organisatsioon saatis taotluse ilma lepinguta. Saad taotluse vastu võtta või tagasi lükata.',
    'Կազմակերպությունն ուղարկել է հարցումն առանց պայմանագրի։ Կարող եք ընդունել կամ մերժել հարցումը։'
  ),
  acceptOrganization: label('Accept organization', 'Принять организацию', 'Aceptar la organización', 'Võta organisatsioon vastu', 'Ընդունել կազմակերպությանը'),
  acceptedOrganization: label(
    'Organization added to your trusted list.', 'Организация добавлена в доверенные.', 'Organización añadida a tu lista de confianza.',
    'Organisatsioon lisati usaldusloendisse.', 'Կազմակերպությունն ավելացվել է վստահելի ցանկում։'
  ),
  removedOrganization: label(
    'Organization removed from your trusted list.', 'Организация удалена из доверенных.',
    'Organización eliminada de tu lista de confianza.', 'Organisatsioon eemaldati usaldusloendist.', 'Կազմակերպությունը հեռացվել է վստահելի ցանկից։'
  ),
  requestChanged: label(
    'The request or contract has changed. Review it again.', 'Запрос или договор изменился. Проверьте его ещё раз.',
    'La solicitud o el contrato ha cambiado. Revísalo de nuevo.', 'Taotlus või leping on muutunud. Vaata see uuesti üle.',
    'Հարցումը կամ պայմանագիրը փոխվել է։ Վերանայեք այն։'
  ),
  declineContract: label(
    'The organization’s request and the attached contract will be declined.', 'Запрос организации и приложенный договор будут отклонены.',
    'Se rechazarán la solicitud de la organización y el contrato adjunto.', 'Organisatsiooni taotlus ja lisatud leping lükatakse tagasi.',
    'Կազմակերպության հարցումը և կից պայմանագիրը կմերժվեն։'
  ),
  removeContract: label(
    'This will revoke trust and close the current contract.', 'Связь с организацией будет отозвана, а действующий договор закрыт.',
    'Se revocará la relación de confianza y se cerrará el contrato actual.', 'Usaldussuhe tühistatakse ja kehtiv leping lõpetatakse.',
    'Վստահության կապը կչեղարկվի, իսկ գործող պայմանագիրը կփակվի։'
  ),
  organizationContent: label('Content from the organization', 'Материалы организации', 'Contenido de la organización', 'Organisatsiooni sisu', 'Կազմակերպության նյութերը'),
  video: label('Video', 'Видео', 'Vídeo', 'Video', 'Տեսանյութեր'),
  messages: label('Messages', 'Сообщения', 'Mensajes', 'Sõnumid', 'Հաղորդագրություններ'),
  noVideos: label('No recordings yet', 'Записей пока нет', 'Aún no hay grabaciones', 'Salvestisi veel pole', 'Դեռ ձայնագրություններ չկան'),
  noMessages: label('No messages yet', 'Сообщений пока нет', 'Aún no hay mensajes', 'Sõnumeid veel pole', 'Դեռ հաղորդագրություններ չկան'),
  openLogo: label('View organization logo', 'Посмотреть логотип организации', 'Ver el logotipo de la organización', 'Vaata organisatsiooni logo', 'Դիտել կազմակերպության լոգոն'),
  accessSummary: label(
    'Manage access in both directions.', 'Управляйте доступом в обе стороны.', 'Gestiona el acceso en ambas direcciones.',
    'Halda ligipääsu mõlemas suunas.', 'Կառավարեք հասանելիությունը երկու ուղղությամբ։'
  )
};
