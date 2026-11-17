import { LangTextI } from '@shared/interfaces';

export const vaultSaveText = {
  saveRecording: { ENG: "Save to storage", RUS: "Сохранить в хранилище", ESP: "Guardar en almacenamiento", EST: "Salvesta hoidlasse", ARM: "Պահել պահոցում" },
  saveDone: { ENG: "Video saved to storage", RUS: "Видео сохранено в хранилище", ESP: "Video guardado en el almacenamiento", EST: "Video salvestati hoidlasse", ARM: "Տեսանյութը պահված է պահոցում" },
  saveError: { ENG: "Failed to save the video", RUS: "Не удалось сохранить видео", ESP: "No se pudo guardar el video", EST: "Videot ei õnnestunud salvestada", ARM: "Չհաջողվեց պահել տեսանյութը" },
  quota: { ENG: "There is not enough free storage space", RUS: "В хранилище недостаточно свободного места", ESP: "No hay suficiente espacio libre", EST: "Vaba salvestusruumi pole piisavalt", ARM: "Պահոցում բավարար ազատ տարածք չկա" },
} satisfies Record<string, LangTextI>;
