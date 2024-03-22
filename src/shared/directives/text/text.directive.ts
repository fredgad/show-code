import { Directive, ElementRef, Input, Signal, effect } from '@angular/core';
import { LangService } from '../../services';
import { LangEnum, LangTextI } from '../../interfaces';

@Directive({
  selector: '[text]',
  standalone: true,
})
export class TextDirective {
  public newLanguage$i: Signal<LangEnum> = this.langService.getLang$i;

  @Input('text') text!: LangTextI;

  constructor(private el: ElementRef, private langService: LangService) {
    effect(() => {
      this.el.nativeElement.textContent = this.text[this.langService.getLang$i()];
    });
  }

  public ngOnInit(): void {
    this.langService.getLang$i()
    this.newLanguage$i = this.langService.getLang$i;
  }
}
