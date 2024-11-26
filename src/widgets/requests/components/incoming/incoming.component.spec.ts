import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { IncomingComponent } from './incoming.component';
import { AudioComponent } from '@features/audio';

describe('AudioBlockComponent', () => {
  let component: IncomingComponent;
  let fixture: ComponentFixture<IncomingComponent>;

  beforeEach(async () => {
    await MockBuilder(IncomingComponent).mock(AudioComponent);

    fixture = TestBed.createComponent(IncomingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
