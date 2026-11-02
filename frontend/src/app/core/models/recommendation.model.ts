import { Site } from './site.model';

export type Risk = 'low' | 'medium' | 'high';

export interface SwitchOffWindow {
  startHour: number;       // première heure du créneau
  endHour: number;         // heure de fin (exclue), peut passer minuit
  hours: number;
  avgLoad: number;         // charge prévue moyenne (%)
  peakLoad: number;        // charge prévue maximale (%)
  cellsOff: number;        // cellules à éteindre
  resultingLoad: number;   // charge reportée sur les cellules restantes (%)
  risk: Risk;
  savedKwh: number;
}

export interface Recommendation {
  site: Site;
  windows: SwitchOffWindow[];
  savedKwh: number;
  savedEur: number;
  savedCo2Kg: number;
}