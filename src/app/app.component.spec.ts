import { MockBuilder, MockRender, ngMocks } from 'ng-mocks';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture } from '@angular/core/testing';
import { LangService } from '@shared/services';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockLangService: jest.Mocked<Partial<LangService>>

  beforeEach(async () => {
    await MockBuilder(AppComponent)
      .keep(RouterTestingModule)
      .keep(HttpClientModule)
      .mock(LangService, {
        setStorageLanguage: jest.fn(),
      });

    fixture = MockRender(AppComponent);
    component = fixture.componentInstance;
    mockLangService = ngMocks.get(LangService);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });


  it('should call setStorageLanguage on ngOnInit', () => {
    component.ngOnInit();
    expect(mockLangService.setStorageLanguage).toHaveBeenCalled();
  });
});
