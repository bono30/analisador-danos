import React, { useState } from 'react';
import { getPdfContent } from './utils/pdfProcessor';
import { analyzePdfContent, generateCalculatorLogic } from './utils/aiGenerator';
import { generateStudentHtml } from './utils/htmlGenerator';
import { FileUp, Loader2, Download, BookOpen, Calculator } from 'lucide-react';

function App() {
  const [file, setFile] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('idle'); // idle, extracting, analyzing, generating, done, error
  const [error, setError] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!file || !apiKey) {
      setError("Por favor, selecione um arquivo e insira sua API Key.");
      return;
    }
    setError('');
    setStatus('extracting');

    try {
      // 1. Extract Text
      const { text } = await getPdfContent(file);
      console.log("PDF Extracted, length:", text.length);

      setStatus('analyzing');
      // 2. Analyze with AI
      const analysis = await analyzePdfContent(text, apiKey);
      setAnalysisData(analysis);

      if (!analysis.equations || analysis.equations.length === 0) {
        throw new Error("Nenhuma equação foi encontrada no PDF.");
      }

      setStatus('generating');
      // 3. Generate Logic
      const logic = await generateCalculatorLogic(analysis.equations, apiKey);

      // 4. Create HTML
      const html = generateStudentHtml(analysis, logic);
      setGeneratedHtml(html);

      setStatus('done');
    } catch (err) {
      console.error(err);
      setError(err.message || "Ocorreu um erro durante o processamento.");
      setStatus('error');
    }
  };

  const handleDownload = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Material_Estudo_${file.name.replace('.pdf', '')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans text-gray-800">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">
        <header className="mb-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerador de Material Interativo</h1>
          <p className="text-gray-500">Transforme PDFs em Calculadoras e Chats de IA para seus alunos</p>
        </header>

        <div className="space-y-6">

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key (Professor)</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Ex: AIzaSy..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">Sua chave é usada apenas localmente para gerar o material.</p>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {file ? (
              <div className="flex flex-col items-center">
                <div className="text-indigo-600 font-medium text-lg mb-1">{file.name}</div>
                <div className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500">
                <FileUp size={48} className="mb-3 text-gray-400" />
                <span className="font-medium">Clique para selecionar um PDF</span>
                <span className="text-sm">ou arraste para cá</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          {status !== 'done' && (
            <button
              onClick={handleProcess}
              disabled={status === 'extracting' || status === 'analyzing' || status === 'generating' || !file || !apiKey}
              className={`w-full py-3 px-6 rounded-lg text-white font-medium text-lg flex items-center justify-center gap-2 transition-all
                ${(status === 'extracting' || status === 'analyzing' || status === 'generating') ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'}
              `}
            >
              {status === 'idle' && <>Começar Processamento</>}
              {status === 'error' && <>Tentar Novamente</>}
              {status === 'extracting' && <><Loader2 className="animate-spin" /> Extraindo Texto...</>}
              {status === 'analyzing' && <><Loader2 className="animate-spin" /> Identificando Equações...</>}
              {status === 'generating' && <><Loader2 className="animate-spin" /> Gerando Calculadora...</>}
            </button>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3">
              <div className="font-bold">Erro:</div>
              <div>{error}</div>
            </div>
          )}

          {/* Success / Download */}
          {status === 'done' && analysisData && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 animate-fade-in">
              <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                <Calculator size={24} />
                Material Gerado com Sucesso!
              </h3>

              <div className="mb-6 space-y-2">
                <p className="text-green-700">Identificamos <strong>{analysisData.equations.length}</strong> equações e geramos o resumo teórico.</p>
                <div className="bg-white p-3 rounded border border-green-100 text-sm text-gray-600 max-h-32 overflow-y-auto">
                  <ul className="list-disc pl-5">
                    {analysisData.equations.map(eq => <li key={eq.id}>{eq.name} ({eq.latex})</li>)}
                  </ul>
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-md flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Baixar App do Aluno (.html)
              </button>

              <button
                onClick={() => setStatus('idle')}
                className="w-full mt-3 py-2 text-green-700 font-medium hover:bg-green-100 rounded text-sm"
              >
                Criar Novo
              </button>
            </div>
          )}

        </div>
      </div>

      <footer className="mt-8 text-center text-gray-400 text-sm">
        <p>Desenvolvido com Gemini AI</p>
      </footer>
    </div>
  );
}

export default App;
