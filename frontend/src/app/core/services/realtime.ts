import { Injectable } from '@angular/core';
import { Observable, from, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Site } from '../models/site.model';
import { Measure } from '../models/measure.model';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  // Sites fictifs autour de Lyon
  readonly sites: Site[] = [
    { id: 'S01', name: 'Bellecour', lat: 45.7578, lng: 4.8320, cells: 6 },
    { id: 'S02', name: 'Part-Dieu', lat: 45.7606, lng: 4.8590, cells: 9 },
    { id: 'S03', name: 'Vieux Lyon', lat: 45.7620, lng: 4.8270, cells: 4 },
    { id: 'S04', name: 'Confluence', lat: 45.7430, lng: 4.8180, cells: 6 },
    { id: 'S05', name: 'Villeurbanne', lat: 45.7710, lng: 4.8900, cells: 6 },
    { id: 'S06', name: 'Gerland', lat: 45.7270, lng: 4.8300, cells: 3 },
    { id: 'S07', name: 'Croix-Rousse', lat: 45.7750, lng: 4.8320, cells: 4 },
    { id: 'S08', name: 'Monplaisir', lat: 45.7450, lng: 4.8700, cells: 3 },
  ];

  stream$(): Observable<Measure> {
    return interval(2000).pipe(
      switchMap(() => from(this.sites.map((s) => this.measure(s))))
    );
  }

  private measure(site: Site): Measure {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;

    const loadPct = this.clamp(this.baseLoad(hour) * this.siteFactor(site) + this.noise(10), 2, 100);

    // Base fixe par cellule + part proportionnelle à la charge
    let energyKwh = site.cells * (0.45 + 0.9 * (loadPct / 100)) + this.noise(0.15);

    let tempC = 22 + 0.12 * loadPct + this.noise(1.5);

    const congestion = Math.max(0, loadPct - 80);
    let qos = {
      latencyMs: 12 + congestion * 1.5 + this.noise(2),
      dropRatePct: Math.max(0, 0.1 + congestion * 0.08 + this.noise(0.05)),
      throughputMbps: Math.max(5, 450 - loadPct * 2.5 - congestion * 8 + this.noise(15)),
    };

    // --- Pannes simulées : chaque scénario s'active 1 minute sur 3 à 5 ---
    const minute = Math.floor(now.getTime() / 60000);
    if (site.id === 'S06' && minute % 3 === 0) {
    energyKwh *= 1.8;                       // surconsommation
    }
    if (site.id === 'S02' && minute % 4 === 1) {
    tempC += 12;                            // dérive thermique
    }
    if (site.id === 'S04' && minute % 5 === 2) {
    qos = { latencyMs: 220, dropRatePct: 18 + this.noise(2), throughputMbps: 20 };  // site défaillant
    }

    return {
      siteId: site.id,
      ts: now.getTime(),
      trafficGb: (loadPct / 100) * site.cells * 1.8,
      loadPct,
      energyKwh: Math.max(0, energyKwh),
      tempC,
      qos,
    };
  }

  /** Courbe de charge journalière : creux la nuit, pic en soirée. */
  private baseLoad(hour: number): number {
    const day = 35 + 25 * Math.exp(-Math.pow((hour - 13) / 4, 2));
    const evening = 40 * Math.exp(-Math.pow((hour - 20.5) / 2.5, 2));
    const night = hour < 6 ? -20 : 0;
    return Math.max(8, day + evening + night);
  }

  /** Chaque site a un profil un peu différent (centre-ville plus chargé). */
  private siteFactor(site: Site): number {
    const n = parseInt(site.id.slice(1), 10);
    return 0.75 + ((n * 37) % 50) / 100;
  }

  private noise(amplitude: number): number {
    return (Math.random() * 2 - 1) * amplitude;
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, v));
  }
}