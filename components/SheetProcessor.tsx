import React, { useMemo } from 'react';
import { SheetData } from '../types';
import { aggregateData, generateTxtContent, downloadTxtFile } from '../utils/excelUtils';
import { FileText, Download, AlertCircle } from 'lucide-react';

interface SheetProcessorProps {
  sheet: SheetData;
  onUpdate: (id: string, field: 'colocacion' | 'denominacion', value: string) => void;
}

export const SheetProcessor: React.FC<SheetProcessorProps> = ({ sheet, onUpdate }) => {
  
  // Calculate stats on the fly based on current data
  const { stats, data: processedRows } = useMemo(() => {
    return aggregateData(sheet.rows);
  }, [sheet.rows]);

  const handleDownload = () => {
    if (!sheet.colocacion || !sheet.denominacion) {
      alert("Por favor complete la Colocación y Denominación antes de descargar.");
      return;
    }
    const content = generateTxtContent(processedRows, sheet.colocacion, sheet.denominacion);
    downloadTxtFile(content, sheet.denominacion);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-4 transition-all hover:shadow-md">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">{sheet.sheetName}</h3>
            <div className="flex gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <span className="font-medium text-slate-700">{stats.rowCount}</span> filas
              </span>
              <span className="w-px h-3 bg-slate-300"></span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-slate-700">{stats.uniqueCUITs}</span> CUITs unificados
              </span>
            </div>
          </div>
        </div>

        <div className="text-right hidden sm:block">
           <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Nominales Totales</p>
           <p className="text-lg font-bold text-slate-700 tabular-nums">
             {stats.totalNominales.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
           </p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
        
        {/* Input: Colocación */}
        <div className="md:col-span-4">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Colocación
          </label>
          <input
            type="text"
            value={sheet.colocacion}
            onChange={(e) => onUpdate(sheet.id, 'colocacion', e.target.value)}
            placeholder="Ej. 4663"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
          />
        </div>

        {/* Input: Denominación */}
        <div className="md:col-span-5">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Denominación del Título
            <span className="text-xs text-slate-400 font-normal ml-1">(Nombre del archivo output)</span>
          </label>
          <input
            type="text"
            value={sheet.denominacion}
            onChange={(e) => onUpdate(sheet.id, 'denominacion', e.target.value)}
            placeholder="Ej. LECAP VTO 30/04/26"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
          />
        </div>

        {/* Action Button */}
        <div className="md:col-span-3">
          <button
            onClick={handleDownload}
            disabled={!sheet.colocacion || !sheet.denominacion}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all
              ${(!sheet.colocacion || !sheet.denominacion)
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow active:scale-95'
              }`}
          >
            <Download className="w-4 h-4" />
            Descargar TXT
          </button>
        </div>
      </div>
      
      {/* Validation/Info Footer */}
      {(!sheet.colocacion || !sheet.denominacion) && (
        <div className="px-6 pb-4 flex items-center gap-2 text-xs text-amber-600">
          <AlertCircle className="w-3.5 h-3.5" />
          Complete ambos campos para generar el archivo.
        </div>
      )}
    </div>
  );
};