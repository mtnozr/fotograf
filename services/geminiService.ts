import { GoogleGenAI } from "@google/genai";

export const generatePhotoDescription = async (photoTitle: string, category: string): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return "API anahtarı bulunamadı. Lütfen demo modunda olduğunuzu unutmayın.";
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Sen sanatsal bir fotoğraf eleştirmeni ve şairane bir yazarsın.
      Aşağıdaki özelliklere sahip bir fotoğraf için Türkçe, kısa (maksimum 3 cümle), 
      derinlikli ve minimalist bir betimleme veya hikaye yaz.
      
      Fotoğraf Başlığı: ${photoTitle}
      Kategori: ${category}
      
      Ton: Melankolik, huzurlu ve estetik.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || "Bir hikaye oluşturulamadı.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Şu anda bağlantı kurulamıyor, ancak bu fotoğrafın anlatacak çok şeyi var.";
  }
};