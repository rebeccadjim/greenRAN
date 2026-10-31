import { Component, computed, inject } from '@angular/core';
import { KpiCard } from '../../shared/kpi-card/kpi-card';
import { SiteMap } from '../site-map/site-map';
import { SitesStore } from '../../core/services/sites-store';

const CO2_KG_PER_KWH = 0.056; // facteur moyen France, à rendre paramétrable

@Component({
  selector: 'app-dashboard',
  imports: [KpiCard, SiteMap],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  store = inject(SitesStore);

  overloaded = computed(
    () => Object.values(this.store.latest()).filter((m) => m.loadPct > 80).length
  );
  co2Kg = computed(() => this.store.totalKwh() * CO2_KG_PER_KWH);
}