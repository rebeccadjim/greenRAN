import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, catchError, map, of, switchMap, timer } from 'rxjs';
import { ApiService } from '../api';
import { SiteView } from '../api.models';
import { RealtimeService } from './realtime';
import { Measure } from '../models/measure.model';
import { Site } from '../models/site.model';

const POLL_MS = 10_000;
const INTERVAL_S = 10;                       // durée couverte par une mesure du backend
const KWH_TO_KW = 3600 / INTERVAL_S;         // énergie sur 10 s -> puissance moyenne en kW

@Injectable({ providedIn: 'root' })
export class SitesStore {
  private readonly api = inject(ApiService);
  private readonly rt = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  readonly sites = signal<Site[]>([]);
  readonly backendUp = signal(false);

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

  private mode: 'api' | 'sim' | null = null;
  private simSub?: Subscription;
  private lastTime: Record<string, string> = {};

  constructor() {
    timer(0, POLL_MS)
      .pipe(
        switchMap(() =>
          this.api.getSites().pipe(
            map((list) => ({ ok: true as const, list })),
            catchError(() => of({ ok: false as const, list: [] as SiteView[] })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((res) => (res.ok ? this.onApi(res.list) : this.onDown()));
  }

  private onApi(list: SiteView[]) {
    if (this.mode !== 'api') {               // premier succès ou retour du backend
      this.simSub?.unsubscribe();
      this.reset();
      this.mode = 'api';
      this.backendUp.set(true);
    }
    this.sites.set(list.map(toSite));
    for (const v of list) {
      const id = String(v.id);
      // site sans mesure, ou mesure déjà reçue : on passe
      if (!v.latest || this.lastTime[id] === v.latest.time) continue;
      this.lastTime[id] = v.latest.time;
      this.push(toMeasure(v));
    }
  }

  private onDown() {
    if (this.mode === 'sim') return;         // déjà en repli
    this.simSub?.unsubscribe();
    this.reset();
    this.mode = 'sim';
    this.backendUp.set(false);
    this.sites.set(this.rt.sites);
    this.simSub = this.rt
      .stream$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((m) => this.push(m));
  }

  private push(m: Measure) {
    this._latest.update((l) => ({ ...l, [m.siteId]: m }));
    this._history.update((h) => ({
      ...h,
      [m.siteId]: [...(h[m.siteId] ?? []), m].slice(-90),
    }));
  }

  private reset() {
    this._latest.set({});
    this._history.set({});
    this.lastTime = {};
  }

  siteById(id: string) {
    return this.sites().find((s) => s.id === id);
  }

  expectedLoad(site: Site, hour: number) {
    // Le simulateur déduit le profil du site de son id « S01 » ; les ids de l'API sont « 1 »
    const simId = /^\d+$/.test(site.id) ? 'S' + site.id.padStart(2, '0') : site.id;
    return this.rt.expectedLoad({ ...site, id: simId }, hour);
  }
}

function toSite(v: SiteView): Site {
  return {
    id: String(v.id),
    name: v.name,
    lat: v.lat,
    lng: v.lon,
    technology: v.technology,
    cells: v.cells,
    status: v.status,
  };
}

function toMeasure(v: SiteView): Measure {
  const l = v.latest!;
  return {
    siteId: String(v.id),
    ts: Date.parse(l.time),
    trafficGb: (l.trafficMbps * INTERVAL_S) / 1000,   // Mbit/s x 10 s = Mbit, / 1000 = Gbit
    loadPct: l.prbLoadPct,
    energyKwh: l.energyKwh * KWH_TO_KW,               // en pratique des kW, comme ton simulateur
    tempC: l.temperatureC,
  };
}