import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import ThreeBackground from "@/components/ThreeBackground";
import { MarketConstellation3D } from "@/components/BentoCards3D";
import { assetsApi } from "@/api/assetsApi";
import api from "@/api/axiosConfig";

const watchlist = [
	{ symbol: "ETH", price: "$3,521", change: "+1.8%", direction: "up" },
	{ symbol: "SOL", price: "$178", change: "-0.6%", direction: "down" },
	{ symbol: "ADA", price: "$0.62", change: "+3.2%", direction: "up" },
] as const;

const depthRows = [
	{ side: "Bid", price: "67,428", size: "12.8", width: 74 },
	{ side: "Ask", price: "67,441", size: "9.4", width: 58 },
	{ side: "Bid", price: "67,412", size: "7.1", width: 46 },
] as const;

type FloatingCardKey = "price" | "volume" | "fear" | "dominance" | "watchlist" | "depth";
type DragOffset = Record<FloatingCardKey, { x: number; y: number }>;

const initialDragOffsets: DragOffset = {
	price: { x: 0, y: 0 },
	volume: { x: 0, y: 0 },
	fear: { x: 0, y: 0 },
	dominance: { x: 0, y: 0 },
	watchlist: { x: 0, y: 0 },
	depth: { x: 0, y: 0 },
};

