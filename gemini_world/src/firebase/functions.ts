import { httpsCallable } from 'firebase/functions';
import { functions } from './config';

/**
 * Placeholder structure for calling Cloud Functions
 * Specifically for routing AI logic securely.
 */
export async function generateNpcResponse(prompt: string, context: any) {
    try {
        const callAiModel = httpsCallable(functions, 'callAiModel');
        const result = await callAiModel({ prompt, context });
        return result.data;
    } catch (error) {
        console.error("Error calling AI model function:", error);
        return null;
    }
}
