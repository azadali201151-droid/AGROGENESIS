import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

// Set up body parsers with generous limits for cross-section leaf sample images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Enable CORS for static clients (like Vercel and GitHub Pages deployments)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Response schema for crop/plant diagnostic analysis
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

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy",
    system: "AgroGenesis Intelligence System Server",
    timestamp: new Date().toISOString()
  });
});

// API endpoint for Crop Photo Analysis
app.post("/api/analyze", async (req: express.Request, res: express.Response) => {
  try {
    const { image, language } = req.body;
    const lang = language || "English";

    if (!image) {
       res.status(400).json({ error: "No crop preview image was provided." });
       return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
       res.status(500).json({ error: "GEMINI_API_KEY is not configured on the hosted platform." });
       return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `ACT AS A SENIOR PLANT PATHOLOGIST AND AGRICULTURAL EXPERT.
Analyze this high-resolution image of a crop/plant with 100% technical rigor.

TASK:
1. IDENTIFY the specific plant species and variety if possible.
2. DIAGNOSE with extreme precision whether the plant is Healthy or suffering from a specific Disease, Pest Infestation, or Nutrient Deficiency.
3. PROVIDE an expert-level pathological breakdown in the 'detailedAnalysis' field.
4. ESTIMATE the potential yield loss if left untreated in the 'yieldImpact' field.

CONSTRAINTS:
- ALL values for the fields in the returned JSON object MUST be translated and written EXCLUSIVELY in the ${lang} language. For example, if ${lang} is Sindhi, every single string value in the resulting parsed JSON object MUST be written in Sindhi script (Arabic-based script).
- Do not use English words or Latin alphabet. Ensure the translation is natural and accurate for high-grade agricultural diagnostics.
- 'organicTreatment' and 'chemicalTreatment' must be highly detailed, including specific steps.
- Return a structured JSON response matching the required schema.
- DO NOT provide medical advice for humans, ONLY agricultural guidance for plants.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: image,
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
       res.status(500).json({ error: "Empty reply from Gemini services." });
       return;
    }

    const text = response.text.trim();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    let parsedResult;
    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonContent = text.substring(firstBrace, lastBrace + 1);
      parsedResult = JSON.parse(jsonContent);
    } else {
      parsedResult = JSON.parse(text);
    }

    res.json(parsedResult);
  } catch (error: any) {
    console.error("Analysis Exception:", error);
    res.status(500).json({ error: error?.message || "Failed to process image analysis." });
  }
});

// API endpoint for AgriBot Chat
app.post("/api/chat", async (req: express.Request, res: express.Response) => {
  try {
    const { message, context, language, history, audioBase64 } = req.body;
    const lang = language || "English";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
       res.status(500).json({ error: "GEMINI_API_KEY is not configured on the hosted server." });
       return;
    }

    const systemPrompt = `You are the "Senior Agricultural Pathologist" for the AgriGenesis Intelligence System. You provide professional-grade biological and agronomical advice.
  
CONTEXT OF CURRENT SCAN:
- Biological Agent: ${context?.diseaseName || "Healthy / Unknown"}
- Technical Symptoms: ${(context?.symptoms || []).join(", ")}
- Proposed Organic Remediation: ${context?.organicTreatment || "N/A"}
- Chemical Intervention Strategy: ${context?.chemicalTreatment || "N/A"}
- Harvest Forecast Impact: ${context?.yieldImpact || "N/A"}

YOUR PROTOCOL:
- You MUST respond in the requested language (${lang}).
- Provide direct, expert technical answers.`;

    const contents: any[] = (history || []).map((msg: any) => ({
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

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    if (!response.text) {
       res.status(500).json({ error: "Empty reply from AI assistant." });
       return;
    }

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Chat Exception:", error);
    res.status(500).json({ error: error?.message || "Failed to reply to bot chat." });
  }
});

// Set up entry points for Vite or Statics
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AgroGenesis] Server launched successfully on http://localhost:${PORT}`);
  });
}

startServer();
