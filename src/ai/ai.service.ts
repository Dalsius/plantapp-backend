import { Injectable, BadRequestException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface PlantAnalysis {
  name: string;
  species: string;
  light: string;
  waterEveryDays: number;
  careNotes: string;
  toxic: boolean;
}

@Injectable()
export class AiService {
  private genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  async identifyPlant(base64Image: string, mediaType = 'image/jpeg'): Promise<PlantAnalysis> {
    console.log('GEMINI KEY:', process.env.GEMINI_API_KEY?.slice(0, 10));
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent([
      {
        inlineData: { data: base64Image, mimeType: mediaType }
      },
      `Eres un experto botánico. Identifica esta planta y responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código, solo el JSON:
{
  "name": "nombre común en español",
  "species": "nombre científico",
  "light": "descripción de luz necesaria",
  "waterEveryDays": número de días entre riegos,
  "careNotes": "descripción detallada de cuidados en español",
  "toxic": true o false para mascotas
}`
    ]);

    try {
      const text = result.response.text();
      const clean = text.replace(/\`\`\`json|\`\`\`/g, '').trim();
      return JSON.parse(clean) as PlantAnalysis;
    } catch {
      throw new BadRequestException('No se pudo identificar la planta. Intenta con otra foto.');
    }
  }
}