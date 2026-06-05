import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = (typeof process !== "undefined" ? process.env.GEMINI_API_KEY : "") || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export interface AnalysisResult {
  diseaseName: string;
  confidence: string;
  symptoms: string[];
  organicTreatment: string;
  chemicalTreatment: string;
  prevention: string;
  careTips: string[];
  detailedAnalysis: string; // New field for expert-level detail
  yieldImpact: string;      // New field for economic/harvest impact
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    diseaseName: { type: Type.STRING },
    confidence: { type: Type.STRING },
    symptoms: { 
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    organicTreatment: { type: Type.STRING },
    chemicalTreatment: { type: Type.STRING },
    prevention: { type: Type.STRING },
    careTips: { 
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    detailedAnalysis: { type: Type.STRING },
    yieldImpact: { type: Type.STRING },
  },
  required: ["diseaseName", "confidence", "symptoms", "organicTreatment", "chemicalTreatment", "prevention", "careTips", "detailedAnalysis", "yieldImpact"]
};

export async function chatWithAgriBot(message: string, context: AnalysisResult, language: string = "English", history: { role: string; content: string }[] = [], audioBase64?: string): Promise<string> {
  const isFirstMessage = history.length === 0;
  
  const systemPrompt = `You are the "Senior Agricultural Pathologist" for the AgriGenesis Intelligence System. You provide professional-grade biological and agronomical advice.
  
  CONTEXT OF CURRENT SCAN:
  - Biological Agent: ${context.diseaseName}
  - Technical Symptoms: ${context.symptoms.join(", ")}
  - Proposed Organic Remediation: ${context.organicTreatment}
  - Chemical Intervention Strategy: ${context.chemicalTreatment || 'N/A'}
  - Harvest Forecast Impact: ${context.yieldImpact}
  
  YOUR PROTOCOL:
  - You MUST respond in the requested language.
  - Provide direct, expert technical answers.`;

  const contents: any[] = history.map(msg => ({
    role: msg.role === 'bot' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const userParts: any[] = [{ text: message || (audioBase64 ? "The user provided a voice message." : "") }];
  
  if (audioBase64) {
    userParts.push({
      inlineData: {
        mimeType: "audio/webm",
        data: audioBase64
      }
    });
  }

  contents.push({ role: 'user', parts: userParts });

  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: contents,
    config: {
      systemInstruction: systemPrompt,
    }
  });

  if (!response.text) {
    throw new Error("No response from assistant");
  }

  return response.text;
}

export async function analyzeCropPhoto(base64Image: string, language: string = "English"): Promise<AnalysisResult> {
  const prompt = `ACT AS A SENIOR PLANT PATHOLOGIST AND AGRICULTURAL EXPERT.
  Analyze this high-resolution image of a crop/plant with 100% technical rigor.
  
  TASK:
  1. IDENTIFY the specific plant species and variety if possible.
  2. DIAGNOSE with extreme precision whether the plant is Healthy or suffering from a specific Disease, Pest Infestation, or Nutrient Deficiency.
  3. PROVIDE an expert-level pathological breakdown in the 'detailedAnalysis' field.
  4. ESTIMATE the potential yield loss if left untreated in the 'yieldImpact' field.
  
  CONSTRAINTS:
  - ALL values for the fields in the returned JSON object MUST be translated and written EXCLUSIVELY in the ${language} language. For example, if ${language} is Sindhi, every single string value in the resulting parsed JSON object MUST be written in Sindhi script (Arabic-based script).
  - Do not use English words or Latin alphabet. Ensure the translation is natural and accurate for high-grade agricultural diagnostics.
  - 'organicTreatment' and 'chemicalTreatment' must be highly detailed, including specific steps.
  - Return a structured JSON response matching the required schema.
  - DO NOT provide medical advice for humans, ONLY agricultural guidance for plants.`;

  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema as any,
    },
  });

  if (!response.text) {
    throw new Error("No response from AI analysis");
  }

  try {
    // Robust parsing: extract JSON from string if there's any prefix/suffix
    const text = response.text.trim();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonContent = text.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonContent) as AnalysisResult;
    }
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("JSON Parse Error. Raw text:", response.text);
    throw new Error("Failed to parse analysis results. Please try again.");
  }
}
