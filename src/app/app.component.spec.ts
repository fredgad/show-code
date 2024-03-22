import { MockBuilder, MockRender } from 'ng-mocks';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { LangService } from '@shared/services';

describe('AppComponent', () => {
  beforeEach(() => {
    return MockBuilder(AppComponent)
      .keep(RouterTestingModule)
      .keep(HttpClientModule)
      .mock(LangService, {
        setStorageLanguage: jest.fn(),
      });
  });

  it(`should have as title 'msr'`, () => {
    const fixture = MockRender(AppComponent);
    const app = fixture.point.componentInstance;
    expect(app.title).toEqual('msr');
  });
});
