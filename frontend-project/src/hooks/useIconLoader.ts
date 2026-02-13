import { useEffect, useState } from "react";
import { iconLoaderService } from "../services/iconLoader";

interface UseIconLoaderProps {
  symbol: string;
  initialImageUrl: string | null;
  enabled?: boolean;
}

interface UseIconLoaderResult {
  imageUrl: string | null;
  isLoading: boolean;
}

export const useIconLoader = ({
  symbol,
  initialImageUrl,
  enabled = true,
}: UseIconLoaderProps): UseIconLoaderResult => {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialImageUrl || !enabled) {
      setImageUrl(initialImageUrl);
      return;
    }

    let isMounted = true;

    const loadIcon = async () => {
      setIsLoading(true);
      try {
        const url = await iconLoaderService.getIconUrl(symbol);
        if (isMounted && url) {
          setImageUrl(url);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadIcon();

    return () => {
      isMounted = false;
    };
  }, [symbol, initialImageUrl, enabled]);

  return { imageUrl, isLoading };
};
