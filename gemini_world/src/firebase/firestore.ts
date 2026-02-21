import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * Placeholder structure for saving the player's world state
 */
export async function savePlayerState(userId: string, state: any) {
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, { worldState: state }, { merge: true });
        console.log("Player state saved.");
    } catch (error) {
        console.error("Error saving player state:", error);
    }
}

export async function loadPlayerState(userId: string) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return userSnap.data().worldState;
        }
        return null;
    } catch (error) {
        console.error("Error loading player state:", error);
        return null;
    }
}
