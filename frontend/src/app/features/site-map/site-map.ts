import { Component, ElementRef, OnDestroy, AfterViewInit, effect, signal, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';                   
import * as L from 'leaflet';
import { SitesStore } from '../../core/services/sites-store';
import { Site } from '../../core/models/site.model';

@Component({
  selector: 'app-site-map',
  templateUrl: './site-map.html',
  styleUrl: './site-map.scss',
})
export class SiteMap implements AfterViewInit, OnDestroy {
  private store = inject(SitesStore);
  private router = inject(Router);                            
  private mapEl = viewChild.required<ElementRef<HTMLDivElement>>('mapEl');
  private map?: L.Map;
  private markers = new Map<string, L.CircleMarker>();
  private readonly mapReady = signal(false);

  constructor() {
    // 1. Création et suppression des marqueurs quand la liste de sites change
    effect(() => {
      const sites = this.store.sites();
      if (!this.mapReady()) return;
      this.syncMarkers(sites);
    });

    // 2. Ton effet existant : couleur et tooltip selon la dernière mesure
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
    this.mapReady.set(true);
  }
  private syncMarkers(sites: Site[]) {
    const ids = new Set(sites.map((s) => s.id));
    const map = this.map;
    if (!map) return;

    // retire les marqueurs des sites qui n'existent plus (bascule API <-> simulation)
    for (const [id, marker] of this.markers) {
      if (!ids.has(id)) {
        marker.remove();
        this.markers.delete(id);
      }
    }

    // crée les marqueurs manquants
    for (const s of sites) {
      if (this.markers.has(s.id)) continue;
      const marker = L.circleMarker([s.lat, s.lng], {
        radius: 10 + s.cells,
        fillOpacity: 0.6,
        color: '#2e7d32',
      }).addTo(map);
      marker.bindTooltip(s.name);
      marker.on('click', () => this.router.navigate(['/site', s.id]));
      this.markers.set(s.id, marker);
    }
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  private nameOf(id: string) {
    return this.store.siteById(id)?.name ?? id;
  }

  private colorFor(load: number) {
    if (load > 80) return '#d32f2f';   // surcharge
    if (load < 25) return '#1976d2';   // sous-utilisé : candidat à la mise en veille
    return '#2e7d32';                  // normal
  }
}