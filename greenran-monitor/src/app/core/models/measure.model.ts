export interface Qos {
  latencyMs: number;
  dropRatePct: number;
  throughputMbps: number;
}

export interface Measure {
  siteId: string;
  ts: number;
  trafficGb: number;
  loadPct: number;
  energyKwh: number;
  tempC: number;
  qos: Qos;
}