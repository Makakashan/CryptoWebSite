import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import "./i18n/config";
import "./index.css";
import App from "./App.tsx";

// Unregister any existing Service Workers in dev to avoid reload loops
if (!import.meta.env.PROD && "serviceWorker" in navigator) {
	navigator.serviceWorker.getRegistrations().then((registrations) => {
		registrations.forEach((registration) => {
			registration.unregister();
		});
	});
}

// Register Service Worker only in production
if (import.meta.env.PROD && "serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker
			.register("/service-worker.js")
			.then((registration) => {
				console.log("Service Worker registered:", registration.scope);
			})
			.catch((error) => {
				console.error("Service Worker registration failed:", error);
			});
	});
}

createRoot(document.getElementById("root")!).render(
	<Provider store={store}>
		<App />
	</Provider>,
);
