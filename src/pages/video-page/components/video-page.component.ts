import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  PLATFORM_ID,
  Signal,
  ViewChild,
  WritableSignal,
  computed,
  inject,
  signal
} from '@angular/core';
import { HeaderComponent } from '@widgets/header';
import { TextDirective } from '@shared/directives';
import { LangTextI } from '@shared/interfaces';
import { LangService, RecordingUploadService } from '@shared/services';
import { firstValueFrom } from 'rxjs';

type RecorderState =
  | 'preparing'
  | 'ready'
  | 'recording'
  | 'stopping'
  | 'uploading'
  | 'saved'
  | 'camera-error'
  | 'upload-error'
  | 'unsupported';

type RecorderError = 'permission' | 'missing' | 'busy' | 'secure-context' | 'unsupported' | 'unknown' | null;
type UploadError = 'endpoint-missing' | 'network' | 'rejected' | null;

const STATE_TEXT: Record<RecorderState, LangTextI> = {
  preparing: { ENG: 'Preparing the camera', ESP: 'Preparando la cámara', RUS: 'Подготавливаем камеру' },
  ready: { ENG: 'Ready to record', ESP: 'Lista para grabar', RUS: 'Готово к записи' },
  recording: { ENG: 'Recording in progress', ESP: 'Grabación en curso', RUS: 'Идёт запись' },
  stopping: { ENG: 'Finalizing the recording', ESP: 'Finalizando la grabación', RUS: 'Завершаем запись' },
  uploading: { ENG: 'Sending to the server', ESP: 'Enviando al servidor', RUS: 'Отправляем на сервер' },
  saved: { ENG: 'Saved on the server', ESP: 'Guardada en el servidor', RUS: 'Сохранено на сервере' },
  'camera-error': { ENG: 'Camera unavailable', ESP: 'Cámara no disponible', RUS: 'Камера недоступна' },
  'upload-error': {
    ENG: 'Recording created, upload failed',
    ESP: 'Grabación creada, carga fallida',
    RUS: 'Запись создана, отправка не удалась'
  },
  unsupported: { ENG: 'Recording is not supported', ESP: 'La grabación no es compatible', RUS: 'Запись не поддерживается' }
};

const ERROR_TEXT: Record<Exclude<RecorderError, null>, LangTextI> = {
  permission: {
    ENG: 'Allow access to the camera and microphone in the browser settings.',
    ESP: 'Permite el acceso a la cámara y al micrófono en los ajustes del navegador.',
    RUS: 'Разрешите доступ к камере и микрофону в настройках браузера.'
  },
  missing: {
    ENG: 'No available camera was found on this device.',
    ESP: 'No se encontró una cámara disponible en este dispositivo.',
    RUS: 'На этом устройстве не найдена доступная камера.'
  },
  busy: {
    ENG: 'The camera is being used by another application.',
    ESP: 'Otra aplicación está utilizando la cámara.',
    RUS: 'Камера занята другим приложением.'
  },
  'secure-context': {
    ENG: 'Camera access requires HTTPS or localhost.',
    ESP: 'El acceso a la cámara requiere HTTPS o localhost.',
    RUS: 'Для доступа к камере нужен HTTPS или localhost.'
  },
  unsupported: {
    ENG: 'This browser cannot create video recordings. Try a current version of Safari, Chrome or Firefox.',
    ESP: 'Este navegador no puede crear grabaciones. Prueba una versión actual de Safari, Chrome o Firefox.',
    RUS: 'Этот браузер не умеет создавать видеозаписи. Откройте страницу в актуальном Safari, Chrome или Firefox.'
  },
  unknown: {
    ENG: 'The camera could not be started. Check its permissions and try again.',
    ESP: 'No se pudo iniciar la cámara. Comprueba los permisos e inténtalo de nuevo.',
    RUS: 'Не удалось запустить камеру. Проверьте разрешения и повторите попытку.'
  }
};

