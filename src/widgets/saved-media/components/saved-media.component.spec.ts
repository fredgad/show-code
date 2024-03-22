import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SavedMediaComponent } from '@widgets';
import { MockBuilder } from 'ng-mocks';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

describe('SavedMediaComponent', () => {
  let fixture: ComponentFixture<SavedMediaComponent>;
  let component: SavedMediaComponent;

  beforeEach(async () => {
    await MockBuilder(SavedMediaComponent)
      .keep(CommonModule)
      .keep(RouterModule)
      .mock(ActivatedRoute)

    fixture = TestBed.createComponent(SavedMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
