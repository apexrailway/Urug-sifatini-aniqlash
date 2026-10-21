export enum AppView {
  HOME = 'HOME',
  CAMERA = 'CAMERA',
  UPLOAD = 'UPLOAD',
  RESULTS = 'RESULTS'
}

export interface SeedBox {
  type: 'healthy' | 'broken';
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in range 0-1000
  label?: string;
}

export interface SeedAnalysisResult {
  total: number;
  healthy: number;
  broken: number;
  summary: string;
  seeds?: SeedBox[];
}

export interface ChartData {
  name: string;
  value: number;
  fill: string;
}

export interface BarChartData {
  name: string;
  sifatli: number;
  yaroqsiz: number;
}