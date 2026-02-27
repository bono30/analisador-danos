export const generateStudentHtml = (analysisData, calculatorLogic) => {
    // We embed the JSON data and the logic directly into the HTML
    const sanitizedData = JSON.stringify(analysisData).replace(/</g, '\\u003c');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${analysisData.title || 'Material de Estudo'}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="importmap">
      {
        "imports": {
          "@google/generative-ai": "https://esm.run/@google/generative-ai"
        }
      }
    </script>
    <style>
      body { font-family: 'Inter', sans-serif; }
      .markdown-body h1 { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; }
      .markdown-body p { margin-bottom: 0.5rem; }
    </style>
</head>
<body class="bg-gray-50 min-h-screen text-gray-800">
    <div class="max-w-4xl mx-auto p-6">
        <header class="mb-8 text-center">
            <h1 class="text-3xl font-bold text-indigo-700">${analysisData.title || 'Ferramenta de Estudo Interativo'}</h1>
            <p class="text-gray-600">Material gerado automaticamente</p>
        </header>

        <!-- Tabs -->
        <div class="flex border-b border-gray-200 mb-6">
            <button onclick="switchTab('theory')" id="tab-theory" class="flex-1 py-2 px-4 text-center border-b-2 border-indigo-500 font-medium text-indigo-600">Teoria & Chat</button>
            <button onclick="switchTab('calculator')" id="tab-calculator" class="flex-1 py-2 px-4 text-center border-b-2 border-transparent hover:border-gray-300">Calculadora Interativa</button>
        </div>

        <!-- Content: Theory -->
        <div id="content-theory" class="block">
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <h2 class="text-xl font-semibold mb-4">Resumo Teórico</h2>
                <div id="theory-content" class="markdown-body prose max-w-none text-gray-700"></div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span>🤖 Tutor IA</span>
                </h2>
                <div class="mb-4 bg-yellow-50 p-3 rounded text-sm text-yellow-800">
                    Para usar o chat, você precisa de uma API Key do Google Gemini.
                </div>
                <div class="flex gap-2 mb-4">
                    <input type="password" id="api-key-input" placeholder="Cole sua Gemini API Key aqui" class="flex-1 p-2 border rounded">
                    <button onclick="saveKey()" class="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700">Salvar Chave</button>
                </div>
                
                <div id="chat-history" class="h-64 overflow-y-auto border rounded p-4 mb-4 bg-gray-50 space-y-3">
                    <div class="text-center text-gray-400 text-sm">Faça uma pergunta sobre o conteúdo acima!</div>
                </div>
                
                <div class="flex gap-2">
                    <input type="text" id="chat-input" placeholder="Pergunte algo sobre a teoria..." class="flex-1 p-2 border rounded" onkeypress="handleEnter(event)">
                    <button onclick="sendMessage()" class="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">Enviar</button>
                </div>
            </div>
        </div>

        <!-- Content: Calculator -->
        <div id="content-calculator" class="hidden">
            <div class="grid gap-6">
                ${generateCalculatorUi(analysisData.equations)}
            </div>
            <div id="results-area" class="mt-6 p-4 bg-green-50 rounded hidden border border-green-200">
                <h3 class="font-bold text-green-800 mb-2">Resultados:</h3>
                <div id="results-content" class="grid grid-cols-2 gap-4"></div>
            </div>
        </div>

    </div>

    <!-- Logic -->
    <script type="module">
        import { GoogleGenerativeAI } from "@google/generative-ai";
        import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

        const studyData = ${sanitizedData};
        
        // Render markdown summary
        document.getElementById('theory-content').innerHTML = marked.parse(studyData.summary || '');

        // Generate Calculator Logic
        ${calculatorLogic}

        // Tab Switching
        window.switchTab = function(tab) {
            document.getElementById('content-theory').classList.toggle('hidden', tab !== 'theory');
            document.getElementById('content-calculator').classList.toggle('hidden', tab !== 'calculator');
            
            document.getElementById('tab-theory').className = tab === 'theory' 
                ? "flex-1 py-2 px-4 text-center border-b-2 border-indigo-500 font-medium text-indigo-600 transition-colors"
                : "flex-1 py-2 px-4 text-center border-b-2 border-transparent hover:border-gray-300 text-gray-500 transition-colors";
            document.getElementById('tab-calculator').className = tab === 'calculator'
                ? "flex-1 py-2 px-4 text-center border-b-2 border-indigo-500 font-medium text-indigo-600 transition-colors"
                : "flex-1 py-2 px-4 text-center border-b-2 border-transparent hover:border-gray-300 text-gray-500 transition-colors";
        }

        // Attach calc logic to window if needed or just use event listeners (better).
        // But since we use onclick in HTML, we need window.
        window.runCalculation = function() {
            const inputs = {};
            document.querySelectorAll('.calc-input').forEach(input => {
                const val = parseFloat(input.value);
                if (!isNaN(val)) {
                    inputs[input.dataset.symbol] = val;
                }
            });

            console.log("Inputs:", inputs);
            try {
                const results = calculateResults(inputs);
                console.log("Results:", results);

                const resultsDiv = document.getElementById('results-content');
                resultsDiv.innerHTML = '';
                
                if (Object.keys(results).length > 0) {
                    document.getElementById('results-area').classList.remove('hidden');
                    for (const [key, value] of Object.entries(results)) {
                        // Find unit and name from data
                        let unit = '';
                        let name = key;
                        // Simple lookup
                        studyData.equations.forEach(eq => {
                            if(eq.variables) {
                                const v = eq.variables.find(v => v.symbol === key);
                                if (v) {
                                    unit = v.unit || '';
                                    name = v.name || key;
                                }
                            }
                        });

                        const resItem = document.createElement('div');
                        resItem.className = 'bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center';
                        resItem.innerHTML = \`<div class="text-xs text-gray-500 uppercase tracking-wide">\${name} (\${key})</div><div class="text-2xl font-bold text-green-600 mt-1">\${value.toFixed(2)} <span class="text-sm text-gray-400 font-normal">\${unit}</span></div>\`;
                        resultsDiv.appendChild(resItem);
                    }
                }
            } catch (e) {
                console.error("Calculation error", e);
            }
        }

        // Chat Logic
        let apiKey = localStorage.getItem('gemini_api_key') || '';
        if(apiKey) document.getElementById('api-key-input').value = '********';

        window.saveKey = function() {
            const input = document.getElementById('api-key-input');
            if(input.value && input.value !== '********') {
                apiKey = input.value;
                localStorage.setItem('gemini_api_key', apiKey);
                alert('Chave salva com sucesso!');
            }
        }

        window.handleEnter = function(e) {
            if(e.key === 'Enter') window.sendMessage();
        }

         window.sendMessage = async function() {
            const input = document.getElementById('chat-input');
            const history = document.getElementById('chat-history');
            const msg = input.value.trim();
            if(!msg) return;

            if(!apiKey) {
                alert('Por favor, configure sua API Key primeiro.');
                return;
            }

            // User msg
            history.innerHTML += \`<div class="text-right mb-2"><span class="inline-block bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-tr-none shadow-sm">\${msg}</span></div>\`;
            input.value = '';
            history.scrollTop = history.scrollHeight;

            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                
                // Fallback Logic
                async function generateWithFallback(prompt) {
                  const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.5-flash-001", "gemini-pro"];
                  let lastError = null;
                  for (const modelName of modelsToTry) {
                    try {
                      console.log(\`Trying model: \${modelName}\`);
                      const model = genAI.getGenerativeModel({ model: modelName });
                      const result = await model.generateContent(prompt);
                      const response = await result.response;
                      return response.text();
                    } catch (error) {
                      console.warn(\`Model \${modelName} failed:\`, error.message);
                      lastError = error;
                    }
                  }
                  throw new Error(\`Todos os modelos falharam. Verifique sua chave API.\`);
                }

                const prompt = \`Você é um tutor paciente e didático. Use o seguinte contexto teórico para responder à dúvida do aluno.
                
                Contexto: \${studyData.summary}
                
                Dúvida: \${msg}
                
                Responda em português, use markdown para formatar.\`;

                const text = await generateWithFallback(prompt);

                // Bot msg
                history.innerHTML += \`<div class="text-left mb-2"><span class="inline-block bg-white border border-gray-200 text-gray-800 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm prose prose-sm">\${marked.parse(text)}</span></div>\`;
                history.scrollTop = history.scrollHeight;

            } catch (err) {
                console.error(err);
                history.innerHTML += \`<div class="text-center text-red-500 text-xs my-2">Erro ao conectar com IA: \${err.message}</div>\`;
            }
        }
    </script>
</body>
</html>`;
};

// Helper to generate Calculator UI Inputs
function generateCalculatorUi(equations) {
    return equations.map(eq => `
    <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 class="font-bold text-lg mb-2 text-gray-800">${eq.name}</h3>
        <div class="text-sm text-gray-500 mb-4 font-mono bg-gray-50 p-2 rounded inline-block">${eq.latex}</div>
        <p class="text-sm text-gray-600 mb-4">${eq.description}</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${eq.variables.filter(v => v.type === 'input').map(v => `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${v.name} (${v.symbol})</label>
                    <div class="flex">
                        <input type="number" class="calc-input flex-1 border-gray-300 border rounded-l px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" 
                               placeholder="${v.name}" data-symbol="${v.symbol}" oninput="runCalculation()">
                        <span class="bg-gray-100 border border-l-0 border-gray-300 rounded-r px-3 py-2 text-gray-500 text-sm flex items-center">
                            ${v.unit}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
  `).join('');
}
