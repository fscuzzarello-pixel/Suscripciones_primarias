import * as XLSX from 'xlsx';
import { RawRow, AggregatedRow, ProcessedStats } from '../types';

/**
 * Normalizes keys for comparison by removing non-alphanumeric characters.
 * e.g. "C.U.I.T." -> "cuit", "Nominales ($)" -> "nominales"
 */
const normalizeKey = (key: string) => key.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Finds a key in the row object that matches one of the target fragments.
 */
const findKey = (row: RawRow, targetFragments: string[]): string | undefined => {
  const keys = Object.keys(row);
  for (const target of targetFragments) {
    const found = keys.find((key) => 
      normalizeKey(key).includes(target)
    );
    if (found) return found;
  }
  return undefined;
};

export const parseExcelFile = async (file: File): Promise<Map<string, RawRow[]>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetMap = new Map<string, RawRow[]>();

        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          
          // Get data as array of arrays (header: 1) to manually find the header row
          const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

          if (!rawData || rawData.length === 0) return;

          let headerRowIndex = -1;
          
          // Smart Search: Scan first 20 rows to find the headers
          for (let i = 0; i < Math.min(rawData.length, 20); i++) {
            const row = rawData[i];
            // Create a search string from the row
            const rowStr = row.map(cell => String(cell || '').toLowerCase()).join(' ');
            
            // Check for mandatory columns presence
            const hasCuit = rowStr.includes('cuit') || rowStr.includes('cuil') || rowStr.includes('ident');
            const hasNominal = rowStr.includes('nominal') || rowStr.includes('monto') || rowStr.includes('cantidad') || rowStr.includes('vn');
            
            if (hasCuit && hasNominal) {
              headerRowIndex = i;
              break;
            }
          }

          let rows: RawRow[] = [];

          if (headerRowIndex !== -1) {
            // We found the specific header row
            const headers = rawData[headerRowIndex].map(h => String(h || '').trim());
            
            // Map the rest of the rows to objects using these headers
            rows = rawData.slice(headerRowIndex + 1).map(rowArray => {
              const obj: RawRow = {};
              headers.forEach((h, idx) => {
                if (h) {
                  obj[h] = rowArray[idx];
                }
              });
              return obj;
            });
          } else {
            // Fallback: If we couldn't find headers, try standard parsing (Row 0 is header)
            rows = XLSX.utils.sheet_to_json<RawRow>(sheet);
          }

          if (rows.length > 0) {
            sheetMap.set(sheetName, rows);
          }
        });

        resolve(sheetMap);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const aggregateData = (rows: RawRow[]): { data: AggregatedRow[], stats: ProcessedStats } => {
  const map = new Map<string, AggregatedRow>();
  
  if (rows.length === 0) {
    return { data: [], stats: { rowCount: 0, uniqueCUITs: 0, totalNominales: 0 } };
  }

  // Attempt to identify column names dynamically
  // We check the first valid row to determine keys
  const sampleRow = rows.find(r => Object.keys(r).length > 0) || rows[0] || {};
  
  // Define search targets (normalized)
  const cuitTargets = ['cuit', 'cuil', 'ident', 'doc'];
  const nominalTargets = ['nominal', 'cantidad', 'vn', 'monto', 'precio', 'valor'];
  const nombreTargets = ['nombre', 'razon', 'denominacion', 'titular', 'apellido'];

  const cuitKey = findKey(sampleRow, cuitTargets);
  const nominalesKey = findKey(sampleRow, nominalTargets);
  const nombreKey = findKey(sampleRow, nombreTargets);

  // If we can't find keys, we can't process. Return empty to avoid bad data.
  // Although, if keys are missing, we might try to use values if the row has few columns? 
  // For now, strict on finding CUIT.
  if (!cuitKey) {
    console.warn("Could not identify CUIT column");
    return { data: [], stats: { rowCount: rows.length, uniqueCUITs: 0, totalNominales: 0 } };
  }

  rows.forEach((row) => {
    // Extract CUIT (Group Key)
    const cuitVal = row[cuitKey];
    // Clean CUIT: remove dashes/spaces/dots
    const cuit = cuitVal ? String(cuitVal).replace(/[^0-9]/g, '') : '';
    
    // Skip if no valid CUIT found
    if (!cuit) return;

    // Extract Name
    const nombreVal = nombreKey ? row[nombreKey] : '';
    const nombre = nombreVal ? String(nombreVal).trim() : '';

    // Parse nominales
    let nominales = 0;
    if (nominalesKey) {
      const rawNominales = row[nominalesKey];
      
      if (typeof rawNominales === 'number') {
        nominales = rawNominales;
      } else if (typeof rawNominales === 'string') {
        const cleanStr = rawNominales.trim();
        // Handle Argentina/European formatting (1.000,00) vs Standard (1,000.00)
        // If it has a comma and a dot, it's ambiguous, but usually 1.000,00 in this context
        if (cleanStr.includes(',') && cleanStr.includes('.')) {
           // Assume 1.000,00 -> remove dots, replace comma with dot
           nominales = parseFloat(cleanStr.replace(/\./g, '').replace(',', '.'));
        } else if (cleanStr.includes(',')) {
           // Likely decimal separator 100,50 -> 100.50
           // OR it could be thousands separator 100,000? 
           // In AR context, comma is decimal.
           nominales = parseFloat(cleanStr.replace(',', '.'));
        } else {
           nominales = parseFloat(cleanStr);
        }
      }
    }
    
    if (isNaN(nominales)) nominales = 0;

    if (map.has(cuit)) {
      const existing = map.get(cuit)!;
      existing.nominales += nominales;
      // If the existing entry didn't have a name but this one does, update it
      if (!existing.nombre && nombre) existing.nombre = nombre;
    } else {
      map.set(cuit, {
        cuit,
        nombre,
        nominales
      });
    }
  });

  const aggregatedData = Array.from(map.values());

  const stats: ProcessedStats = {
    rowCount: rows.length,
    uniqueCUITs: aggregatedData.length,
    totalNominales: aggregatedData.reduce((sum, item) => sum + item.nominales, 0)
  };

  return { data: aggregatedData, stats };
};

export const generateTxtContent = (
  data: AggregatedRow[], 
  colocacion: string, 
  denominacion: string
): string => {
  // Spec:
  // Col 1: Colocación
  // Col 2: Denominación
  // Col 3: Nominales (Sum per CUIT)
  // Col 4: CUIT
  // Col 5: Nombre
  // Col 6: "200"
  // Col 7: "Persona Humana"
  // Col 8: "CUIT"
  // Separator: Tab (\t)

  return data.map(row => {
    // Format nominales: usually integers for public titles.
    // If integer, print as integer. If decimal, print with comma for AR format (optional, but safer to match source)
    // The example showed integers. We will output flexible format.
    const nominalesStr = Number.isInteger(row.nominales) 
      ? row.nominales.toString() 
      : row.nominales.toFixed(2).replace('.', ','); 

    return [
      colocacion,
      denominacion,
      nominalesStr,
      row.cuit,
      row.nombre,
      "200",
      "Persona Humana",
      "CUIT"
    ].join('\t');
  }).join('\n');
};

export const downloadTxtFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
