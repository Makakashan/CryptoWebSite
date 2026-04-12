import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	User,
	Wallet,
	ShieldCheck,
	Image as ImageIcon,
	Mail,
	Lock,
	Bell,
	Languages,
	Moon,
	Sparkles,
	ChevronRight,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { AvatarUpload } from "../components/ui/AvatarUpload";
import Button from "@/components/ui/button";
import Card, { CardContent } from "@/components/ui/card";
import api from "@/api/axiosConfig";
import { fetchProfile } from "../store/slices/authSlice";
import { profileApi } from "@/api/profileApi";
import type {
	ProfileActivityItem,
	ProfilePreferences,
	UiMessage,
} from "../store/types/profile.types";
import { formatRelativeTime } from "../utils/dateTime";
import { mapProfileActivityIcon } from "@/utils/profileActivity";

const Profile = () => {
	const { t, i18n } = useTranslation();
	const dispatch = useAppDispatch();
	const { user } = useAppSelector((state) => state.auth);

	const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
	const [isUploading, setIsUploading] = useState(false);
	const [message, setMessage] = useState<UiMessage>(null);

	const [preferences, setPreferences] = useState<ProfilePreferences | null>(null);
	const [activity, setActivity] = useState<ProfileActivityItem[]>([]);
	const [loadingMeta, setLoadingMeta] = useState(true);
	const [savingPrefs, setSavingPrefs] = useState(false);

	useEffect(() => {
		if (!user) return;
		setAvatar(user.avatar || null);
	}, [user]);

	useEffect(() => {
		let mounted = true;

		const loadMeta = async () => {
			try {
				setLoadingMeta(true);
				const [prefs, logs] = await Promise.all([
					profileApi.getPreferences(),
					profileApi.getActivity(20),
				]);
				if (!mounted) return;
				setPreferences(prefs);
				setActivity(logs);

				// Apply stored language to i18n immediately on profile load.
				if (prefs?.language && i18n.language !== prefs.language) {
					await i18n.changeLanguage(prefs.language);
				}
			} catch (error) {
				if (!mounted) return;
				setMessage({
					type: "error",
					text: error instanceof Error ? error.message : "Failed to load profile data",
				});
			} finally {
				if (mounted) setLoadingMeta(false);
			}
		};

		void loadMeta();

		return () => {
			mounted = false;
		};
	}, [i18n]);

	const refreshActivity = async () => {
		try {
			const logs = await profileApi.getActivity(20);
			setActivity(logs);
		} catch {
			// noop
		}
	};

	const handleAvatarChange = async (newAvatar: string | null) => {
		setAvatar(newAvatar);
		setMessage(null);
	};

	const handleSaveAvatar = async () => {
		try {
			setIsUploading(true);
			setMessage(null);

			const response = await api.post("/upload/avatar", { avatar });

			if (response.status === 200) {
				setMessage({
					type: "success",
					text: "Avatar updated successfully!",
				});
				dispatch(fetchProfile());
				await refreshActivity();
			}
		} catch (error) {
			console.error("Error uploading avatar:", error);
			setMessage({
				type: "error",
				text: error instanceof Error ? error.message : "Failed to upload avatar",
			});
		} finally {
			setIsUploading(false);
		}
	};

	const handleDeleteAvatar = async () => {
		try {
			setIsUploading(true);
			setMessage(null);

			const response = await api.delete("/upload/avatar");

			if (response.status === 200) {
				setAvatar(null);
				setMessage({
					type: "success",
					text: "Avatar removed successfully!",
				});
				dispatch(fetchProfile());
				await refreshActivity();
			}
		} catch (error) {
			console.error("Error deleting avatar:", error);
			setMessage({
				type: "error",
				text: error instanceof Error ? error.message : "Failed to delete avatar",
			});
		} finally {
			setIsUploading(false);
		}
	};

	const updatePreferences = async (payload: {
		language?: "en" | "pl";
		theme?: "dark" | "light";
		notifications_enabled?: boolean;
	}) => {
		if (!preferences) return;

		try {
			setSavingPrefs(true);
			const next = await profileApi.updatePreferences(payload);
			setPreferences(next);

			// Apply language instantly in UI after successful save.
			if (next.language && i18n.language !== next.language) {
				await i18n.changeLanguage(next.language);
			}

			await refreshActivity();
		} catch (error) {
			setMessage({
				type: "error",
				text: error instanceof Error ? error.message : "Failed to update preferences",
			});
		} finally {
			setSavingPrefs(false);
		}
	};

	const hasChanges = avatar !== user?.avatar;
	const balanceText = useMemo(
		() => `$${(user?.balance ?? 0).toFixed(2)}`,
		[user?.balance],
	);

	if (!user) {
		return (
			<div className="loading-container">
				<div className="loading-spinner" />
				<p className="mt-4 text-text-secondary">{t("loading")}</p>
			</div>
		);
	}

	return (
		<div className="glass-page-shell">
			<div className="glass-page-body space-y-5">
				<div className="glass-hero-glass px-6 py-5">
					<div aria-hidden className="glass-panel-highlight" />
					<div className="glass-panel-inner flex items-center justify-between gap-4">
						<div>
							<h1 className="text-3xl font-bold tracking-tight text-text-primary">
								{t("profile")}
							</h1>
							<p className="mt-1.5 text-sm text-text-secondary">
								Manage your identity, security and account preferences
							</p>
						</div>
						<div className="hidden md:flex items-center gap-2 rounded-xl border border-white/10 bg-white/3 px-3 py-2">
							<ShieldCheck className="h-4 w-4 text-emerald-300" />
							<span className="text-xs text-text-secondary">
								{preferences?.email_verified
									? "Account verified"
									: "Verification pending"}
							</span>
						</div>
					</div>
				</div>

				{message && (
					<Card className="glass-empty-panel border-white/10">
						<div aria-hidden className="glass-panel-highlight" />
						<CardContent className="glass-panel-inner p-4">
							<div className={message.type === "success" ? "alert-success" : "alert-error"}>
								{message.text}
							</div>
						</CardContent>
					</Card>
				)}

				<div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
					<div className="xl:col-span-8 space-y-5">
						<Card className="glass-surface-panel">
							<div aria-hidden className="glass-panel-highlight" />
							<CardContent className="glass-panel-inner p-6">
								<div className="flex flex-col items-center gap-4">
									<AvatarUpload
										currentAvatar={avatar}
										username={user.username}
										onAvatarChange={handleAvatarChange}
										size="lg"
									/>

									<div className="flex flex-wrap items-center justify-center gap-3">
										{hasChanges && (
											<>
												<Button
													onClick={handleSaveAvatar}
													disabled={isUploading}
													className="glass-cta-button"
												>
													{isUploading ? t("saving") : t("saveChanges")}
												</Button>
												<Button
													variant="outline"
													onClick={() => setAvatar(user.avatar || null)}
													disabled={isUploading}
													className="glass-muted-button"
												>
													{t("cancel")}
												</Button>
											</>
										)}

										{avatar && !hasChanges && (
											<Button
												variant="destructive"
												onClick={handleDeleteAvatar}
												disabled={isUploading}
											>
												{isUploading ? t("deleting") : t("removeAvatar")}
											</Button>
										)}
									</div>

									<p className="text-xs text-text-secondary flex items-center gap-1.5">
										<ImageIcon className="h-3.5 w-3.5" />
										PNG / JPG / WebP • max 10MB
									</p>
								</div>
							</CardContent>
						</Card>

						<Card className="glass-filter-panel">
							<div aria-hidden className="glass-panel-highlight" />
							<CardContent className="glass-panel-inner p-5">
								<div className="mb-4 flex items-center gap-2">
									<Sparkles className="h-4 w-4 text-indigo-300" />
									<h2 className="text-sm font-semibold tracking-wide text-text-primary uppercase">
										Recent activity
									</h2>
								</div>

								<div className="space-y-3 max-h-80 overflow-y-auto pr-1">
									{loadingMeta ? (
										<p className="text-sm text-text-secondary">Loading activity...</p>
									) : activity.length === 0 ? (
										<p className="text-sm text-text-secondary">No recent activity yet.</p>
									) : (
										activity.map((item) => {
											const Icon = mapProfileActivityIcon(item.event_type);
											return (
												<div
													key={item.id}
													className="flex items-center justify-between rounded-xl border border-white/8 bg-white/2 px-3 py-2.5"
												>
													<div className="flex items-center gap-2.5">
														<div className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/4">
															<Icon className="h-4 w-4 text-text-secondary" />
														</div>
														<span className="text-sm text-text-primary">{item.title}</span>
													</div>
													<span className="text-xs text-text-secondary">
														{formatRelativeTime(item.created_at)}
													</span>
												</div>
											);
										})
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					<div className="xl:col-span-4 space-y-5">
						<Card className="glass-metric-card">
							<div aria-hidden className="glass-panel-highlight" />
							<CardContent className="glass-panel-inner p-5">
								<p className="text-xs uppercase tracking-[0.14em] text-text-secondary mb-2">
									{t("username")}
								</p>
								<div className="flex items-center gap-2">
									<User className="h-4 w-4 text-text-secondary" />
									<p className="text-xl font-semibold text-text-primary">{user.username}</p>
								</div>
							</CardContent>
						</Card>

						<Card className="glass-metric-card">
							<div aria-hidden className="glass-panel-highlight" />
							<CardContent className="glass-panel-inner p-5">
								<p className="text-xs uppercase tracking-[0.14em] text-text-secondary mb-2">
									{t("balance")}
								</p>
								<div className="flex items-center gap-2">
									<Wallet className="h-4 w-4 text-emerald-300" />
									<p className="text-xl font-semibold text-emerald-300">{balanceText}</p>
								</div>
							</CardContent>
						</Card>

						<Card className="glass-metric-card">
							<div aria-hidden className="glass-panel-highlight" />
							<CardContent className="glass-panel-inner p-5">
								<p className="text-xs uppercase tracking-[0.14em] text-text-secondary mb-2">
									{t("userId")}
								</p>
								<p className="text-xl font-semibold text-text-primary">#{user.id}</p>
							</CardContent>
						</Card>

						<Card className="glass-filter-panel">
							<div aria-hidden className="glass-panel-highlight" />
							<CardContent className="glass-panel-inner p-5 space-y-3">
								<h2 className="text-sm font-semibold tracking-wide text-text-primary uppercase">
									Preferences
								</h2>

								<button
									type="button"
									disabled={savingPrefs || !preferences}
									onClick={() =>
										updatePreferences({
											language: preferences?.language === "en" ? "pl" : "en",
										})
									}
									className="w-full flex items-center justify-between rounded-xl border border-white/8 bg-white/2 px-3 py-2.5 transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:opacity-60 disabled:cursor-not-allowed"
								>
									<div className="flex items-center gap-2 text-sm text-text-primary">
										<Languages className="h-4 w-4 text-text-secondary" />
										<span>Language</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-xs text-text-secondary uppercase">
											{preferences?.language || i18n.language || "en"}
										</span>
										<ChevronRight className="h-3.5 w-3.5 text-text-secondary" />
									</div>
								</button>

								<button
									type="button"
									disabled={savingPrefs || !preferences}
									onClick={() =>
										updatePreferences({
											notifications_enabled: !preferences?.notifications_enabled,
										})
									}
									className="w-full flex items-center justify-between rounded-xl border border-white/8 bg-white/2 px-3 py-2.5 transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:opacity-60 disabled:cursor-not-allowed"
								>
									<div className="flex items-center gap-2 text-sm text-text-primary">
										<Bell className="h-4 w-4 text-text-secondary" />
										<span>Notifications</span>
									</div>
									<div className="flex items-center gap-2">
										<span
											className={`text-xs ${
												preferences?.notifications_enabled
													? "text-emerald-300"
													: "text-text-secondary"
											}`}
										>
											{preferences?.notifications_enabled ? "Enabled" : "Disabled"}
										</span>
										<ChevronRight className="h-3.5 w-3.5 text-text-secondary" />
									</div>
								</button>

								<button
									type="button"
									disabled={savingPrefs || !preferences}
									onClick={() =>
										updatePreferences({
											theme: preferences?.theme === "dark" ? "light" : "dark",
										})
									}
									className="w-full flex items-center justify-between rounded-xl border border-white/8 bg-white/2 px-3 py-2.5 transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 disabled:opacity-60 disabled:cursor-not-allowed"
								>
									<div className="flex items-center gap-2 text-sm text-text-primary">
										<Moon className="h-4 w-4 text-text-secondary" />
										<span>Theme</span>
									</div>
									<div className="flex items-center gap-2">
										<span className="text-xs text-text-secondary">
											{preferences?.theme || "dark"}
										</span>
										<ChevronRight className="h-3.5 w-3.5 text-text-secondary" />
									</div>
								</button>

								<div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/2 px-3 py-2.5 opacity-85">
									<div className="flex items-center gap-2 text-sm text-text-primary">
										<Mail className="h-4 w-4 text-text-secondary" />
										<span>Email status</span>
									</div>
									<span
										className={`text-xs ${
											preferences?.email_verified
												? "text-emerald-300"
												: "text-amber-300"
										}`}
									>
										{preferences?.email_verified ? "Verified" : "Unverified"}
									</span>
								</div>

								<div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/2 px-3 py-2.5 opacity-85">
									<div className="flex items-center gap-2 text-sm text-text-primary">
										<Lock className="h-4 w-4 text-text-secondary" />
										<span>2FA</span>
									</div>
									<span
										className={`text-xs ${
											preferences?.two_factor_enabled
												? "text-emerald-300"
												: "text-amber-300"
										}`}
									>
										{preferences?.two_factor_enabled ? "Enabled" : "Not configured"}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Profile;
