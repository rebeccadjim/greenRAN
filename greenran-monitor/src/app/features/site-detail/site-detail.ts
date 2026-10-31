import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';
import { SitesStore } from '../../core/services/sites-store';
import { Measure } from '../../core/models/measure.model';

@Component({
  selector: 'app-site-detail',
  imports: [RouterLink, MatButtonModule, NgxEchartsDirective],
  templateUrl: './site-detail.html',
  styleUrl: './site-detail.scss',
})
export class SiteDetail {
  private store = inject(SitesStore);

  id = input.required<string>();

  site = computed(() => this.store.siteById(this.id()));
  last = computed(() => this.store.latest()[this.id()]);
  points = computed<Measure[]>(() => this.store.history()[this.id()] ?? []);

  chart = computed<EChartsCoreOption>(() => ({
    animation: false,
    tooltip: { trigger: 'axis' },
    legend: { data: ['Charge (%)', 'Conso (kWh)'] },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: { type: 'time' },
    yAxis: [
      { type: 'value', name: '%', min: 0, max: 100 },
      { type: 'value', name: 'kWh', splitLine: { show: false } },
    ],
    series: [
      {
        name: 'Charge (%)',
        type: 'line',
        showSymbol: false,
        data: this.points().map((m) => [m.ts, +m.loadPct.toFixed(1)]),
      },
      {
        name: 'Conso (kWh)',
        type: 'line',
        yAxisIndex: 1,
        showSymbol: false,
        data: this.points().map((m) => [m.ts, +m.energyKwh.toFixed(2)]),
      },
    ],
  }));
}