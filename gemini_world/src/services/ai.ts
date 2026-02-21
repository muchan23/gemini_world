export async function generateCharacterSprite(prompt: string): Promise<string> {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
        console.warn("VITE_GEMINI_API_KEY is missing. AI character generation skipped.");
        return '';
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instances: [{ prompt: prompt }],
                parameters: { sampleCount: 1 }
            })
        });

        const data = await response.json();
        if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
            return `data:image/jpeg;base64,${data.predictions[0].bytesBase64Encoded}`;
        } else {
            console.error("Failed to generate image from Gemini API:", data);
            return '';
        }
    } catch (error) {
        console.error("Error calling Imagen API:", error);
        return '';
    }
}

export async function generateBackgroundMusic(prompt: string): Promise<string> {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
        console.warn("VITE_GEMINI_API_KEY is missing. Lyria BGM generation skipped.");
        return '';
    }

    // NOTE: Google Gemini Lyria model does not have a public AI Studio REST API endpoint for audio generation yet.
    // This serves as the integration point for when the Lyria audio generation API is exposed.
    console.log(`[Lyria BGM Request] Prompt: ${prompt}`);

    // Return an empty string or a placeholder audio URL here once available.
    return '';
}
