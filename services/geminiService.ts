import { GoogleGenAI, Modality } from "@google/genai";
import { CreateFunction, EditFunction, ImageData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getCreativePrompt = (prompt: string, func: CreateFunction): string => {
    switch (func) {
        case CreateFunction.Sticker:
            return `A die-cut sticker of ${prompt}, vector art, vibrant colors, white background.`;
        case CreateFunction.Text:
            return `A clean, modern logo for a company named "${prompt}". Minimalist design, vector graphic.`;
        case CreateFunction.Comic:
            return `${prompt}, in a dynamic American comic book style, bold lines, vibrant colors, halftone dots.`;
        case CreateFunction.Pixar:
            return `${prompt}, in the distinct visual style of a Disney Pixar animated film, 3D render, vibrant, expressive character design.`;
        case CreateFunction.VectorCartoon:
            return `${prompt}, vector cartoon style, clean bold lines, flat vibrant colors, high resolution, minimalist, no gradients.`;
        case CreateFunction.Free:
        default:
            return prompt;
    }
};

const getPalettePromptSuffix = (paletteId: string): string => {
    switch (paletteId) {
        case 'vibrant':
            return ', using a vibrant, high-contrast color palette.';
        case 'pastel':
            return ', using a soft, pastel color palette.';
        case 'monochrome':
            return ', using a monochrome, black and white, or grayscale color palette.';
        case 'earthy':
            return ', using an earthy color palette with browns, greens, and muted tones.';
        case 'neon':
            return ', using a futuristic, neon color palette with glowing, electric colors.';
        case 'church':
            return ', using a color palette inspired by old churches with colors like off-white, deep blue, teal, terracotta, and antique gold.';
        case 'none':
        default:
            return '';
    }
}

export const generateCreativeImage = async (prompt: string, func: CreateFunction, aspectRatio: string, paletteId: string): Promise<string> => {
    let finalPrompt = getCreativePrompt(prompt, func);
    finalPrompt += getPalettePromptSuffix(paletteId);
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: finalPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: aspectRatio,
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("Image generation failed, no images returned.");
    }
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
};

export const editImageFromPrompt = async (
    prompt: string,
    images: ImageData[],
    paletteId: string
): Promise<string> => {
    
    const imageParts = images.map(image => ({
        inlineData: {
            data: image.base64,
            mimeType: image.mimeType,
        },
    }));

    const finalPrompt = prompt + getPalettePromptSuffix(paletteId);
    const contentParts = [...imageParts, { text: finalPrompt }];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: contentParts,
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }
    
    throw new Error("Image editing failed, no image returned in response.");
};