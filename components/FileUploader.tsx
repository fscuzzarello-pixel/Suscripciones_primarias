import React, { ChangeEvent } from 'react';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, isLoading }) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <label 
        htmlFor="file-upload" 
        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors
        ${isLoading ? 'bg-slate-100 border-slate-300' : 'bg-white border-blue-300 hover:bg-blue-50 hover:border-blue-400'}`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isLoading ? (
            <div className="animate-pulse flex flex-col items-center">
              <FileSpreadsheet className="w-10 h-10 text-slate-400 mb-3" />
              <p className="text-sm text-slate-500">Procesando archivo...</p>
            </div>
          ) : (
            <>
              <UploadCloud className="w-10 h-10 text-blue-500 mb-3" />
              <p className="mb-2 text-sm text-slate-700 font-medium">
                <span className="font-bold">Click para subir</span> o arrastra el archivo Excel
              </p>
              <p className="text-xs text-slate-500">Soporta .xlsx, .xls</p>
            </>
          )}
        </div>
        <input 
          id="file-upload" 
          type="file" 
          accept=".xlsx, .xls" 
          className="hidden" 
          onChange={handleChange}
          disabled={isLoading}
        />
      </label>
    </div>
  );
};