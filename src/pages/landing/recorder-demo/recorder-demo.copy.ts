import { LangEnum } from '@shared/interfaces';

export interface RecorderDemoCopy {
  home: string;
  holdSos: string;
  preset: string;
  onlyMe: string;
  recipient: string;
  immediate: string;
  settings: string;
  preview: string;
  starting: string;
  addPreset: string;
}

export const RECORDER_DEMO_COPY: Record<LangEnum, RecorderDemoCopy> = {
  [LangEnum.RUS]: {
    home: 'Главная',
    holdSos: 'Удерживайте SOS 1 секунду',
    preset: 'Проверяемая запись',
    onlyMe: 'Только мне',
    recipient: 'Получателей: 1',
    immediate: 'Сразу',
    settings: 'Настройки записи',
    preview: 'Превью',
    starting: 'Запуск трансляции…',
    addPreset: 'Добавить кнопку'
  },
  [LangEnum.ENG]: {
    home: 'Main',
    holdSos: 'Hold SOS for 1 second',
    preset: 'Verifiable recording',
    onlyMe: 'Only me',
    recipient: 'Recipients: 1',
    immediate: 'Right away',
    settings: 'Recording settings',
    preview: 'Preview',
    starting: 'Starting stream…',
    addPreset: 'Add button'
  },
  [LangEnum.ESP]: {
    home: 'Inicio',
    holdSos: 'Mantén pulsado SOS 1 segundo',
    preset: 'Grabación verificable',
    onlyMe: 'Solo para mí',
    recipient: 'Destinatarios: 1',
    immediate: 'De inmediato',
    settings: 'Ajustes de grabación',
    preview: 'Vista previa',
    starting: 'Iniciando transmisión…',
    addPreset: 'Añadir botón'
  },
  [LangEnum.EST]: {
    home: 'Avaleht',
    holdSos: 'Hoia SOS-nuppu 1 sekund',
    preset: 'Tõendatav salvestis',
    onlyMe: 'Ainult mina',
    recipient: 'Saajaid: 1',
    immediate: 'Kohe',
    settings: 'Salvestamise seaded',
    preview: 'Eelvaade',
    starting: 'Ülekande käivitamine…',
    addPreset: 'Lisa nupp'
  },
  [LangEnum.ARM]: {
    home: 'Գլխավոր',
    holdSos: 'Սեղմած պահեք SOS-ը 1 վայրկյան',
    preset: 'Ստուգելի ձայնագրություն',
    onlyMe: 'Միայն ես',
    recipient: 'Ստացողներ՝ 1',
    immediate: 'Անմիջապես',
    settings: 'Ձայնագրման կարգավորումներ',
    preview: 'Նախադիտում',
    starting: 'Հեռարձակումը մեկնարկում է…',
    addPreset: 'Ավելացնել կոճակ'
  }
};
