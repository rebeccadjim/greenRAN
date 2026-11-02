import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsCoreOption } from 'echarts/core';
import { SitesStore } from '../../core/services/sites-store';
import { Measure } from '../../core/models/measure.model';
import {ForecastService} from "../../core/services/forecast.service";

@Component({
  selector: 'app-site-detail',
  imports: [RouterLink, MatButtonModule, NgxEchartsDirective],
  templateUrl: './site-detail.html',
  styleUrl: './site-detail.scss',
})
export class SiteDetail {
  private store = inject(SitesStore);
  private forecast = inject(ForecastService);

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
  rec = computed(() => {
    const s = this.site();
    return s ? this.forecast.recommendationFor(s) : undefined;
  });

  forecastChart = computed<EChartsCoreOption>(() => {
    const s = this.site();
    if (!s) return {};
    const th = this.forecast.threshold();
    const profile = this.forecast.profile(s);
    return {
      animation: false,
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 30, bottom: 30 },
      xAxis: { type: 'category', data: profile.map((_, h) => `${h}h`) },
      yAxis: { type: 'value', name: '%', min: 0, max: 100 },
      series: [
        {
          name: 'Charge prévue (%)',
          type: 'bar',
          data: profile.map((v) => ({
            value: +v.toFixed(1),
            itemStyle: { color: v < th ? '#1976d2' : '#9e9e9e' },
          })),
          markLine: { silent: true, symbol: 'none', data: [{ yAxis: th, name: 'Seuil' }] },
        },
      ],
    };
  });
}