import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { OutgoingComponent } from './outgoing.component';
import { AudioComponent } from '@features/audio';

describe('AudioBlockComponent', () => {
  let component: OutgoingComponent;
  let fixture: ComponentFixture<OutgoingComponent>;

  beforeEach(async () => {
    await MockBuilder(OutgoingComponent).mock(AudioComponent);

    fixture = TestBed.createComponent(OutgoingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
