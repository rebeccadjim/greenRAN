import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AlertsService } from '../../core/services/alerts.service';
import { SitesStore } from '../../core/services/sites-store';

@Component({
  selector: 'app-alerts',
  imports: [DatePipe, RouterLink, MatButtonToggleModule],
  templateUrl: './alerts.html',
  styleUrl: './alerts.scss',
})
export class Alerts {
  private alertsService = inject(AlertsService);
  private store = inject(SitesStore);

  filter = signal<'active' | 'all'>('active');

  rows = computed(() => {
    const all = this.alertsService.alerts();
    return this.filter() === 'active' ? all.filter((a) => a.active) : all;
  });

  siteName(id: string) {
    return this.store.siteById(id)?.name ?? id;
  }

  typeLabel(type: string) {
    return { overconsumption: 'Surconsommation', failure: 'Site défaillant', drift: 'Dérive' }[type] ?? type;
  }
}