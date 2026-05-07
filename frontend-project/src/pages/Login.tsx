import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../store/hooks";
import { motion } from "framer-motion";
import { LogIn, TrendingUp, Eye, EyeOff } from "lucide-react";
import type { RootState } from "../store/store";
import { login } from "../store/slices/authSlice";
import Input from "@/components/ui/input";
import Label from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const Login = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { isLoading, error } = useSelector((state: RootState) => state.auth);
	const [showPassword, setShowPassword] = useState(false);
	const [formData, setFormData] = useState({
		username: "",
		password: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const result = await dispatch(login(formData));
		if (login.fulfilled.match(result)) {
			navigate("/dashboard");
		}
	};

	return (
		<div className="min-h-screen bg-[#030303] flex items-center justify-center p-4">
			{/* Background glow */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
				<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
			</div>

			<motion.div
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
				className="w-full max-w-md relative z-10"
			>
				<div
					className="rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl p-8"
					style={{
						boxShadow:
							"0 0 40px rgba(255, 255, 255, 0.06), inset 0 1px 0 rgba(255,255,255,0.1)",
					}}
				>
					<div className="flex flex-col items-center mb-8">
						<div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shadow-lg shadow-white/10 mb-4">
							<TrendingUp className="w-7 h-7 text-white" />
						</div>
						<h1 className="text-2xl font-bold text-white">Welcome Back</h1>
						<p className="text-sm text-white/40 mt-1">Sign in to your account</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Label className="mb-2 block">Username</Label>
							<Input
								value={formData.username}
								onChange={(e) => setFormData({ ...formData, username: e.target.value })}
								placeholder="Enter username"
								required
							/>
						</div>
						<div className="relative">
							<Label className="mb-2 block">Password</Label>
							<Input
								type={showPassword ? "text" : "password"}
								value={formData.password}
								onChange={(e) => setFormData({ ...formData, password: e.target.value })}
								placeholder="Enter password"
								required
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-8 text-white/40 hover:text-white/60 transition-colors"
							>
								{showPassword ? (
									<EyeOff className="w-4 h-4" />
								) : (
									<Eye className="w-4 h-4" />
								)}
							</button>
						</div>

						{error && (
							<div className="px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm border border-red-500/20">
								{error}
							</div>
						)}

						<Button type="submit" className="w-full" disabled={isLoading}>
							<LogIn className="w-4 h-4 mr-2" />
							{isLoading ? "Signing in..." : "Sign In"}
						</Button>
					</form>

					<div className="mt-6 text-center">
						<p className="text-sm text-white/40">
							Don't have an account?{" "}
							<Link
								to="/register"
								className="text-white hover:text-white/80 transition-colors font-medium"
							>
								Register
							</Link>
						</p>
					</div>
				</div>
			</motion.div>
		</div>
	);
};

export default Login;
