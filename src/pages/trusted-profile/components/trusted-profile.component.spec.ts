import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent, FooterComponent } from '@widgets';
import { ImageDirective, TextDirective } from '@shared/directives';
import { MockBuilder } from 'ng-mocks';
import { CommonModule } from '@angular/common';
import { TrustedProfileComponent } from './trusted-profile.component';
import { ActivatedRoute, RouterModule } from '@angular/router';

describe('TrustedProfileComponent', () => {
  let fixture: ComponentFixture<TrustedProfileComponent>;
  let component: TrustedProfileComponent;

  beforeEach(() => MockBuilder(TrustedProfileComponent)
    .keep(CommonModule)
    .keep(RouterModule)
    .mock(HeaderComponent)
    .mock(FooterComponent)
    .mock(ImageDirective)
    .mock(TextDirective)
    .mock(ActivatedRoute)
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(TrustedProfileComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
