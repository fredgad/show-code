import { Component, ElementRef } from '@angular/core';
import { ImageDirective } from './image.directive';
import { ComponentFixture, TestBed } from '@angular/core/testing';


@Component({
  template: `<img [srcPath]="testPath"/>`
})
class TestHostComponent {
  testPath: string = 'initial/path';
}

describe('ImageDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TestHostComponent]
    })
  })

  it('should create an instance', () => {
    const elementRefMock: ElementRef = new ElementRef(null);
    const directive = new ImageDirective(elementRefMock);
    expect(directive).toBeTruthy();
  });
});
