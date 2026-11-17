import translations from '../../../assets/lang/hy-inline.json';

const dictionary: Record<string, string> = translations;

export const resolveArmenianInlineText = (english: string): string => {
  const direct = dictionary[english];
  if (direct !== undefined) return direct;

  const minimum = english.match(/^Minimum length should be (\d+) characters\. You entered (\d+)\.$/);
  if (minimum) return `Նվազագույն երկարությունը ${minimum[1]} նիշ է։ Մուտքագրել եք ${minimum[2]}։`;

  const maximum = english.match(/^Maximum length should be (\d+) characters\. You entered (\d+)\.$/);
  if (maximum) return `Առավելագույն երկարությունը ${maximum[1]} նիշ է։ Մուտքագրել եք ${maximum[2]}։`;

  const trustedAdd = english.match(/^Do you really want to add a trusted user (.+) \?$/);
  if (trustedAdd) return `Վստա՞հ եք, որ ցանկանում եք ավելացնել ${trustedAdd[1]} վստահելի օգտատիրոջը։`;

  const trustedReject = english.match(/^Do you really want to reject the request to add a trusted user (.+) \?$/);
  if (trustedReject) return `Վստա՞հ եք, որ ցանկանում եք մերժել ${trustedReject[1]} օգտատիրոջ վստահության հայտը։`;

  const trustedCancel = english.match(/^Do you really want to cancel the request to add a trusted user (.+) \?$/);
  if (trustedCancel) return `Վստա՞հ եք, որ ցանկանում եք չեղարկել ${trustedCancel[1]} օգտատիրոջ վստահության հայտը։`;

  const legacyCancel = english.match(/^Are you sure you want to cancel your for (.+)\?$/);
  if (legacyCancel) return `Վստա՞հ եք, որ ցանկանում եք չեղարկել ${legacyCancel[1]}-ի հայտը։`;

  return english;
};
