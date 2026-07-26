import { GoogleGenAI, Type } from "@google/genai";

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
    severity: { type: Type.STRING },
    spreadRate: { type: Type.STRING },
    economicUrgency: { type: Type.STRING },
    recoveryTime: { type: Type.STRING },
    identifiedPlant: { type: Type.STRING },
    botanicalName: { type: Type.STRING },
    plantHealthStatus: { type: Type.STRING },
    chlorophyllIndex: { type: Type.STRING },
    pathogenType: { type: Type.STRING },
  },
  required: [
    "diseaseName", 
    "confidence", 
    "symptoms", 
    "organicTreatment", 
    "chemicalTreatment", 
    "prevention", 
    "careTips", 
    "detailedAnalysis", 
    "yieldImpact",
    "severity",
    "spreadRate",
    "economicUrgency",
    "recoveryTime",
    "identifiedPlant",
    "botanicalName",
    "plantHealthStatus",
    "chlorophyllIndex",
    "pathogenType"
  ]
};

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
    const { image, language, apiKey: requestApiKey } = req.body;
    const lang = language || "English";

    if (!image) {
      res.status(400).json({ error: "No crop preview image was provided." });
      return;
    }

    const apiKey = requestApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "AIzaSyCKaN06GPUo2--GPP8pfdr8lPciRjXhRUc") {
      res.status(500).json({ error: "GEMINI_API_KEY_MISSING" });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `ACT AS A SENIOR PLANT PATHOLOGIST AND AGRICULTURAL EXPERT.
Analyze this high-resolution image of a crop/plant with 100% technical rigor.

TASK:
0. IF THE IMAGE DOES NOT CONTAIN A CLEAR PLANT, LEAF, OR CROP, respond with 'diseaseName': "No Plant Detected", and leave other fields empty or "N/A".
1. IDENTIFY the specific plant species and variety if possible (e.g. Wheat - Kalyan Sona, Tomato - Roma VF). Use 'identifiedPlant' for the common name (translated) and 'botanicalName' for the standard scientific Latin name.
2. DIAGNOSE with extreme precision whether the plant is Healthy or suffering from a specific Disease, Pest Infestation, or Nutrient Deficiency.
3. PROVIDE an expert-level pathological breakdown in the 'detailedAnalysis' field.
4. ESTIMATE the potential yield loss if left untreated in the 'yieldImpact' field.
5. ASSESS 'severity': current percentage of foliage infected / lesion depth (e.g. Low / Incipient, Moderate, Stage 3 Severe Infestation, or Healthy / Optimal), translated.
6. SPECIFY 'spreadRate': transmission speed and main vector (e.g., Fast via water-splash spores, High via airborne breeze, Localized soil drift, or N/A), translated.
7. DEFINE 'economicUrgency': recommended professional timeline to apply treatments to prevent visual decay or cash-crop loss (e.g., Action required within 48 hours, preventative next 3 days, continuous routine care), translated.
8. ESTIMATE 'recoveryTime': expected days of continuous treatment for the crops to show complete cell healing/recovery (e.g., 10-14 days, 14-21 days of selective pruning, or N/A), translated.
9. ASSESS 'plantHealthStatus': general state description of plant's physiological and health conditions (e.g., "Optimal active chloroplast structure", "Acute marginal chlorosis", "Severe wilting and leaf decay"), translated.
10. ASSESS 'chlorophyllIndex': estimated relative leaf-color index/wellness (e.g. "Optimal (SPAD 45.8)", "Chlorotic Deficiency (SPAD 18.2)", "Healthy Vigorous Green"), translated.
11. ASSESS 'pathogenType': category under classification (e.g., "Fungal - Ascomycota", "Water Mold - Chromista/Oomycota", "Abiotic Nutrient Stress", "Abiotic Water Stress"), translated.

CONSTRAINTS:
- ALL values for the fields in the returned JSON object MUST be translated and written EXCLUSIVELY in the ${lang} language.
- Exception: The 'botanicalName' MUST remain in the standard Latin scientific format (e.g. Triticum aestivum), italicized if possible.
- If the requested language is not English, you must translate all fields appropriately and avoid mixing English words into the output. Ensure the translation is natural and accurate for high-grade agricultural diagnostics.
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

    res.status(200).json(parsedResult);
  } catch (error: any) {
    console.error("Vercel Serverless Analysis Exception:", error);
    res.status(500).json({ error: error?.message || "Failed to process image analysis." });
  }
}
