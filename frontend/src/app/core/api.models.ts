export type Technology = '4G' | '5G';
export type SiteStatus = 'ACTIVE' | 'SLEEP';
export type Bucket = '1m' | '5m' | '15m' | '1h' | '1d';

export interface LatestKpi {
  time: string;          // date ISO en UTC
  trafficMbps: number;
  prbLoadPct: number;
  energyKwh: number;     // énergie sur l'intervalle de 10 s, pas une puissance
  temperatureC: number;
}

export interface SiteView {
  id: number;
  name: string;
  lat: number;
  lon: number;
  technology: Technology;
  cells: number;
  status: SiteStatus;
  latest: LatestKpi | null;   // null tant qu'aucune mesure n'est arrivée
}

export interface MetricPoint {
  time: string;
  trafficMbps: number;
  prbLoadPct: number;
  energyKwh: number;     // somme sur le bucket
  temperatureC: number;
}

// Durée d'un bucket en secondes, pour convertir l'énergie en puissance moyenne (kW)
export const BUCKET_SECONDS: Record<Bucket, number> = {
  '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '1d': 86400,
};