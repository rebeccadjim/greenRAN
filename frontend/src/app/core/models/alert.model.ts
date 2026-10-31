export type Severity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  siteId: string;
  type: 'overconsumption' | 'failure' | 'drift';
  severity: Severity;
  ts: number;
  message: string;
  active: boolean;
  endTs?: number;
}