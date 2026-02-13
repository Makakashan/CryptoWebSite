import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { memo, useEffect, useRef, useState } from "react";
import type {
  AssetCardProps,
  PriceFlash,
} from "../store/types/components.types";
import { formatPrice } from "../utils/formatPrice";
import Card from "./ui/card";
import MiniChart from "./MiniChart";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useAppSelector } from "../store/hooks";
import { useIconLoader } from "../hooks/useIconLoader";
import {
  EMPTY_CHART_DATA,
  INTERSECTION_OBSERVER_OPTIONS,
  CHART_COLORS,
} from "../constants";

const AssetCard = memo(({ asset }: AssetCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [priceFlash, setPriceFlash] = useState<PriceFlash>(null);
  const prevPriceRef = useRef<number>(0);

  const chartData = useAppSelector(
    (state) => state.assets.chartData[asset.symbol] || EMPTY_CHART_DATA,
  );

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, INTERSECTION_OBSERVER_OPTIONS);

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const shortName = asset.symbol.replace("USDT", "");
  const defaultIcon = `https://ui-avatars.com/api/?name=${shortName}&background=random&size=48`;
  const price = asset.price || asset.current_price || 0;
  const priceChange = asset.price_change_24h || 0;
  const isPositive = priceChange >= 0;

  useEffect(() => {
    if (prevPriceRef.current > 0 && price !== prevPriceRef.current) {
      const flash: PriceFlash = price > prevPriceRef.current ? "up" : "down";

      requestAnimationFrame(() => {
        setPriceFlash(flash);
        setTimeout(() => setPriceFlash(null), 600);
      });
    }
    prevPriceRef.current = price;
  }, [price]);

  const chartColor = isPositive ? CHART_COLORS.POSITIVE : CHART_COLORS.NEGATIVE;

  const handleClick = () => {
    navigate(`/markets/${asset.symbol}`);
  };

  return (
    <Card
      ref={cardRef}
      className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-blue hover:shadow-[0_8px_24px_rgba(56,97,251,0.25)] overflow-hidden p-5"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-4 h-full">
        <div className="flex flex-col justify-between min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-3">
            <AssetImage
              key={asset.symbol}
              symbol={asset.symbol}
              initialImageUrl={asset.image_url}
              shortName={shortName}
              defaultIcon={defaultIcon}
            />
            <div className="min-w-0">
              <h3 className="text-base font-bold text-text-primary m-0 truncate">
                {shortName}
              </h3>
              <div className="text-xs text-text-secondary truncate">
                {asset.symbol}
              </div>
            </div>
          </div>

          <div className="mb-2">
            <div
              className={`text-xl font-bold mb-1 transition-all duration-300 ${
                priceFlash === "up"
                  ? "text-green scale-105"
                  : priceFlash === "down"
                    ? "text-red scale-105"
                    : "text-text-primary scale-100"
              }`}
            >
              {formatPrice(price)}
            </div>

            {priceChange !== 0 && (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1">
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${
                      isPositive
                        ? "bg-green/10 text-green"
                        : "bg-red/10 text-red"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-xs font-semibold">
                      {isPositive ? "+" : ""}
                      {priceChange.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-text-secondary/70 ml-0.5">
                  {t("last24h")}
                </span>
              </div>
            )}
          </div>

          {asset.category && (
            <div className="mt-auto">
              <span className="text-xs px-2 py-1 rounded-md bg-bg-hover text-text-secondary inline-block">
                {asset.category}
              </span>
            </div>
          )}
        </div>

        <div className="w-32 h-24 shrink-0">
          {isVisible ? (
            chartData.length > 0 ? (
              <MiniChart data={chartData} color={chartColor} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-bg-hover/30 rounded-lg">
                <div className="w-4 h-4 border-2 border-text-secondary/30 border-t-text-secondary rounded-full animate-spin"></div>
              </div>
            )
          ) : (
            <div className="w-full h-full bg-bg-hover/20 rounded-lg" />
          )}
        </div>
      </div>
    </Card>
  );
});

AssetCard.displayName = "AssetCard";

const AssetImage = memo(
  ({
    symbol,
    initialImageUrl,
    shortName,
    defaultIcon,
  }: {
    symbol: string;
    initialImageUrl: string | null;
    shortName: string;
    defaultIcon: string;
  }) => {
    const imgRef = useRef<HTMLImageElement>(null);

    const { imageUrl: loadedImageUrl } = useIconLoader({
      symbol,
      initialImageUrl,
      enabled: !initialImageUrl,
    });

    const imageUrl = loadedImageUrl || initialImageUrl;

    const [imageLoaded, setImageLoaded] = useState(!imageUrl);
    const [imageError, setImageError] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);

    if (currentImageUrl !== imageUrl) {
      setCurrentImageUrl(imageUrl);
      setImageLoaded(!imageUrl);
      setImageError(false);
    }

    useEffect(() => {
      if (
        imageUrl &&
        imgRef.current?.complete &&
        imgRef.current?.naturalHeight > 0
      ) {
        queueMicrotask(() => setImageLoaded(true));
      }
    }, [imageUrl]);

    return (
      <div className="relative w-10 h-10 shrink-0">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-bg-hover/50 animate-pulse rounded-full" />
        )}
        <img
          ref={imgRef}
          src={imageError ? defaultIcon : imageUrl || defaultIcon}
          alt={shortName}
          className={`w-10 h-10 rounded-full object-cover ring-2 ring-bg-hover transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
          onLoad={(e) => {
            if (e.currentTarget.complete && e.currentTarget.naturalHeight > 0) {
              setImageLoaded(true);
            }
          }}
          onError={() => {
            if (!imageError) {
              setImageError(true);
              setImageLoaded(false);
            } else {
              setImageLoaded(true);
            }
          }}
        />
      </div>
    );
  },
);

AssetImage.displayName = "AssetImage";

export default AssetCard;
