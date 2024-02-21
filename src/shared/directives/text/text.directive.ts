import { Directive, ElementRef, Input, Signal, SimpleChanges, effect, inject } from '@angular/core';
import { LangService } from '../../services';
import { LangEnum, LangTextI } from '../../interfaces';

@Directive({
  selector: '[text]',
  standalone: true,
})
export class TextDirective {
  private langService = inject(LangService);
  private el = inject(ElementRef);

  public newLanguage$i: Signal<LangEnum> = this.langService.getLang$i;

  @Input('text') text!: LangTextI;

  constructor() {
    effect(() => {
      this.el.nativeElement.textContent = this.text[this.langService.getLang$i()];
    });
  }

  public ngOnInit(): void {
    this.langService.getLang$i()
    this.newLanguage$i = this.langService.getLang$i;
  }
}
