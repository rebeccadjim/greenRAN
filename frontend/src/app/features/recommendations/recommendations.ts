import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ForecastService } from '../../core/services/forecast.service';
import { KpiCard } from '../../shared/kpi-card/kpi-card';
import { SwitchOffWindow } from '../../core/models/recommendation.model';

@Component({
  selector: 'app-recommendations',
  imports: [RouterLink, KpiCard],
  templateUrl: './recommendations.html',
  styleUrl: './recommendations.scss',
})
export class Recommendations {
  forecast = inject(ForecastService);

  rows = computed(() =>
    this.forecast.recommendations().flatMap((r) => r.windows.map((w) => ({ site: r.site, w })))
  );

  onThreshold(e: Event) {
    this.forecast.threshold.set(+(e.target as HTMLInputElement).value);
  }

  slot(w: SwitchOffWindow) {
    const f = (h: number) => String(h).padStart(2, '0') + ':00';
    return `${f(w.startHour)} → ${f(w.endHour)}`;
  }

  riskLabel(r: string) {
    return ({ low: 'Faible', medium: 'Modéré', high: 'Élevé' } as Record<string, string>)[r];
  }
}