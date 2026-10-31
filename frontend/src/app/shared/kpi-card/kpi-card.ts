import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-kpi-card',
  imports: [MatCardModule],
  templateUrl: './kpi-card.html',
  styleUrl: './kpi-card.scss',
})
export class KpiCard {
  label = input.required<string>();
  value = input.required<string>();
  unit = input('');
  status = input<'ok' | 'warn' | 'crit'>('ok');
}