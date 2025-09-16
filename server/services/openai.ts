import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ProductSearchQuery {
  keywords: string[];
  category?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  features?: string[];
  brand?: string;
}

export async function processProductDescription(description: string): Promise<ProductSearchQuery> {
  try {
    const systemPrompt = `You are a product search expert. Extract search parameters from natural language product descriptions. 
    Respond with JSON in this format: {
      "keywords": ["keyword1", "keyword2"],
      "category": "category_name",
      "priceRange": {"min": number, "max": number},
      "features": ["feature1", "feature2"],
      "brand": "brand_name"
    }
    Only include fields that are explicitly mentioned or strongly implied.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            keywords: { type: "array", items: { type: "string" } },
            category: { type: "string" },
            priceRange: { 
              type: "object",
              properties: {
                min: { type: "number" },
                max: { type: "number" }
              }
            },
            features: { type: "array", items: { type: "string" } },
            brand: { type: "string" }
          }
        }
      },
      contents: description,
    });

    const result = response.text;
    return result ? JSON.parse(result) : {};
  } catch (error) {
    console.error("Gemini processing error:", error);
    // Fallback to basic keyword extraction
    return {
      keywords: description.split(" ").filter(word => word.length > 2)
    };
  }
}

export async function analyzeProductImage(base64Image: string): Promise<ProductSearchQuery> {
  try {
    const systemPrompt = `Analyze this product image and extract search parameters. Identify the product type, brand (if visible), key features, and category. 
    Respond with JSON in this format: {
      "keywords": ["keyword1", "keyword2"],
      "category": "category_name",
      "features": ["feature1", "feature2"],
      "brand": "brand_name"
    }`;

    const contents = [
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
      systemPrompt,
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            keywords: { type: "array", items: { type: "string" } },
            category: { type: "string" },
            features: { type: "array", items: { type: "string" } },
            brand: { type: "string" }
          }
        }
      },
      contents: contents,
    });

    const result = response.text;
    return result ? JSON.parse(result) : {};
  } catch (error) {
    console.error("Gemini image analysis error:", error);
    throw new Error("Failed to analyze image: " + (error as Error).message);
  }
}

export async function generateChatResponse(
  userMessage: string, 
  searchContext: string,
  productCount: number
): Promise<string> {
  try {
    const systemPrompt = `You are a helpful shopping assistant. Help users refine their product searches and find what they're looking for. 
    Current search context: ${searchContext}
    Number of products found: ${productCount}
    
    Provide helpful, concise responses that guide users to better search results.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      contents: userMessage,
    });

    return response.text || "I'm here to help you find the perfect products!";
  } catch (error) {
    console.error("Gemini chat error:", error);
    return "I'm having trouble responding right now. Please try again.";
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    // Note: Gemini doesn't have built-in audio transcription
    // For now, we'll return a fallback message and suggest text input
    console.log("Audio transcription not available with Gemini - using fallback");
    throw new Error("Audio transcription temporarily unavailable. Please try typing your search instead.");
  } catch (error) {
    console.error("Audio transcription error:", error);
    throw new Error("Audio transcription temporarily unavailable. Please try typing your search instead.");
  }
}
