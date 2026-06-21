import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // CORS support
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  try {
    const { message, context, language, history, audioBase64, apiKey: requestApiKey } = req.body;
    const lang = language || "English";

    const apiKey = requestApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "AIzaSyCKaN06GPUo2--GPP8pfdr8lPciRjXhRUc") {
      res.status(500).json({ error: "GEMINI_API_KEY_MISSING" });
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

    res.status(200).json({ reply: response.text });
  } catch (error: any) {
    console.error("Vercel Serverless Chat Exception:", error);
    res.status(500).json({ error: error?.message || "Failed to reply to bot chat." });
  }
}
