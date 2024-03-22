import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrustedPeopleComponent } from '@widgets';
import { ImageDirective, TextDirective } from '@shared/directives';
import { MockBuilder } from 'ng-mocks';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CheckboxComponent, DeleteButtonComponent, EmptyAvatarComponent } from '@features';

describe('TrustedPeopleComponent', () => {
  let fixture: ComponentFixture<TrustedPeopleComponent>;
  let component: TrustedPeopleComponent;

  beforeEach(() => MockBuilder(TrustedPeopleComponent)
  .keep(CommonModule)
  .keep(RouterModule)
  .mock(CheckboxComponent)
  .mock(DeleteButtonComponent)
  .mock(EmptyAvatarComponent)
  .mock(ImageDirective)
  .mock(TextDirective)
  .mock(ActivatedRoute)
);

  beforeEach(() => {
    fixture = TestBed.createComponent(TrustedPeopleComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
