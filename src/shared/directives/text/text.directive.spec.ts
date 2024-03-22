import { TextDirective } from './text.directive';
import { Component, DebugElement, ElementRef, Signal } from '@angular/core';
import { LangService } from '../../services';
import { LangEnum } from '../../interfaces';
import { MockBuilder } from 'ng-mocks';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SIGNAL } from '@angular/core/primitives/signals';

@Component({
  template: `<div [text]="{ENG: 'Hello', ESP: 'Hola', RUS: 'Привет'}"></div>`
})
class TestHostComponent {
}

describe('TextDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let el: DebugElement;
  

  beforeEach(async () => {
    await MockBuilder(TestHostComponent)
      .mock(TextDirective)
      .mock(ElementRef, { nativeElement: document.createElement('div') })
      .mock(LangService, {
        getLang$i: (() => {
          const signalFn = () => LangEnum.ENG;
          return signalFn as unknown as Signal<LangEnum>;
        })()
      })
      
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    el = fixture.debugElement.query(By.directive(TextDirective));
  });

  it('should init', () => {
    expect(el).not.toBeNull();
  });
});
