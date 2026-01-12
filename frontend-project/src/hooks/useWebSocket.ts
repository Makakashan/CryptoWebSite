import { useEffect } from "react";
import { useAppDispatch } from "../store/hooks";
import { websocketService } from "../services/websocket";
import { fetchAssets } from "../store/slices/assetsSlice";

export const useWebSocket = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    websocketService.connect("ws://localhost:3000");

    const handlePriceUpdate = () => {
      dispatch(fetchAssets());
    };

    websocketService.subscribe(handlePriceUpdate);

    return () => {
      websocketService.unsubscribe(handlePriceUpdate);
    };
  }, [dispatch]);
};
