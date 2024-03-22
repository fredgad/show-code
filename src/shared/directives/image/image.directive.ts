import { Directive, ElementRef, Input, SimpleChanges} from '@angular/core';

@Directive({
  selector: '[srcPath]',
  standalone: true,
})
export class ImageDirective {
  @Input() public srcPath: string = '';

  protected baseImagesPath = 'assets/images/';

  private skeletonPath = 'skeleton-image.svg';

  private readonly element = this.elementRef;

  constructor(public elementRef: ElementRef) {
    if (elementRef.nativeElement.tagName !== 'IMG') {
      throw new Error('ImageDirective can be used only with HTML element <img>');
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['srcPath']) {
      const imageFullPath = this.srcPath ? this.baseImagesPath + this.srcPath : this.baseImagesPath + this.skeletonPath;
      this.element.nativeElement.src = imageFullPath;
    }
  }
}
