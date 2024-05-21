import { Directive, ElementRef, Input, OnInit, Signal, effect } from '@angular/core';
import { LangService } from '../../services';
import { LangEnum, LangTextI } from '../../interfaces';

@Directive({
  selector: '[orgText]',
  standalone: true,
})
export class TextDirective implements OnInit {
  public newLanguage$i: Signal<LangEnum> = this.langService.getLang$i;

  @Input('orgText') text!: LangTextI;

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
