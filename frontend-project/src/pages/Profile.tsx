import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { UserCircle, Bell, Shield, Activity, Settings, LogOut, Save } from "lucide-react";
import type { RootState } from "../store/store";
import { logout } from "../store/slices/authSlice";
import { profileApi } from "../api/profileApi";
import type { ProfilePreferences, ProfileActivityItem, UiMessage } from "../store/types/profile.types";
import { AvatarUpload } from "@/components/ui/AvatarUpload";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Select from "@/components/ui/select";

const ActivityIcon = ({ type }: { type: string }) => {
	const icons: Record<string, React.ComponentType<{ className?: string }>> = {
		order: Activity,
		login: UserCircle,
		profile: Settings,
		settings: Settings,
		notification: Bell,
	};
	const Icon = icons[type] || Activity;
	return <Icon className="w-4 h-4 text-white/40" />;
};

const Profile = () => {
	const dispatch = useDispatch();
	const { user } = useSelector((state: RootState) => state.auth);
	const [preferences, setPreferences] = useState<ProfilePreferences>({
		language: "en",
		theme: "dark",
		notifications_enabled: true,
		email_verified: false,
		two_factor_enabled: false,
	});
	const [activity, setActivity] = useState<ProfileActivityItem[]>([]);
	const [message, setMessage] = useState<UiMessage>(null);
	const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);

	useEffect(() => {
		const load = async () => {
			try {
				const prefs = await profileApi.getPreferences();
				setPreferences(prefs);
				const acts = await profileApi.getActivity(10);
				setActivity(acts);
			} catch {
				// silently fail
			}
		};
		load();
	}, []);

	const handleSavePreferences = async () => {
		try {
			await profileApi.updatePreferences({
				language: preferences.language,
				theme: preferences.theme,
				notifications_enabled: preferences.notifications_enabled,
			});
			setMessage({ type: "success", text: "Preferences saved successfully" });
			setTimeout(() => setMessage(null), 3000);
		} catch {
			setMessage({ type: "error", text: "Failed to save preferences" });
			setTimeout(() => setMessage(null), 3000);
		}
	};

	const handleLogout = () => {
		dispatch(logout() as any);
	};

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-6 max-w-4xl">
			<h1 className="text-2xl font-bold text-white">Profile Settings</h1>

			{message && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className={`px-4 py-3 rounded-xl text-sm font-medium ${
						message.type === "success"
							? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
							: "bg-red-500/10 text-red-400 border border-red-500/20"
					}`}
				>
					{message.text}
				</motion.div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Avatar Card */}
				<Card className="p-6 flex flex-col items-center" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
					<AvatarUpload
						currentAvatar={avatar}
						username={user?.username || "User"}
						onAvatarChange={setAvatar}
						size="lg"
					/>
					<h3 className="text-lg font-semibold text-white mt-4">{user?.username || "User"}</h3>
					<p className="text-sm text-white/40">{user?.email || "No email"}</p>
					<div className="flex items-center gap-2 mt-3">
						<div className={`w-2 h-2 rounded-full ${preferences.email_verified ? "bg-emerald-400" : "bg-amber-400"}`} />
						<span className="text-xs text-white/40">
							{preferences.email_verified ? "Verified" : "Unverified"}
						</span>
					</div>
				</Card>

				{/* Preferences */}
				<div className="md:col-span-2 space-y-6">
					<Card className="p-6" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
						<h2 className="text-lg font-semibold text-white mb-4">Preferences</h2>
						<div className="space-y-4">
							<div>
								<label className="text-xs text-white/50 mb-1.5 block">Language</label>
								<Select
									value={preferences.language}
									onChange={(e) => setPreferences({ ...preferences, language: e.target.value as "en" | "pl" })}
								>
									<option value="en">English</option>
									<option value="pl">Polish</option>
								</Select>
							</div>
							<div>
								<label className="text-xs text-white/50 mb-1.5 block">Theme</label>
								<Select
									value={preferences.theme}
									onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as "dark" | "light" })}
								>
									<option value="dark">Dark</option>
									<option value="light">Light</option>
								</Select>
							</div>
							<div className="flex items-center justify-between py-2">
								<div className="flex items-center gap-2">
									<Bell className="w-4 h-4 text-white/40" />
									<div>
										<p className="text-sm font-medium text-white">Notifications</p>
										<p className="text-xs text-white/40">Receive email notifications</p>
									</div>
								</div>
								<button
									onClick={() => setPreferences({ ...preferences, notifications_enabled: !preferences.notifications_enabled })}
									className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
										preferences.notifications_enabled ? "bg-[#f23f5d]" : "bg-white/[0.1]"
									}`}
								>
									<div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-200 ${
										preferences.notifications_enabled ? "left-6" : "left-1"
									}`} />
								</button>
							</div>
							<div className="flex items-center justify-between py-2">
								<div className="flex items-center gap-2">
									<Shield className="w-4 h-4 text-white/40" />
									<div>
										<p className="text-sm font-medium text-white">Two-Factor Auth</p>
										<p className="text-xs text-white/40">Additional security layer</p>
									</div>
								</div>
								<div className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
									preferences.two_factor_enabled
										? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
										: "bg-white/[0.04] text-white/40 border border-white/[0.08]"
								}`}>
									{preferences.two_factor_enabled ? "Enabled" : "Disabled"}
								</div>
							</div>
						</div>
						<div className="pt-4">
							<Button onClick={handleSavePreferences}>
								<Save className="w-4 h-4 mr-2" />
								Save Changes
							</Button>
						</div>
					</Card>

					{/* Activity Feed */}
					<Card className="p-6" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
						<h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
						<div className="space-y-3 max-h-64 overflow-y-auto">
							{activity.length > 0 ? activity.map((item) => (
								<div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
									<div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
										<ActivityIcon type={item.event_type} />
									</div>
									<div className="min-w-0">
										<p className="text-sm text-white truncate">{item.title}</p>
										<p className="text-xs text-white/40">{formatDate(item.created_at)}</p>
									</div>
								</div>
							)) : (
								<p className="text-center text-white/40 py-4">No recent activity</p>
							)}
						</div>
					</Card>

					<Button variant="destructive" onClick={handleLogout} className="w-full">
						<LogOut className="w-4 h-4 mr-2" />
						Logout
					</Button>
				</div>
			</div>
		</motion.div>
	);
};

export default Profile;
