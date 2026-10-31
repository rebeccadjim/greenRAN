import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RealtimeService } from './realtime';
import { Measure } from '../models/measure.model';
import { Site } from '../models/site.model';

@Injectable({ providedIn: 'root' })
export class SitesStore {
  private readonly rt = inject(RealtimeService);

  readonly sites: Site[] = this.rt.sites;

  private readonly _latest = signal<Record<string, Measure>>({});
  readonly latest = this._latest.asReadonly();

  private readonly _history = signal<Record<string, Measure[]>>({});
  readonly history = this._history.asReadonly();

  readonly totalKwh = computed(() =>
    Object.values(this._latest()).reduce((sum, m) => sum + m.energyKwh, 0)
  );

  readonly avgLoadPct = computed(() => {
    const values = Object.values(this._latest());
    return values.length ? values.reduce((s, m) => s + m.loadPct, 0) / values.length : 0;
  });

  constructor() {
    this.rt
      .stream$()
      .pipe(takeUntilDestroyed())
      .subscribe((m) => {
        this._latest.update((l) => ({ ...l, [m.siteId]: m }));
        this._history.update((h) => ({
          ...h,
          [m.siteId]: [...(h[m.siteId] ?? []), m].slice(-90),
        }));
      });
  }

  siteById(id: string) {
    return this.sites.find((s) => s.id === id);
  }
}