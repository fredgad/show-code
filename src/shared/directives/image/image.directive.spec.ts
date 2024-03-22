import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageDirective } from './image.directive';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MockBuilder } from 'ng-mocks';

@Component({
  template: `<img src="test.jpg" [srcPath]="componentPath">`
})
class TestHostComponent {
  componentPath: string = 'initial/path';
}

describe('ImageDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  let imgElement: HTMLImageElement;
  let imgDebugElement: DebugElement;
  let directiveInstance: ImageDirective;

  beforeEach(async () => {
    await MockBuilder(TestHostComponent)
      .keep(ImageDirective);

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    imgElement = fixture.nativeElement.querySelector('img');

    fixture.detectChanges();

    imgDebugElement = fixture.debugElement.query(By.directive(ImageDirective));
    directiveInstance = imgDebugElement.injector.get(ImageDirective);
  });

  it('should create an instance of img', () => {
    expect(imgElement).not.toBeNull();
    expect(imgElement.tagName).toEqual('IMG');
  });

  it('should update img src attribute with the value provided in [srcPath]', () => {
    const baseImagesPath = directiveInstance['baseImagesPath'];
    expect(imgElement.src).toContain(baseImagesPath + component.componentPath);

    const updatedPath = baseImagesPath + 'updated/path';
    component.componentPath = updatedPath;
    fixture.detectChanges();
    expect(imgElement.src).toContain(updatedPath);
  });
});