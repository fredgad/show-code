import { Component, ElementRef, OnDestroy, OnInit, Signal, ViewChild, WritableSignal, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '@widgets/header';
import { ImageDirective, TextDirective } from '@shared/directives';
import { AuthService, LangService, NotificationService } from '@shared/services';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'org-video-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, TextDirective, ImageDirective],
  templateUrl: './video-page.component.html',
  styleUrl: './video-page.component.scss'
})
export class VideoPageComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  private langService = inject(LangService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  private mediaRecorder?: MediaRecorder;
  private videoStream?: MediaStream;
  private videoDevices: MediaDeviceInfo[] = [];
  private currentDeviceIndex = 0;
  private recordedChunks: Blob[] = [];

  public isRecording$i: WritableSignal<boolean> = signal(false);

  public currentDeviceLabel$i: WritableSignal<string> = signal('');
  public abbrTitle$i: Signal<string> = this.langService.textByLanguage({
    ENG: 'Change camera',
    ESP: 'Cambia la cámara',
    RUS: 'Сменить камеру'
  });

  async ngOnInit(): Promise<void> {
    this.videoDevices = await this.getCameraDevices();
    if (this.videoDevices.length > 0) {
      await this.startVideo(this.videoDevices[this.currentDeviceIndex].deviceId);
    }
  }

  private async startVideo(deviceId: string): Promise<void> {
    try {
      this.videoStream?.getTracks().forEach(track => track.stop());
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: true
      });
      this.videoElement.nativeElement.srcObject = this.videoStream;
      this.currentDeviceLabel$i.set(this.videoDevices[this.currentDeviceIndex].label);
    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
    }
  }

  public switchCamera(): void {
    if (this.videoDevices.length <= 1) return;

    this.currentDeviceIndex = (this.currentDeviceIndex + 1) % this.videoDevices.length;
    this.startVideo(this.videoDevices[this.currentDeviceIndex].deviceId);
  }

  private async getCameraDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(d => d.kind === 'videoinput');
  }

  public async startRecording(): Promise<void> {
    if (!this.videoStream || this.isRecording$i()) return;

    try {
      this.recordedChunks = [];
      this.beginChunkRecording();
    } catch (error) {
      console.error('Ошибка запуска записи:', error);
    }
  }

  private beginChunkRecording(): void {
    if (!this.videoStream) return;

    try {
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.videoStream, { mimeType })
        : new MediaRecorder(this.videoStream);
    } catch (error) {
      this.notificationService.showError('Не удалось запустить запись на этом устройстве');
      console.error('Ошибка запуска MediaRecorder:', error);
      return;
    }

    this.mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onerror = event => {
      this.notificationService.showError('Во время записи произошла ошибка');
      console.error('MediaRecorder error:', event);
    };

    this.mediaRecorder.onstop = () => {
      void this.uploadRecordedVideo();
    };

    try {
      this.mediaRecorder.start(2000);
      this.isRecording$i.set(true);
      console.log('Запись начата.');
    } catch (error) {
      this.notificationService.showError('Не удалось начать запись');
      console.error('Ошибка старта записи:', error);
    }
  }

  private async uploadRecordedVideo(): Promise<void> {
    if (!this.recordedChunks.length) {
      return;
    }

    const mimeType = this.recordedChunks[0]?.type || this.mediaRecorder?.mimeType || 'video/webm';
    const blob = new Blob(this.recordedChunks, { type: mimeType });
    const formData = new FormData();
    formData.append('file', blob, `recording-${Date.now()}.${this.getBlobExtension(mimeType)}`);

    try {
      await firstValueFrom(this.authService.uploadVideo(formData));
      this.notificationService.show('Запись сохранена');
      this.recordedChunks = [];
    } catch (error) {
      this.notificationService.showError('Не удалось сохранить запись');
      console.error('Ошибка загрузки записи:', error);
    }
  }

  public async stopRecording(): Promise<void> {
    if (!this.mediaRecorder || !this.isRecording$i()) return;

    this.mediaRecorder.stop();
    this.isRecording$i.set(false);
    console.log('Запись остановлена.');
  }

  private getSupportedMimeType(): string | undefined {
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=h264,aac',
      'video/mp4'
    ];

    return mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
  }

  private getBlobExtension(mimeType: string): string {
    return mimeType.includes('mp4') ? 'mp4' : 'webm';
  }

  public ngOnDestroy(): void {
    if (this.mediaRecorder && this.isRecording$i()) {
      this.mediaRecorder.stop();
    }
    this.videoStream?.getTracks().forEach(track => track.stop());
  }
}
