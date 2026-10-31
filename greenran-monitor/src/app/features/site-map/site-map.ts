import { Component, ElementRef, OnDestroy, AfterViewInit, effect, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';                      // NEW
import * as L from 'leaflet';
import { SitesStore } from '../../core/services/sites-store';

@Component({
  selector: 'app-site-map',
  templateUrl: './site-map.html',
  styleUrl: './site-map.scss',
})
export class SiteMap implements AfterViewInit, OnDestroy {
  private store = inject(SitesStore);
  private router = inject(Router);                             // NEW
  private mapEl = viewChild.required<ElementRef<HTMLDivElement>>('mapEl');
  private map?: L.Map;
  private markers = new Map<string, L.CircleMarker>();

  constructor() {
    effect(() => {
      const latest = this.store.latest();
      for (const [id, m] of Object.entries(latest)) {
        const marker = this.markers.get(id);
        if (!marker) continue;
        marker.setStyle({ color: this.colorFor(m.loadPct), fillColor: this.colorFor(m.loadPct) });
        marker.setTooltipContent(
          `<b>${this.nameOf(id)}</b><br>Charge : ${m.loadPct.toFixed(0)} %<br>` +
          `Conso : ${m.energyKwh.toFixed(1)} kWh<br>Temp. : ${m.tempC.toFixed(0)} °C`
        );
      }
    });
  }

  ngAfterViewInit() {
    this.map = L.map(this.mapEl().nativeElement).setView([45.755, 4.85], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    for (const s of this.store.sites) {
      const marker = L.circleMarker([s.lat, s.lng], {
        radius: 10 + s.cells,
        fillOpacity: 0.6,
        color: '#2e7d32',
      }).addTo(this.map);
      marker.bindTooltip(s.name);
      marker.on('click', () => this.router.navigate(['/site', s.id]));   // NEW
      this.markers.set(s.id, marker);
    }
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  private nameOf(id: string) {
    return this.store.sites.find((s) => s.id === id)?.name ?? id;
  }

  private colorFor(load: number) {
    if (load > 80) return '#d32f2f';   // surcharge
    if (load < 25) return '#1976d2';   // sous-utilisé : candidat à la mise en veille
    return '#2e7d32';                  // normal
  }
}