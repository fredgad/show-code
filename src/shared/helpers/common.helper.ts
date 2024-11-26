export const getHexColorByNumber = (value: number) => {
  let hash = 0;
  const idStr = value.toString();
  for (let i = 0; i < idStr.length; i++) {
    const char = idStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Преобразование в 32bit целое число
  }

  // Преобразуем хеш в шестнадцатеричную строку и обрезаем/дополняем до 6 символов
  let color = Math.abs(hash).toString(16).substring(0, 6);
  while (color.length < 6) {
    color += '0';
  }

  return `#${color}`;
};
