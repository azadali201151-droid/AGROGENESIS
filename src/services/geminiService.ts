import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;
const HOSTED_BACKUP_URL = "https://ais-pre-ung7uffzsjoqcvgum34w4h-355221024374.asia-east1.run.app";

export function getApiKey(): string {
  const localKey = typeof window !== "undefined" ? localStorage.getItem('agroGenesis_user_api_key') || "" : "";
  const processKey = typeof process !== "undefined" ? process.env.GEMINI_API_KEY || "" : "";
  const importMetaKey = import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY || "" : "";
  return processKey || importMetaKey || localKey || "";
}

export function saveUserApiKey(key: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem('agroGenesis_user_api_key', key.trim());
    aiInstance = null; // reset instance to pick up new key
  }
}

export function deleteUserApiKey() {
  if (typeof window !== "undefined") {
    localStorage.removeItem('agroGenesis_user_api_key');
    aiInstance = null; // reset instance
  }
}

function getAI(): GoogleGenAI {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
}

export interface AnalysisResult {
  diseaseName: string;
  confidence: string;
  symptoms: string[];
  organicTreatment: string;
  chemicalTreatment: string;
  prevention: string;
  careTips: string[];
  detailedAnalysis: string;
  yieldImpact: string;
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

// Unified fetch helper with fully automated fallback to live pre-authenticated Cloud Run
async function fetchFromServer(endpoint: string, body: any): Promise<any> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    });
    if (response.ok) {
       return await response.json();
    }
    throw new Error(`Relative endpoint failed with status: ${response.status}`);
  } catch (err) {
    console.warn(`Relative API fetch to ${endpoint} failed. Directing to pre-authenticated AgroGenesis Cloud Run backups...`, err);
    const backupUrl = `${HOSTED_BACKUP_URL}${endpoint}`;
    const response = await fetch(backupUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(errBody || `AgroGenesis service responded with status: ${response.status}`);
    }
    return await response.json();
  }
}

export async function chatWithAgriBot(message: string, context: AnalysisResult, language: string = "English", history: { role: string; content: string }[] = [], audioBase64?: string): Promise<string> {
  const hasLocalKey = !!getApiKey();

  // If we have an API key configured locally, execute via SDK client-side directly
  if (hasLocalKey) {
    try {
      const systemPrompt = `You are the "Senior Agricultural Pathologist" for the AgriGenesis Intelligence System. You provide professional-grade biological and agronomical advice.
      
CONTEXT OF CURRENT SCAN:
- Biological Agent: ${context.diseaseName}
- Technical Symptoms: ${context.symptoms.join(", ")}
- Proposed Organic Remediation: ${context.organicTreatment}
- Chemical Intervention Strategy: ${context.chemicalTreatment || 'N/A'}
- Harvest Forecast Impact: ${context.yieldImpact}
      
YOUR PROTOCOL:
- You MUST respond in the requested language (${language}).
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

      if (response.text) return response.text;
    } catch (clientErr) {
      console.warn("Client-side direct chat failed, falling back to backend Express proxy:", clientErr);
    }
  }

  // Use the automated Express backend API routes with multi-origin fallback
  const result = await fetchFromServer("/api/chat", {
    message,
    context,
    language,
    history,
    audioBase64
  });

  return result.reply;
}

export async function analyzeCropPhoto(base64Image: string, language: string = "English"): Promise<AnalysisResult> {
  const hasLocalKey = !!getApiKey();

  // If a local key exists, try calling the SDK directly client-side
  if (hasLocalKey) {
    try {
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

      if (response.text) {
        const text = response.text.trim();
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          const jsonContent = text.substring(firstBrace, lastBrace + 1);
          return JSON.parse(jsonContent) as AnalysisResult;
        }
        return JSON.parse(text) as AnalysisResult;
      }
    } catch (clientErr) {
      console.warn("Client-side direct analysis failed, falling back to backend Express proxy:", clientErr);
    }
  }

  // Seamless fallback to unified server analytics endpoint
  return await fetchFromServer("/api/analyze", {
    image: base64Image,
    language
  });
}
