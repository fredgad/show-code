import { Directive, ElementRef, Input, SimpleChanges, inject } from '@angular/core';

@Directive({
  selector: '[srcPath]',
  standalone: true,
})
export class ImageDirective {
  @Input() public srcPath: string = '';

  private baseImagesPath = 'assets/images/';

  private readonly element = this.elementRef;

  constructor(public elementRef: ElementRef) {
    if (elementRef.nativeElement.tagName !== 'IMG') {
      throw new Error('ImageDirective can be used only with HTML element <img>');
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['srcPath']) {
      this.element.nativeElement.src = this.baseImagesPath + this.srcPath;
    }
  }
}
