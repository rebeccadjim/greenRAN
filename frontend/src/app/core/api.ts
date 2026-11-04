import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Bucket, MetricPoint, SiteView } from './api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  getSites(): Observable<SiteView[]> {
    return this.http.get<SiteView[]>(`${this.base}/sites`);
  }

  getMetrics(
    siteId: number,
    opts: { from?: Date; to?: Date; bucket?: Bucket } = {},
  ): Observable<MetricPoint[]> {
    let params = new HttpParams();
    if (opts.from) params = params.set('from', opts.from.toISOString());
    if (opts.to) params = params.set('to', opts.to.toISOString());
    if (opts.bucket) params = params.set('bucket', opts.bucket);
    return this.http.get<MetricPoint[]>(`${this.base}/sites/${siteId}/metrics`, { params });
  }
}