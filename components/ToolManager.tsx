import React, { useState } from 'react';
import { FileUploader } from './FileUploader';
import { SheetProcessor } from './SheetProcessor';
import { parseExcelFile } from '../utils/excelUtils';
import { SheetData } from '../types';
import { Info, RefreshCw, LucideIcon } from 'lucide-react';

interface ToolManagerProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const ToolManager: React.FC<ToolManagerProps> = ({ title, description, icon: Icon }) => {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [globalColocacion, setGlobalColocacion] = useState('');

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    try {
      const sheetMap = await parseExcelFile(file);
      
      const newSheets: SheetData[] = [];
      sheetMap.forEach((rows, sheetName) => {
        newSheets.push({
          id: crypto.randomUUID(),
          sheetName,
          rows,
          isValid: true,
          colocacion: globalColocacion, // Initialize with global if set
          denominacion: sheetName // Default denomination to sheet name
        });
      });

      setSheets(newSheets);
    } catch (error) {
      console.error("Error parsing file:", error);
      alert("Error al leer el archivo Excel. Asegúrese de que sea un formato válido (.xlsx).");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSheet = (id: string, field: 'colocacion' | 'denominacion', value: string) => {
    setSheets(prev => prev.map(sheet => {
      if (sheet.id === id) {
        return { ...sheet, [field]: value };
      }
      return sheet;
    }));
  };

  const handleGlobalColocacionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setGlobalColocacion(newVal);
    // Optional: Auto-update all empty sheets
    setSheets(prev => prev.map(s => ({
       ...s, 
       colocacion: s.colocacion ? s.colocacion : newVal
    })));
  };

  const handleReset = () => {
    setSheets([]);
    setGlobalColocacion('');
  };

  return (
    <div className="pb-20">
      {/* Header specific to this tool instance */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <Icon className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl text-slate-800 tracking-tight">{title}</h1>
          </div>
          {sheets.length > 0 && (
            <button 
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Nuevo Archivo
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-8">
        
        {/* Intro / Empty State */}
        {sheets.length === 0 ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-800 mb-3">Carga de Instrumentos</h2>
              <p className="text-slate-500 max-w-lg mx-auto text-lg">
                {description}
              </p>
              <p className="text-slate-400 mt-2 text-sm">
                Suba el archivo Excel maestro. El sistema detectará automáticamente las hojas y le permitirá generar los TXT.
              </p>
            </div>
            
            <FileUploader onFileSelect={handleFileSelect} isLoading={isLoading} />
            
            <div className="max-w-3xl mx-auto bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-left">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Formato Esperado</p>
                <p>El Excel debe contener columnas con: <strong>Nombre, CUIT y Nominales</strong> (o Monto). <br/>El sistema agrupará automáticamente los nominales por <strong>CUIT</strong> y generará el archivo con el formato de 8 columnas solicitado.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {/* Global Settings Toolbar */}
            <div className="bg-slate-800 text-white rounded-xl p-4 mb-8 shadow-lg flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-1">Instrumentos Detectados: {sheets.length}</h2>
                <p className="text-slate-300 text-sm">Configure los detalles de cada hoja para generar los archivos.</p>
              </div>
              <div className="w-full sm:w-auto">
                <label className="block text-xs text-slate-400 mb-1 uppercase font-bold tracking-wider">
                  Pre-llenar Colocación
                </label>
                <input 
                  type="text" 
                  value={globalColocacion}
                  onChange={handleGlobalColocacionChange}
                  placeholder="Valor general..."
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 w-full sm:w-48 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm transition-all"
                />
              </div>
            </div>

            {/* List of Sheets */}
            <div className="space-y-4">
              {sheets.map(sheet => (
                <SheetProcessor 
                  key={sheet.id} 
                  sheet={sheet} 
                  onUpdate={handleUpdateSheet} 
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};