import { GoogleGenerativeAI } from "@google/generative-ai";

export const analyzePdfContent = async (text, apiKey) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
    Você é um assistente educacional especializado. Analise o seguinte texto extraído de um PDF e extraia as equações matemáticas/físicas e o conteúdo teórico.
    
    Retorne APENAS um objeto JSON com a seguinte estrutura (sem markdown):
    {
      "title": "Título do Tópico Principal",
      "summary": "Resumo teórico abrangente do conteúdo (markdown suportado)",
      "equations": [
        {
          "id": "eq1",
          "name": "Nome da Equação (ex: Segunda Lei de Newton)",
          "latex": "F = m * a",
          "description": "Explicação do que a equação calcula.",
          "variables": [
             { "symbol": "F", "name": "Força", "unit": "N", "type": "output" },
             { "symbol": "m", "name": "Massa", "unit": "kg", "type": "input" },
             { "symbol": "a", "name": "Aceleração", "unit": "m/s²", "type": "input" }
          ]
        }
      ]
    }

    TEXTO DO PDF:
    ${text.substring(0, 30000)} // Limit context for safety
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const textResponse = response.text();

  // Clean markdown code blocks if present
  const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(jsonString);
};

export const generateCalculatorLogic = async (equations, apiKey) => {
  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `
    Com base nas seguintes equações identificadas, gere um código Javascript PURO (sem React/frameworks) que contenha uma função para realizar os cálculos.
    
    Equações: ${JSON.stringify(equations)}

    Retorne APENAS o código Javascript (sem markdown) contendo:
    1. Uma função 'calculateResults(inputs)' onde 'inputs' é um objeto { simbolo: valor }.
    2. A função deve retornar um objeto { simbolo_output: valor_calculado }.
    3. Trate erros (divisão por zero, etc).
    
    Exemplo de saída esperada:
    function calculateResults(inputs) {
       const results = {};
       // Lógica para eq1
       if (inputs.m !== undefined && inputs.a !== undefined) {
         results.F = inputs.m * inputs.a;
       }
       return results;
    }
  `;

  const textResponse = await generateWithFallback(genAI, prompt);
  return textResponse.replace(/```javascript/g, '').replace(/```js/g, '').replace(/```/g, '').trim();
};
