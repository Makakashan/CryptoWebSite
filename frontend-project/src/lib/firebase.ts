import { initializeApp, type FirebaseApp } from "firebase/app";
import {
	getAuth,
	signInWithPopup,
	GoogleAuthProvider,
	type Auth,
} from "firebase/auth";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function getFirebaseAuth(): Auth {
	if (!app) {
		app = initializeApp(firebaseConfig);
	}
	if (!auth) {
		auth = getAuth(app);
	}
	return auth;
}

export async function signInWithGoogle(): Promise<string> {
	const firebaseAuth = getFirebaseAuth();
	const provider = new GoogleAuthProvider();
	const result = await signInWithPopup(firebaseAuth, provider);
	const credential = GoogleAuthProvider.credentialFromResult(result);
	if (!credential?.idToken) {
		throw new Error("No ID token received from Google.");
	}
	return credential.idToken;
}

export function isFirebaseConfigured(): boolean {
	return Boolean(
		firebaseConfig.apiKey &&
		firebaseConfig.authDomain &&
		firebaseConfig.projectId,
	);
}
