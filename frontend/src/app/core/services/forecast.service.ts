import { Injectable, computed, inject, signal } from '@angular/core';
import { SitesStore } from './sites-store';
import { Site } from '../models/site.model';
import { Recommendation, Risk, SwitchOffWindow } from '../models/recommendation.model';
import { BASE_KWH_PER_CELL, CO2_KG_PER_KWH, EUR_PER_KWH } from '../energy.model';

@Injectable({ providedIn: 'root' })
export class ForecastService {
  private store = inject(SitesStore);

  /** En dessous de ce niveau de charge prévue (%), une heure est « creuse ». */
  readonly threshold = signal(25);

  /** Charge maximale tolérée (%) sur les cellules restées allumées. */
  private readonly targetLoad = 70;

  /** Charge prévue pour chacune des 24 heures (0h à 23h). */
  profile(site: Site): number[] {
    return Array.from({ length: 24 }, (_, h) => this.store.expectedLoad(site, h + 0.5));
  }

  recommendationFor(site: Site): Recommendation {
    const windows = this.windowsFor(site, this.profile(site), this.threshold());
    const savedKwh = windows.reduce((s, w) => s + w.savedKwh, 0);
    return {
      site,
      windows,
      savedKwh,
      savedEur: savedKwh * EUR_PER_KWH,
      savedCo2Kg: savedKwh * CO2_KG_PER_KWH,
    };
  }

  readonly recommendations = computed(() =>
    this.store.sites.map((s) => this.recommendationFor(s))
  );

  readonly totals = computed(() => {
    const recs = this.recommendations();
    return {
      kwh: recs.reduce((s, r) => s + r.savedKwh, 0),
      eur: recs.reduce((s, r) => s + r.savedEur, 0),
      co2: recs.reduce((s, r) => s + r.savedCo2Kg, 0),
      cells: recs.reduce((s, r) => s + r.windows.reduce((c, w) => Math.max(c, w.cellsOff), 0), 0),
    };
  });

  /** Regroupe les heures creuses consécutives (en gérant le passage de minuit). */
  private windowsFor(site: Site, profile: number[], threshold: number): SwitchOffWindow[] {
    const low = profile.map((l) => l < threshold);
    const start = low.findIndex((v) => !v);
    if (start === -1) return [];   // toujours creux : on ne propose rien (cas limite)

    const windows: SwitchOffWindow[] = [];
    let run: number[] = [];
    for (let i = 1; i <= 24; i++) {
      const h = (start + i) % 24;
      if (low[h]) {
        run.push(h);
      } else if (run.length) {
        const w = this.makeWindow(site, profile, run);
        if (w.cellsOff > 0) windows.push(w);
        run = [];
      }
    }
    return windows;
  }

  private makeWindow(site: Site, profile: number[], hours: number[]): SwitchOffWindow {
    const loads = hours.map((h) => profile[h]);
    const peakLoad = Math.max(...loads);
    const avgLoad = loads.reduce((a, b) => a + b, 0) / loads.length;

    // On éteint le maximum de cellules tout en gardant les autres sous la charge cible,
    // sans dépasser la moitié des cellules du site (prudence).
    const byLoad = Math.floor(site.cells * (1 - peakLoad / this.targetLoad));
    const cellsOff = Math.max(0, Math.min(byLoad, Math.floor(site.cells / 2)));

    const resultingLoad = (peakLoad * site.cells) / (site.cells - cellsOff);
    const risk: Risk = resultingLoad < 45 ? 'low' : resultingLoad < 60 ? 'medium' : 'high';

    return {
      startHour: hours[0],
      endHour: (hours[hours.length - 1] + 1) % 24,
      hours: hours.length,
      avgLoad,
      peakLoad,
      cellsOff,
      resultingLoad,
      risk,
      // Une cellule éteinte économise sa base fixe ; la part proportionnelle est reportée sur les voisines.
      savedKwh: cellsOff * BASE_KWH_PER_CELL * hours.length,
    };
  }
}