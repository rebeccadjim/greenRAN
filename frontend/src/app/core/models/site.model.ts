export interface Site {
  id: string;
  name: string;
  lat: number;
  lng: number;
  cells: number;
  technology?: '4G' | '5G';
  status?: 'ACTIVE' | 'SLEEP';
}