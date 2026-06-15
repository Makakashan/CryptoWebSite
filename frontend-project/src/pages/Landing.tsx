import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import ThreeBackground from "@/components/ThreeBackground";

const Landing = () => {
	const navigate = useNavigate();
	const { isAuthenticated } = useAppSelector((state) => state.auth);

	const handleStart = () => {
		if (isAuthenticated) {
			navigate("/");
		} else {
			navigate("/login");
		}
	};

	return (
		<div className="login-screen">
			<ThreeBackground />
			<div className="login-screen__glow login-screen__glow--one" />
			<div className="login-screen__glow login-screen__glow--two" />
			<div className="login-screen__orb login-screen__orb--left" />
			<div className="login-screen__orb login-screen__orb--right" />

			<section className="login-hero">
				<div className="login-hero__brand">
					<img src="/favicon.svg" alt="MakakaTrade" className="login-hero__logo" />
					<div>
						<div className="login-hero__name">MakakaTrade</div>
						<div className="login-hero__tag">Crypto Trading Platform</div>
					</div>
				</div>
				<h1 className="login-hero__title">Trade faster.<br />Track smarter.</h1>
				<p className="login-hero__text">
					Live prices, clean analytics and portfolio control in one place.
					Built for quick decisions in volatile markets.
				</p>
				<div className="login-hero__actions">
					<button type="button" className="login-cta login-cta--primary" onClick={handleStart}>
						Start Trading
					</button>
					<button type="button" className="login-cta login-cta--secondary" onClick={() => navigate("/register")}>
						Sign Up
					</button>
				</div>
				<div className="login-hero__scroll-hint">
					<span />
				</div>
			</section>
		</div>
	);
};

export default Landing;
