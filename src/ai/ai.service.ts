import { Injectable, BadRequestException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

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
  private client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  async identifyPlant(base64Image: string, mediaType = 'image/jpeg'): Promise<PlantAnalysis> {
    const response = await this.client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `Eres un experto botánico. Identifica esta planta y responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código, solo el JSON:
{
  "name": "nombre común en español",
  "species": "nombre científico",
  "light": "descripción de luz necesaria",
  "waterEveryDays": número de días entre riegos,
  "careNotes": "descripción detallada de cuidados en español",
  "toxic": true o false para mascotas
}`,
            },
          ],
        },
      ],
    });

    try {
      const text = response.content
        .filter((b) => b.type === 'text')
        .map((b) => (b as { type: 'text'; text: string }).text)
        .join('');

      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean) as PlantAnalysis;
    } catch {
      throw new BadRequestException('No se pudo identificar la planta. Intenta con otra foto.');
    }
  }
}
