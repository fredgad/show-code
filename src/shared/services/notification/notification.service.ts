import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {

  public showError(message: string, duration: number = 3000) {
    this.show(message, duration, 'red');
  }

  public show(message: string, duration: number = 3000, color: string = 'green'): void {
    const notification = document.createElement('div');
    notification.innerText = message;
    notification.style.backgroundColor = color;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = 'calc(50% - 120px)';
    notification.style.color = 'white';
    notification.style.padding = '20px';
    notification.style.width = '240px';
    notification.style.textAlign = 'center';
    notification.style.borderRadius = '0 0 5px 5px';
    notification.style.zIndex = '1000';
    notification.style.borderTop = '3px solid grey';
    notification.style.fontSize = '20px';

    document.body.appendChild(notification);

    setTimeout(() => {
      document.body.removeChild(notification);
    }, duration);
  }
}
