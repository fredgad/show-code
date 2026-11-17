import { LangEnum, LangTextI } from '@shared/interfaces';

const label = (ENG: string, RUS: string, ESP: string, EST: string, ARM: string): LangTextI => ({ ENG, RUS, ESP, EST, ARM });

export const TRUST_ACCESS_TEXT = {
  settings: label('Access settings', 'Настройки доступа', 'Ajustes de acceso', 'Juurdepääsu seaded', 'Հասանելիության կարգավորումներ'),
  myData: label('Your data for this contact', 'Ваши данные для контакта', 'Tus datos para este contacto', 'Sinu andmed kontaktile', 'Ձեր տվյալները կոնտակտին'),
  theirData: label('This contact’s data for you', 'Данные контакта для вас', 'Datos del contacto para ti', 'Kontakti andmed sulle', 'Կոնտակտի տվյալները ձեզ համար'),
  organizationData: label('Messages from the organization', 'Сообщения организации', 'Mensajes de la organización', 'Organisatsiooni sõnumid', 'Կազմակերպության հաղորդագրությունները'),
  accessOpen: label('Available', 'Доступно', 'Disponible', 'Saadaval', 'Հասանելի է'),
  accessClosed: label('Restricted', 'Доступ ограничен', 'Acceso restringido', 'Juurdepääs piiratud', 'Հասանելիությունը սահմանափակ է'),
  unknown: label('Access could not be confirmed.', 'Не удалось подтвердить доступ.', 'No se pudo confirmar el acceso.', 'Juurdepääsu ei õnnestunud kinnitada.', 'Չհաջողվեց հաստատել հասանելիությունը։'),
  pausedByMe: label('You paused sharing.', 'Вы приостановили доступ к своим данным.', 'Has pausado el acceso a tus datos.', 'Peatasid ligipääsu oma andmetele.', 'Դուք դադարեցրել եք ձեր տվյալների հասանելիությունը։'),
  pausedByPeer: label('This contact paused sharing.', 'Контакт закрыл доступ к своим данным.', 'El contacto ha pausado el acceso a sus datos.', 'Kontakt peatas ligipääsu oma andmetele.', 'Կոնտակտը դադարեցրել է իր տվյալների հասանելիությունը։'),
  tariffPaused: label('Your plan limit has suspended access in both directions.', 'Из-за лимита вашего тарифа доступ приостановлен в обе стороны.', 'El límite de tu plan ha suspendido el acceso en ambos sentidos.', 'Sinu paketi piirang peatas ligipääsu mõlemas suunas.', 'Ձեր սակագնի սահմանաչափը դադարեցրել է հասանելիությունը երկու ուղղությամբ։'),
  peerTariff: label('The contact’s plan limit has suspended access in both directions.', 'Из-за тарифа контакта доступ приостановлен в обе стороны.', 'El límite del plan del contacto ha suspendido el acceso en ambos sentidos.', 'Kontakti paketi piirang peatas ligipääsu mõlemas suunas.', 'Կոնտակտի սակագինը դադարեցրել է հասանելիությունը երկու ուղղությամբ։'),
  peerGrace: label('The contact is in a grace period after a plan downgrade.', 'У контакта действует льготный период после снижения тарифа.', 'El contacto está en periodo de gracia tras bajar de plan.', 'Kontaktil kehtib pärast paketi muutust ajapikendus.', 'Կոնտակտի սակագնի իջեցումից հետո գործում է արտոնյալ ժամկետ։'),
  reservesSlot: label('This paused contact reserves a place.', 'За контактом зарезервировано место.', 'Este contacto en pausa conserva una plaza.', 'Peatatud kontaktile on koht reserveeritud.', 'Կոնտակտի համար տեղ է պահված։'),
  noSlot: label('Manually paused without a place.', 'Ручная пауза без занятого места.', 'Pausa manual sin plaza.', 'Käsitsi peatatud ilma kohata.', 'Ձեռքով դադարեցված է առանց տեղի։'),
  grace: label('Grace period', 'Льготный период', 'Periodo de gracia', 'Ajapikendus', 'Արտոնյալ ժամկետ'),
  deadline: label('Suspension on {date}', 'Приостановка по тарифу {date}', 'Suspensión el {date}', 'Peatamine {date}', 'Դադարեցում՝ {date}'),
  pause: label('Pause access', 'Приостановить доступ', 'Pausar acceso', 'Peata ligipääs', 'Դադարեցնել հասանելիությունը'),
  resume: label('Resume access', 'Возобновить доступ', 'Reanudar acceso', 'Taasta ligipääs', 'Վերականգնել հասանելիությունը'),
  pauseConfirm: label('Confirm the pause for {name}. It restricts access to your data. Any tariff deadline keeps running.', 'Подтвердите паузу для контакта «{name}». Доступ к вашим данным закроется. Срок по тарифу продолжит действовать.', 'Confirma la pausa para {name}. Se restringirá el acceso a tus datos y seguirá corriendo el plazo del plan.', 'Kinnita paus kontaktile {name}. Ligipääs sinu andmetele suletakse ja paketi tähtaeg jääb jõusse.', 'Հաստատեք դադարը {name}-ի համար։ Ձեր տվյալների հասանելիությունը կսահմանափակվի։ Սակագնի ժամկետը կշարունակի գործել։'),
  transfer: label('Transfer a place', 'Передать место', 'Transferir plaza', 'Anna koht üle', 'Փոխանցել տեղը'),
  donor: label('Transfer from', 'Передать место от', 'Transferir desde', 'Anna koht üle kontaktilt', 'Փոխանցել տեղը հետևյալից'),
  transferConfirm: label('{from} will be suspended by the plan. {to} will receive the place.', 'Для контакта «{from}» вступит в силу ограничение тарифа. Место получит «{to}».', '{from} quedará suspendido por el plan. {to} recibirá la plaza.', '{from} peatatakse paketi alusel. {to} saab koha.', '{from}-ի կապը կդադարեցվի սակագնով։ {to}-ն կստանա տեղը։'),
  updated: label('Access updated.', 'Доступ обновлён.', 'Acceso actualizado.', 'Ligipääs uuendatud.', 'Հասանելիությունը թարմացվել է։'),
  policyConflict: label('Access has changed. Refresh the settings and try again.', 'Условия доступа изменились. Обновите настройки и повторите действие.', 'El acceso ha cambiado. Actualiza los ajustes e inténtalo de nuevo.', 'Ligipääs on muutunud. Värskenda seadeid ja proovi uuesti.', 'Հասանելիությունը փոխվել է։ Թարմացրեք կարգավորումները և փորձեք կրկին։'),
  allocation: label('Distribute places', 'Распределить места', 'Distribuir plazas', 'Jaga kohad', 'Բաշխել տեղերը'),
  allocationIntro: label('Choose who keeps a place in your plan. The next step shows where each existing deadline will go.', 'Выберите, кому оставить места по тарифу. На следующем шаге увидите, к кому перейдёт каждый действующий срок.', 'Elige quién conserva una plaza. El siguiente paso muestra a quién pasará cada plazo vigente.', 'Vali, kellele koht jääb. Järgmisel sammul näed, kellele iga kehtiv tähtaeg läheb.', 'Ընտրեք, թե ով կպահպանի տեղը։ Հաջորդ քայլում կտեսնեք, թե ում կանցնի յուրաքանչյուր գործող ժամկետ։'),
  allocationSummary: label('{selected} of {required} places selected · {grace} timed', 'Выбрано {selected} из {required} мест · с таймером {grace}', '{selected} de {required} plazas elegidas · {grace} con plazo', 'Valitud {selected} / {required} kohta · tähtajaga {grace}', 'Ընտրված է {selected} տեղ {required}-ից · {grace} ժամկետով'),
  occupied: label('{used} of {limit} places taken', 'Занято {used} из {limit} мест', '{used} de {limit} plazas ocupadas', 'Hõivatud {used} / {limit} kohta', 'Զբաղված է {used} տեղ {limit}-ից'),
  remaining: label('Time remaining {time}', 'Осталось {time}', 'Queda {time}', 'Jäänud {time}', 'Մնացել է {time}'),
  noGrace: label('There are no contacts in a grace period.', 'Сейчас нет контактов в льготном периоде.', 'No hay contactos en periodo de gracia.', 'Ajapikendusega kontakte ei ole.', 'Արտոնյալ ժամկետով կոնտակտներ չկան։'),
  allocationStale: label('The plan, contacts or deadlines have changed. Refresh to check the current selection.', 'Тариф, связи или сроки изменились. Обновите список перед сохранением.', 'Han cambiado el plan, los contactos o los plazos. Actualiza antes de guardar.', 'Pakett, kontaktid või tähtajad on muutunud. Värskenda enne salvestamist.', 'Սակագինը, կապերը կամ ժամկետները փոխվել են։ Պահելուց առաջ թարմացրեք ցանկը։'),
  allocationError: label('Could not confirm the operation. Refresh to check the saved state.', 'Не удалось подтвердить операцию. Обновите список, чтобы проверить сохранённое состояние.', 'No se pudo confirmar la operación. Actualiza para comprobar el estado guardado.', 'Toimingut ei õnnestunud kinnitada. Värskenda salvestatud oleku kontrollimiseks.', 'Չհաջողվեց հաստատել գործողությունը։ Թարմացրեք ցանկը՝ պահված վիճակը ստուգելու համար։'),
  person: label('Person', 'Человек', 'Persona', 'Inimene', 'Մարդ'),
  organization: label('Organization', 'Организация', 'Organización', 'Organisatsioon', 'Կազմակերպություն'),
  selectedSlot: label('Keeps a place', 'Сохраняет место', 'Conserva una plaza', 'Säilitab koha', 'Պահպանում է տեղը'),
  awaitingDeadline: label('Deadline shown in the preview', 'Срок появится в предпросмотре', 'El plazo se muestra en la vista previa', 'Tähtaeg kuvatakse eelvaates', 'Ժամկետը կերևա նախադիտման մեջ'),
  excludedSlot: label('Outside this selection', 'Вне распределения мест', 'Fuera de esta selección', 'Väljaspool valikut', 'Այս ընտրությունից դուրս'),
  review: label('Review changes', 'Посмотреть изменения', 'Ver cambios', 'Vaata muudatusi', 'Դիտել փոփոխությունները'),
  reviewHeading: label('Deadline changes', 'Перенос сроков', 'Cambios de plazo', 'Tähtaegade muutused', 'Ժամկետների փոխանցում'),
  deadlineTransfer: label('{from} → {to}. Suspension on {date}.', '{from} → {to}. Приостановка {date}.', '{from} → {to}. Suspensión el {date}.', '{from} → {to}. Peatamine {date}.', '{from} → {to}։ Դադարեցում՝ {date}։'),
  edit: label('Edit selection', 'Изменить выбор', 'Cambiar la selección', 'Muuda valikut', 'Փոխել ընտրությունը'),
  save: label('Save distribution', 'Сохранить распределение', 'Guardar distribución', 'Salvesta jaotus', 'Պահել բաշխումը'),
  saved: label('Distribution saved.', 'Распределение сохранено.', 'Distribución guardada.', 'Jaotus salvestatud.', 'Բաշխումը պահված է։'),
  confirm: label('Confirm', 'Подтвердить', 'Confirmar', 'Kinnita', 'Հաստատել')
};

const locales = { ENG: 'en', RUS: 'ru', ESP: 'es', EST: 'et', ARM: 'hy' } satisfies Record<LangEnum, string>;

export function trustDate(value: string, language: LangEnum): string {
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) return '—';
  return new Intl.DateTimeFormat(locales[language], { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function trustTimeLeft(deadline: string, now: number, language: LangEnum): string {
  const remaining = Math.max(0, Math.ceil((Date.parse(deadline) - now) / 1000));
  if (!Number.isFinite(remaining)) return '—';
  const days = Math.floor(remaining / 86400);
  const clock = [Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60]
    .map(part => String(part).padStart(2, '0')).join(':');
  if (!days) return clock;
  const label = new Intl.NumberFormat(locales[language], { style: 'unit', unit: 'day', unitDisplay: 'short' }).format(days);
  return `${label} ${clock}`;
}
