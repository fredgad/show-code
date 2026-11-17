import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, TemplateRef } from '@angular/core';
import { RecorderDemoCopy } from './recorder-demo.copy';

@Component({
  selector: 'org-recorder-demo-home',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './recorder-demo-home.component.html',
  styleUrl: './recorder-demo-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecorderDemoHomeComponent {
  @Input({ required: true }) public copy!: RecorderDemoCopy;
  @Input({ required: true }) public icon!: TemplateRef<{ $implicit: string }>;

  public readonly presets = [1, 2, 3, 4, 5, 6, 7, 8];
  public readonly selectedPreset = 6;
}
