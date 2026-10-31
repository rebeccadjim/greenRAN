import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { SitesStore } from './sites-store';
import { Alert, Severity } from '../models/alert.model';
import { Measure } from '../models/measure.model';
import { Site } from '../models/site.model';

type AlertType = Alert['type'];
interface Detection { type: AlertType; severity: Severity; message: string }

const TYPES: AlertType[] = ['overconsumption', 'failure', 'drift'];

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private store = inject(SitesStore);
  private seq = 0;

  private readonly _alerts = signal<Alert[]>([]);
  readonly alerts = this._alerts.asReadonly();
  readonly activeCount = computed(() => this._alerts().filter((a) => a.active).length);

  constructor() {
    effect(() => {
      const latest = this.store.latest();
      untracked(() => this.evaluate(latest));
    });
  }

  private evaluate(latest: Record<string, Measure>) {
    let list = this._alerts();
    let changed = false;

    for (const m of Object.values(latest)) {
      const site = this.store.siteById(m.siteId);
      if (!site) continue;
      const detections = this.detect(site, m);

      for (const type of TYPES) {
        const d = detections.find((x) => x.type === type);
        const active = list.find((a) => a.active && a.siteId === m.siteId && a.type === type);

        if (d && !active) {
          list = [{ id: `A${++this.seq}`, siteId: m.siteId, ts: m.ts, active: true, ...d }, ...list];
          changed = true;
        } else if (!d && active) {
          list = list.map((a) => (a === active ? { ...a, active: false, endTs: m.ts } : a));
          changed = true;
        }
      }
    }
    if (changed) this._alerts.set(list.slice(0, 200));
  }

  /** Règles simples : à remplacer par le moteur ML du backend (issue #23). */
  private detect(site: Site, m: Measure): Detection[] {
    const out: Detection[] = [];

    // Surconsommation : consommation mesurée vs consommation attendue pour cette charge
    const expected = site.cells * (0.45 + 0.9 * (m.loadPct / 100));
    const ratio = m.energyKwh / expected;
    if (ratio > 1.3) {
      out.push({
        type: 'overconsumption',
        severity: ratio > 1.6 ? 'critical' : 'warning',
        message: `Consommation ${Math.round((ratio - 1) * 100)} % au-dessus de l'attendu pour cette charge`,
      });
    }

    // Site défaillant : taux de coupure anormal
    if (m.qos.dropRatePct > 5) {
      out.push({
        type: 'failure',
        severity: 'critical',
        message: `Taux de coupure ${m.qos.dropRatePct.toFixed(1)} %, débit ${m.qos.throughputMbps.toFixed(0)} Mbps`,
      });
    }

    // Dérive thermique : température au-dessus de la normale pour cette charge
    const gap = m.tempC - (22 + 0.12 * m.loadPct);
    if (gap > 6) {
      out.push({
        type: 'drift',
        severity: 'warning',
        message: `Température ${m.tempC.toFixed(0)} °C, ${gap.toFixed(0)} °C au-dessus de la normale`,
      });
    }

    return out;
  }
}