import { Directive, ElementRef, Input, inject } from '@angular/core';

@Directive({
  selector: '[srcPath]',
  standalone: true,
})
export class ImageDirective {
  private elementRef = inject(ElementRef);

  @Input() public srcPath: string = '';

  private baseImagesPath = 'assets/images/';

  private readonly element = this.elementRef;

  public ngOnInit(): void {
    this.element.nativeElement.src = this.baseImagesPath + this.srcPath;
  }
}