const UPLOAD_ERROR_TEXT: Record<Exclude<UploadError, null>, LangTextI> = {
  'endpoint-missing': {
    ENG: 'The server does not yet accept recordings from the web version. Save a copy to this device.',
    ESP: 'El servidor todavía no acepta grabaciones de la versión web. Guarda una copia en este dispositivo.',
    RUS: 'Сервер пока не принимает записи из веб-версии. Сохраните копию на это устройство.'
  },
  network: {
    ENG: 'The server could not be reached. The recording remains in this tab; retry when the connection returns.',
    ESP: 'No se pudo conectar con el servidor. La grabación permanece en esta pestaña; reintenta cuando vuelva la conexión.',
    RUS: 'Не удалось связаться с сервером. Запись остаётся в этой вкладке; повторите отправку после восстановления связи.'
  },
  rejected: {
    ENG: 'The server rejected the recording. It remains in this tab and can be saved to the device.',
    ESP: 'El servidor rechazó la grabación. Permanece en esta pestaña y se puede guardar en el dispositivo.',
    RUS: 'Сервер отклонил запись. Она остаётся в этой вкладке, и её можно сохранить на устройство.'
  }
};

@Component({
  selector: 'org-video-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, TextDirective],
  templateUrl: './video-page.component.html',
  styleUrl: './video-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') private videoElement?: ElementRef<HTMLVideoElement>;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly langService = inject(LangService);
  private readonly recordingUploadService = inject(RecordingUploadService);

  private mediaRecorder?: MediaRecorder;
  private mediaStream?: MediaStream;
  private videoDevices: MediaDeviceInfo[] = [];
  private currentDeviceIndex = 0;
  private recordedChunks: Blob[] = [];
  private pendingRecording?: Blob;
  private currentMimeType = 'video/webm';
  private timerId?: number;
  private recordingStartedAt = 0;
  private recorderStopped?: () => void;
  private destroyed = false;

  public readonly state$i: WritableSignal<RecorderState> = signal('preparing');
  public readonly elapsedSeconds$i = signal(0);
  public readonly cameraCount$i = signal(0);
  public readonly currentDeviceLabel$i = signal('');
  public readonly isFrontFacing$i = signal(false);
  public readonly error$i: WritableSignal<RecorderError> = signal(null);
  public readonly uploadError$i: WritableSignal<UploadError> = signal(null);

  public readonly statusText$i: Signal<string> = computed(() => this.langService.resolveText(STATE_TEXT[this.state$i()]));
  public readonly errorText$i: Signal<string> = computed(() => {
    const error = this.error$i();
    return error ? this.langService.resolveText(ERROR_TEXT[error]) : '';
  });
  public readonly timerText$i: Signal<string> = computed(() => this.formatDuration(this.elapsedSeconds$i()));
  public readonly uploadErrorText$i: Signal<string> = computed(() => {
    const error = this.uploadError$i();
    return error ? this.langService.resolveText(UPLOAD_ERROR_TEXT[error]) : '';
  });
  public readonly isRecording$i: Signal<boolean> = computed(() => this.state$i() === 'recording');
  public readonly isBusy$i: Signal<boolean> = computed(() => ['preparing', 'stopping', 'uploading'].includes(this.state$i()));
  public readonly canStart$i: Signal<boolean> = computed(() => ['ready', 'saved'].includes(this.state$i()));
  public readonly canSwitchCamera$i: Signal<boolean> = computed(
    () => this.cameraCount$i() > 1 && ['ready', 'saved'].includes(this.state$i())
  );
  public readonly hasPendingRecording$i: Signal<boolean> = computed(() => this.state$i() === 'upload-error');

  public readonly cameraFallback$i = this.langService.textByLanguage({
    ENG: 'Device camera',
    ESP: 'Cámara del dispositivo',
    RUS: 'Камера устройства'
  });

  public ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    void this.initializeCamera();
  }

  public async startRecording(): Promise<void> {
    if (!this.mediaStream || !this.canStart$i()) {
      return;
    }

    this.recordedChunks = [];
    this.pendingRecording = undefined;
    this.error$i.set(null);
    this.uploadError$i.set(null);

    try {
      const supportedMimeType = this.getSupportedMimeType();
      this.mediaRecorder = supportedMimeType
        ? new MediaRecorder(this.mediaStream, { mimeType: supportedMimeType })
        : new MediaRecorder(this.mediaStream);
      this.currentMimeType = this.mediaRecorder.mimeType || supportedMimeType || 'video/webm';

      this.mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };
      this.mediaRecorder.onerror = event => {
        console.error('MediaRecorder error:', event);
        if (this.state$i() === 'recording') {
          void this.stopRecording();
        }
      };
      this.mediaRecorder.onstop = () => {
        this.recorderStopped?.();
        this.recorderStopped = undefined;
      };

      this.mediaRecorder.start(1000);
      this.state$i.set('recording');
      this.startTimer();
    } catch (error) {
      console.error('Unable to start MediaRecorder:', error);
      this.state$i.set('unsupported');
      this.error$i.set('unsupported');
    }
  }

  public async stopRecording(): Promise<void> {
    const recorder = this.mediaRecorder;
    if (!recorder || recorder.state === 'inactive' || !this.isRecording$i()) {
      return;
    }

    this.state$i.set('stopping');
    this.stopTimer();

    await new Promise<void>(resolve => {
      this.recorderStopped = resolve;
      try {
        recorder.requestData();
      } catch {
        // Some Safari versions flush the final data only from stop().
      }
      recorder.stop();
    });

    this.mediaRecorder = undefined;
    const mimeType = this.recordedChunks.find(chunk => chunk.type)?.type || this.currentMimeType;
    const recording = new Blob(this.recordedChunks, { type: mimeType });
    this.recordedChunks = [];

    if (!recording.size) {
      this.state$i.set('camera-error');
      this.error$i.set('unknown');
      return;
    }

    this.pendingRecording = recording;
    await this.uploadPendingRecording();
  }

  public async retryUpload(): Promise<void> {
    if (!this.pendingRecording || this.state$i() !== 'upload-error') {
      return;
    }

    await this.uploadPendingRecording();
  }

  public discardPendingRecording(): void {
    this.pendingRecording = undefined;
    this.uploadError$i.set(null);
    this.state$i.set('ready');
  }

  public downloadPendingRecording(): void {
    if (!this.pendingRecording || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const objectUrl = URL.createObjectURL(this.pendingRecording);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = this.createFileName(this.pendingRecording.type);
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }

  public async switchCamera(): Promise<void> {
    if (!this.canSwitchCamera$i()) {
      return;
    }

    this.currentDeviceIndex = (this.currentDeviceIndex + 1) % this.videoDevices.length;
    await this.initializeCamera(this.videoDevices[this.currentDeviceIndex].deviceId);
  }

  public async retryCamera(): Promise<void> {
    await this.initializeCamera();
  }

  public canDeactivate(): boolean {
    if (!this.hasUnsavedWork || !isPlatformBrowser(this.platformId)) {
      return true;
    }

    return window.confirm(
      this.langService.resolveText({
        ENG: 'The recording has not been sent yet. Leave this page and lose it?',
        ESP: 'La grabación aún no se ha enviado. ¿Salir de esta página y perderla?',
        RUS: 'Запись ещё не отправлена. Покинуть страницу и потерять её?'
      })
    );
  }

  @HostListener('window:beforeunload', ['$event'])
  public preventUnsafeExit(event: BeforeUnloadEvent): void {
    if (!this.hasUnsavedWork) {
      return;
    }

    event.preventDefault();
    event.returnValue = '';
  }

  public ngOnDestroy(): void {
    this.destroyed = true;
    this.stopTimer();
    this.recorderStopped?.();
    this.recorderStopped = undefined;

    if (this.mediaRecorder?.state !== 'inactive') {
      this.mediaRecorder?.stop();
    }

    this.stopMediaStream();
  }

  private async initializeCamera(deviceId?: string): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.destroyed) {
      return;
    }

    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      this.state$i.set('camera-error');
      this.error$i.set('secure-context');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      this.state$i.set('unsupported');
      this.error$i.set('unsupported');
      return;
    }

    this.state$i.set('preparing');
    this.error$i.set(null);
    this.stopMediaStream();

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });

      if (this.destroyed) {
        this.stopMediaStream();
        return;
      }

      const video = this.videoElement?.nativeElement;
      if (video) {
        // The preview must never receive the microphone track, otherwise some
        // browsers can route captured audio back to the device speakers.
        video.srcObject = new MediaStream(this.mediaStream.getVideoTracks());
        video.defaultMuted = true;
        video.muted = true;
        video.volume = 0;
        await video.play().catch(() => undefined);
      }

      await this.refreshVideoDevices();
      const track = this.mediaStream.getVideoTracks()[0];
      const settings = track?.getSettings();
      const activeDeviceIndex = this.videoDevices.findIndex(camera => camera.deviceId === settings?.deviceId);
      if (activeDeviceIndex >= 0) {
        this.currentDeviceIndex = activeDeviceIndex;
      }

      this.currentDeviceLabel$i.set(track?.label || this.cameraFallback$i());
      this.isFrontFacing$i.set(settings?.facingMode === 'user');
      this.state$i.set('ready');
    } catch (error) {
      console.error('Unable to initialize camera:', error);
      this.stopMediaStream();
      this.state$i.set('camera-error');
      this.error$i.set(this.resolveCameraError(error));
    }
  }

  private async refreshVideoDevices(): Promise<void> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    this.videoDevices = devices.filter(device => device.kind === 'videoinput');
    this.cameraCount$i.set(this.videoDevices.length);
  }

  private async uploadPendingRecording(): Promise<void> {
    const recording = this.pendingRecording;
    if (!recording) {
      return;
    }

    this.state$i.set('uploading');
    this.uploadError$i.set(null);

    try {
      await firstValueFrom(this.recordingUploadService.upload(recording, this.createFileName(recording.type)));
      this.pendingRecording = undefined;
      this.state$i.set('saved');
    } catch (error) {
      console.error('Recording upload failed:', error);
      this.uploadError$i.set(this.resolveUploadError(error));
      this.state$i.set('upload-error');
    }
  }

  private startTimer(): void {
    this.stopTimer();
    this.elapsedSeconds$i.set(0);
    this.recordingStartedAt = Date.now();
    this.timerId = window.setInterval(() => {
      this.elapsedSeconds$i.set(Math.floor((Date.now() - this.recordingStartedAt) / 1000));
    }, 250);
  }

  private stopTimer(): void {
    if (this.timerId !== undefined && isPlatformBrowser(this.platformId)) {
      window.clearInterval(this.timerId);
    }
    this.timerId = undefined;
  }

  private stopMediaStream(): void {
    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.mediaStream = undefined;
    const video = this.videoElement?.nativeElement;
    if (video) {
      video.srcObject = null;
    }
  }

  private getSupportedMimeType(): string | undefined {
    const mimeTypes = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];

    return mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
  }

  private createFileName(mimeType: string): string {
    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
    return `e-stream-${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`;
  }

  private resolveCameraError(error: unknown): Exclude<RecorderError, null> {
    if (!(error instanceof DOMException)) {
      return 'unknown';
    }

    switch (error.name) {
      case 'NotAllowedError':
      case 'SecurityError':
        return 'permission';
      case 'NotFoundError':
      case 'OverconstrainedError':
        return 'missing';
      case 'NotReadableError':
      case 'AbortError':
        return 'busy';
      default:
        return 'unknown';
    }
  }

  private resolveUploadError(error: unknown): Exclude<UploadError, null> {
    if (!(error instanceof HttpErrorResponse)) {
      return 'rejected';
    }

    if (error.status === 0) {
      return 'network';
    }

    return error.status === 404 ? 'endpoint-missing' : 'rejected';
  }

  private formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [minutes, seconds].map(value => value.toString().padStart(2, '0'));

    return hours > 0 ? `${hours.toString().padStart(2, '0')}:${parts.join(':')}` : parts.join(':');
  }

  private get hasUnsavedWork(): boolean {
    return ['recording', 'stopping', 'uploading', 'upload-error'].includes(this.state$i());
  }
}
