import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import assetsSlice from "./slices/assetsSlice";
import portfolioSlice from "./slices/portfolioSlice";
import ordersSlice from "./slices/ordersSlice";

export const store = configureStore({
	reducer: {
		auth: authSlice,
		assets: assetsSlice,
		portfolio: portfolioSlice,
		orders: ordersSlice,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
