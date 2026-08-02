import { FormGroup } from "@angular/forms";
import { LangEnum, LangTextI } from "../interfaces";

const userNameField: LangTextI = {
  ENG: 'This field is required.',
  ESP: 'Este campo es obligatorio.',
  RUS: 'Это поле обязательно.',
  EST: 'See väli on kohustuslik.'
}

const emailField: LangTextI = {
  ENG: 'Please enter a valid email address.',
  ESP: 'Introduce una dirección de correo electrónico válida.',
  RUS: 'Пожалуйста введите корректный email.',
  EST: 'Sisestage kehtiv e-posti aadress.'
}

export const isValidFormControl = (controlName: string, form: FormGroup, submited: boolean = false): boolean => {
  const control = form.get(controlName);
  return ((control?.invalid && submited) || (control?.invalid && control?.touched)) as boolean;
}

export const getFormControlErrorMessage = (controlName: string, form: FormGroup, lang: LangEnum): string | null => {
  const control = form.get(controlName);

  if (control?.errors) {
    if (control.errors['required']) {
      return userNameField[lang] ?? userNameField[LangEnum.ENG];
    }
    if (control.errors['email']) {
      return emailField[lang] ?? emailField[LangEnum.ENG];
    }
    if (control.errors['minlength']) {
      const requiredLength = control.errors['minlength'].requiredLength;
      const actualLength = control.errors['minlength'].actualLength;
      return minLengthField(requiredLength, actualLength, lang);
    }
    if (control.errors['maxlength']) {
      const requiredLength = control.errors['maxlength'].requiredLength;
      const actualLength = control.errors['maxlength'].actualLength;
      return maxLengthField(requiredLength, actualLength, lang);;
    }
  }

  return null;
}

const minLengthField = (requiredLength: number, actualLength: number, lang: LangEnum): string => {
  const passArray: LangTextI = {
    ENG: `Minimum length should be ${requiredLength} characters. You entered ${actualLength}.`,
    ESP: `La longitud mínima debe ser de ${requiredLength} caracteres. Has introducido ${actualLength}.`,
    RUS: `Минимальная длина должна быть ${requiredLength} символов. Вы ввели ${actualLength}.`,
    EST: `Minimaalne pikkus peab olema ${requiredLength} märki. Sisestasite ${actualLength}.`
  };
  return passArray[lang] ?? passArray[LangEnum.ENG];
};

const maxLengthField = (requiredLength: number, actualLength: number, lang: LangEnum): string => {
  const passArray: LangTextI = {
    ENG: `Maximum length should be ${requiredLength} characters. You entered ${actualLength}.`,
    ESP: `La longitud máxima debe ser de ${requiredLength} caracteres. Has introducido ${actualLength}.`,
    RUS: `Максимальная длина должна быть ${requiredLength} символов. Вы ввели ${actualLength}.`,
    EST: `Maksimaalne pikkus peab olema ${requiredLength} märki. Sisestasite ${actualLength}.`
  };
  return passArray[lang] ?? passArray[LangEnum.ENG];
};
