import { Component, type ReactNode } from "react";

type Props = {
	children: ReactNode;
	/** Optional fallback to render when the boundary catches an error. */
	fallback?: ReactNode;
};

type State = {
	hasError: boolean;
};

/**
 * Lightweight error boundary for 3D / WebGL surfaces. If a three.js
 * scene throws (WebGL context lost, GPU driver crash, malformed
 * options, etc.) we silently render nothing instead of blanking the
 * whole page.
 *
 * Wrap any <ThreeCanvas /> / <ParticleCanvas /> / etc. with this:
 *
 *   <ThreeErrorBoundary>
 *     <CoinField />
 *   </ThreeErrorBoundary>
 */
export class ThreeErrorBoundary extends Component<Props, State> {
	state: State = { hasError: false };

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: unknown) {
		console.warn("[ThreeErrorBoundary] 3D scene crashed, falling back to nothing:", error, info);
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback ?? null;
		}
		return this.props.children;
	}
}
