import React, { useState } from 'react';
import { ToolManager } from './components/ToolManager';
import { Briefcase, Building2 } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'titulos' | 'ons'>('titulos');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Global Application Tabs */}
      <div className="bg-slate-900 text-slate-300 shadow-md">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center h-14 gap-8">
            <button
              onClick={() => setActiveTab('titulos')}
              className={`h-full flex items-center gap-2 border-b-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'titulos'
                  ? 'border-blue-400 text-white'
                  : 'border-transparent hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Títulos Públicos
            </button>
            <button
              onClick={() => setActiveTab('ons')}
              className={`h-full flex items-center gap-2 border-b-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'ons'
                  ? 'border-blue-400 text-white'
                  : 'border-transparent hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Gestor de ON's
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - Using CSS display toggle to preserve state of each tab */}
      <div className={activeTab === 'titulos' ? 'block' : 'hidden'}>
        <ToolManager 
          title="Gestor de Títulos Públicos"
          description="Herramienta para procesar archivos de carga de títulos públicos."
          icon={Briefcase}
        />
      </div>
      
      <div className={activeTab === 'ons' ? 'block' : 'hidden'}>
        <ToolManager 
          title="Gestor de ON's"
          description="Herramienta para procesar archivos de Obligaciones Negociables."
          icon={Building2}
        />
      </div>

    </div>
  );
}

export default App;