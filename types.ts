export interface RawRow {
  [key: string]: any;
}

export interface AggregatedRow {
  cuit: string;
  nombre: string; // Added Name
  nominales: number;
}

export interface SheetData {
  id: string;
  sheetName: string;
  rows: RawRow[];
  isValid: boolean;
  validationError?: string;
  // User inputs
  colocacion: string;
  denominacion: string;
}

export interface ProcessedStats {
  totalNominales: number;
  uniqueCUITs: number; // Renamed from uniqueCCs
  rowCount: number;
}