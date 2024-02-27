import { Component, ElementRef, OnInit, Signal, ViewChild, WritableSignal, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '@widgets/header';
import { ImageDirective, TextDirective } from '@shared/directives';
import { LangService } from '@shared/services';

@Component({
  selector: 'org-video-page',
  standalone: true,
  imports: [CommonModule, HeaderComponent, TextDirective, ImageDirective],
  templateUrl: './video-page.component.html',
  styleUrl: './video-page.component.scss',
})
export class VideoPageComponent implements OnInit {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  private langService = inject(LangService);

  private recordedChunks: BlobPart[] = [];
  private mediaRecorder!: MediaRecorder;
  private videoStream!: MediaStream;
  private videoDevices: MediaDeviceInfo[] = [];
  private currentDeviceId: string | undefined;
  private currentDeviceIndex: number = 0;

  // public recordingTime$i: WritableSignal<string | undefined> = signal('00:00:00');
  
  public isRecording = false;
  public currentDeviceLabel$i: WritableSignal<string | undefined> = signal('');

  public abbrTitle$i: Signal<string> = this.langService.textByLanguage({
    ENG: 'Change camera',
    ESP: 'Cambia la cámara',
    RUS: 'Сменить камеру'
  });

  async ngOnInit(): Promise<void> {
    this.videoDevices = await this.getCameraDevices();
    this.videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    if (this.videoDevices.length > 0) {
      this.currentDeviceId = this.videoDevices[this.currentDeviceIndex].deviceId;
      this.currentDeviceLabel$i.set(this.videoDevices[this.currentDeviceIndex].label);

      this.startVideo(this.currentDeviceId);
    }
  }

  private async startVideo(deviceId: string): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });
      this.videoElement.nativeElement.srcObject = stream;
    } catch (error) {
      console.error('Ошибка при попытке получить доступ к камере:', error);
    }
  }
  
  public switchCamera(): void {
    this.currentDeviceIndex = this.currentDeviceIndex >= this.videoDevices.length -1 ? 0 : this.currentDeviceIndex + 1;
    this.currentDeviceId = this.videoDevices[this.currentDeviceIndex].deviceId;
    this.currentDeviceLabel$i.set(this.videoDevices[this.currentDeviceIndex].label);

    const device = this.videoDevices[this.currentDeviceIndex]
    if (device && device.deviceId) {
      this.startVideo(this.currentDeviceId);
    }
  }

  private async getCameraDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    return videoDevices;
  }

  public async startRecording(): Promise<void> {
    try {
      this.mediaRecorder = new MediaRecorder(this.videoStream);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(10); // Разбивка видео на чанки каждые 10 миллисекунд
      this.isRecording = true;
    } catch (error) {
      console.error('Ошибка при получении доступа к камере:', error);
    }
  }

  public stopRecording() {
    this.mediaRecorder.stop();
    this.isRecording = false;

    // Обработка записанных чанков, например, создание Blob и сохранение видео
    const videoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const videoUrl = URL.createObjectURL(videoBlob);
    console.log(videoUrl, 'videoUrl');
    // videoUrl можно использовать для загрузки на сервер или сохранения локально
  }

  ngOnDestroy() {
    this.videoStream?.getTracks().forEach(track => track.stop()); // Остановка потока
  }
}
