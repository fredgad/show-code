import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'org-checkbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxComponent implements OnInit {
  @Input() public initialValue = false;

  @Output() checkboxChange = new EventEmitter<boolean>();

  public uniqueId: string = '';

  public ngOnInit(): void {
    this.uniqueId = 'toggle-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  public onCheckboxChange(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.checkboxChange.emit(isChecked);
  }
}
