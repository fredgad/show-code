import { Directive, ElementRef, Input, OnInit, Signal, effect } from '@angular/core';
import { LangService } from '../../services';
import { LangEnum, LangTextI } from '../../interfaces';

@Directive({
  selector: '[orgText]',
  standalone: true,
})
export class TextDirective implements OnInit {
  public newLanguage$i: Signal<LangEnum> = this.langService.getLang$i;

  private text: LangTextI | null = null;

  @Input('orgText')
  public set orgText(text: LangTextI | null) {
    this.text = text;
    this.renderText();
  }

  constructor(private el: ElementRef, private langService: LangService) {
    effect(() => {
      this.langService.getLang$i();
      this.renderText();
    });
  }

  public ngOnInit(): void {
    this.langService.getLang$i()
    this.newLanguage$i = this.langService.getLang$i;
  }

  private renderText(): void {
    const translatedText = this.langService.resolveText(this.text);

    if (translatedText) {
      this.el.nativeElement.textContent = translatedText;
    }
  }
}
