import { Component, ElementRef, OnDestroy, OnInit, Signal, ViewChild, WritableSignal, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '@widgets/header';
import { ImageDirective, TextDirective } from '@shared/directives';
import { LangService } from '@shared/services';
import { HttpClient } from '@angular/common/http';
import { AppStoreEffects, AppStoreFacade } from '@store';

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
  private facade = inject(AppStoreFacade);

  private http = inject(HttpClient);

  private recordedChunks: BlobPart[] = [];
  private mediaRecorder!: MediaRecorder;
  private videoStream!: MediaStream;
  private videoDevices: MediaDeviceInfo[] = [];
  private currentDeviceId: string | undefined;
  private currentDeviceIndex: number = 0;
  public isRecording = false;

  // public recordingTime$i: WritableSignal<string | undefined> = signal('00:00:00');
  public currentDeviceLabel$i: WritableSignal<string | undefined> = signal('');
  public abbrTitle$i: Signal<string> = this.langService.textByLanguage({
    ENG: 'Change camera',
    ESP: 'Cambia la cámara',
    RUS: 'Сменить камеру'
  });

  public async ngOnInit(): Promise<void> {
    // Получаем список камер и запускаем первую камеру
    this.videoDevices = await this.getCameraDevices();
    if (this.videoDevices.length > 0) {
      await this.startVideo(this.videoDevices[this.currentDeviceIndex].deviceId);
    }
  }

  private async startVideo(deviceId: string): Promise<void> {
    try {
      this.videoStream?.getTracks().forEach(track => track.stop()); // Останавливаем предыдущий поток
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: true
      });
      this.videoElement.nativeElement.srcObject = this.videoStream;
      this.currentDeviceLabel$i.set(this.videoDevices[this.currentDeviceIndex].label);
    } catch (error) {
      console.error('Ошибка при попытке получить доступ к камере:', error);
    }
  }

  public switchCamera(): void {
    if (this.videoDevices.length <= 1) {
      console.warn('Доступна только одна камера.');
      return;
    }

    this.currentDeviceIndex = (this.currentDeviceIndex + 1) % this.videoDevices.length;
    this.startVideo(this.videoDevices[this.currentDeviceIndex].deviceId);
  }

  private async getCameraDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  }

  public startRecording(): void {
    if (!this.videoStream) {
      console.error('Нет видеопотока для записи.');
      return;
    }

    try {
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.videoStream);

      this.mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(10); // Интервал сохранения данных в миллисекундах
      this.isRecording = true;
      console.log('Запись начата.');
    } catch (error) {
      console.error('Ошибка при начале записи:', error);
    }
  }

  public stopRecording(): void {
    console.log('Запись закончена.');
    if (!this.mediaRecorder || !this.isRecording) {
      console.error('Запись не начата.');
      return;
    }

    try {
      this.mediaRecorder.stop();
      this.isRecording = false;

      const videoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
      this.uploadVideo(videoBlob);
    } catch (error) {
      console.error('Ошибка при остановке записи:', error);
    }
  }

  private uploadVideo(videoBlob: Blob): void {
    const formData = new FormData();
    formData.append('file', videoBlob, `video-${Date.now()}.webm`);
    console.log('Видео файл:!!!!!', videoBlob);

    this.facade.uploadVideo(formData);

    // this.http.post('http://localhost:9000/uploadVideo', formData).subscribe({
    //   next: (response: any) => {
    //     console.log('Видео успешно загружено:', response);
    //     // Дальше можно использовать response.video.url для отображения видео
    //   },
    //   error: err => console.error('Ошибка при загрузке видео:', err)
    // });
  }

  public ngOnDestroy(): void {
    this.videoStream?.getTracks().forEach(track => track.stop());
  }
}