const Landing = () => {
	const navigate = useNavigate();
	const { isAuthenticated } = useAppSelector((state) => state.auth);
	const [fearGreed, setFearGreed] = useState("--");
	const [chartPrices, setChartPrices] = useState<number[]>([]);
	const [dragOffsets, setDragOffsets] = useState<DragOffset>(initialDragOffsets);
	const [activeCard, setActiveCard] = useState<FloatingCardKey | null>(null);
	const dragRef = useRef<{
		key: FloatingCardKey;
		startX: number;
		startY: number;
		originX: number;
		originY: number;
	} | null>(null);

	useEffect(() => {
		api.get("/stats/fear-greed")
			.then((r) => {
				const v = r?.data?.data?.value;
				if (v !== undefined) setFearGreed(`${v}`);
			})
			.catch(() => {});
	}, []);

	useEffect(() => {
		assetsApi.getChartData(["BTCUSDT"], "1h", 48)
			.then((r) => {
				const prices = r.data.BTCUSDT ?? r.data.BTC ?? [];
				if (prices.length > 0) setChartPrices(prices);
			})
			.catch(() => {});
	}, []);

	const handleStart = () => {
		navigate(isAuthenticated ? "/dashboard" : "/login");
	};

	const latestPrice = chartPrices.length > 0 ? chartPrices[chartPrices.length - 1] : 67432;
	const firstPrice = chartPrices.length > 1 ? chartPrices[0] : latestPrice;
	const chartChange = useMemo(() => {
		if (!firstPrice) return 0;
		return ((latestPrice - firstPrice) / firstPrice) * 100;
	}, [firstPrice, latestPrice]);
	const chartChangeDirection = chartChange >= 0 ? "up" : "down";
	const formattedPrice = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(latestPrice);

	const startCardDrag = (key: FloatingCardKey, event: PointerEvent<HTMLDivElement>) => {
		if (event.button !== 0) return;
		event.currentTarget.setPointerCapture(event.pointerId);
		dragRef.current = {
			key,
			startX: event.clientX,
			startY: event.clientY,
			originX: dragOffsets[key].x,
			originY: dragOffsets[key].y,
		};
		setActiveCard(key);
	};

	const moveCardDrag = (event: PointerEvent<HTMLDivElement>) => {
		const drag = dragRef.current;
		if (!drag) return;
		const nextX = drag.originX + event.clientX - drag.startX;
		const nextY = drag.originY + event.clientY - drag.startY;
		setDragOffsets((current) => ({
			...current,
			[drag.key]: {
				x: Math.max(-180, Math.min(180, nextX)),
				y: Math.max(-120, Math.min(120, nextY)),
			},
		}));
	};

	const stopCardDrag = () => {
		dragRef.current = null;
		setActiveCard(null);
	};

	const floatingCardProps = (key: FloatingCardKey) => ({
		className: `landing-float-card landing-float-card--${key}${activeCard === key ? " is-dragging" : ""}`,
		onPointerDown: (event: PointerEvent<HTMLDivElement>) => startCardDrag(key, event),
		onPointerMove: moveCardDrag,
		onPointerUp: stopCardDrag,
		onPointerCancel: stopCardDrag,
		style: {
			"--drag-x": `${dragOffsets[key].x}px`,
			"--drag-y": `${dragOffsets[key].y}px`,
		} as CSSProperties,
	});

	return (
		<div className="landing">
			<ThreeBackground />
			<img src="/favicon.svg" alt="MakakaTrade" className="landing-brand-mark" />

			<div className="landing-body">
				<section className="landing-hero">
					<h1 className="landing-hero__title">
						Trade faster.<br />
						<span className="landing-hero__title--muted">Track smarter.</span>
					</h1>
					<p className="landing-hero__text">
						Live prices, clean analytics and portfolio control in one place.
						Built for quick decisions in volatile markets.
					</p>
					<div className="landing-hero__actions">
						<button type="button" className="landing-button landing-button--primary" onClick={handleStart}>
							Start Trading
						</button>
						<button type="button" className="landing-button landing-button--secondary" onClick={() => navigate("/register")}>
							Create Account
						</button>
					</div>
				</section>

				<section className="landing-showcase" aria-label="Live market preview">
					<div className="landing-orbit">
						<MarketConstellation3D prices={chartPrices} />

						<div {...floatingCardProps("price")}>
							<span className="landing-float-card__label">BTC / USDT</span>
							<strong className="landing-float-card__value">{formattedPrice}</strong>
							<span className={`landing-float-card__change landing-float-card__change--${chartChangeDirection}`}>
								{chartChange >= 0 ? "+" : ""}{chartChange.toFixed(2)}%
							</span>
						</div>

						<div {...floatingCardProps("volume")}>
							<span className="landing-float-card__label">24h volume</span>
							<strong className="landing-float-card__value">$12.4B</strong>
							<span className="landing-float-card__hint">+18.2%</span>
						</div>

						<div {...floatingCardProps("fear")}>
							<span className="landing-float-card__label">Fear & Greed</span>
							<strong className="landing-float-card__value">{fearGreed}</strong>
							<span className="landing-float-card__hint">live</span>
						</div>

						<div {...floatingCardProps("dominance")}>
							<span className="landing-float-card__label">BTC dom.</span>
							<strong className="landing-float-card__value">54.7%</strong>
							<span className="landing-float-card__hint">+0.4%</span>
						</div>

						<div {...floatingCardProps("watchlist")}>
							<div className="landing-float-card__header">
								<span>Watchlist</span>
								<span>24h</span>
							</div>
							{watchlist.map((asset) => (
								<div className="landing-watch-row" key={asset.symbol}>
									<span>{asset.symbol}</span>
									<span>{asset.price}</span>
									<span className={`landing-watch-row__change landing-watch-row__change--${asset.direction}`}>
										{asset.change}
									</span>
								</div>
							))}
						</div>

						<div {...floatingCardProps("depth")}>
							<div className="landing-float-card__header">
								<span>Depth</span>
								<span>Size</span>
							</div>
							{depthRows.map((row) => (
								<div className="landing-depth-row" key={`${row.side}-${row.price}`}>
									<span className={`landing-depth-row__side landing-depth-row__side--${row.side.toLowerCase()}`}>
										{row.side}
									</span>
									<span>{row.price}</span>
									<span>{row.size}</span>
									<span className="landing-depth-row__bar" style={{ width: `${row.width}%` }} />
								</div>
							))}
						</div>
					</div>
				</section>
			</div>
		</div>
	);
};

export default Landing;
