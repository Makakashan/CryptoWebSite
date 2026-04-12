import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { User, Wallet, ShieldCheck, Image as ImageIcon } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { AvatarUpload } from "../components/ui/AvatarUpload";
import Button from "@/components/ui/button";
import Card, { CardContent } from "@/components/ui/card";
import api from "@/api/axiosConfig";
import { fetchProfile } from "../store/slices/authSlice";

const Profile = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { user } = useAppSelector((state) => state.auth);

	const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
	const [isUploading, setIsUploading] = useState(false);
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	useEffect(() => {
		if (!user) return;
		setAvatar(user.avatar || null);
	}, [user]);

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

	const hasChanges = avatar !== user?.avatar;
	const balanceText = useMemo(() => `$${(user?.balance ?? 0).toFixed(2)}`, [user?.balance]);

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
			<div className="glass-page-body">
				<div className="glass-hero-glass px-6 py-5">
					<div aria-hidden className="glass-panel-highlight" />
					<div className="glass-panel-inner flex items-center justify-between gap-4">
						<div>
							<h1 className="text-3xl font-bold tracking-tight text-text-primary">
								{t("profile")}
							</h1>
							<p className="mt-1.5 text-sm text-text-secondary">
								Manage your identity, avatar and account information
							</p>
						</div>
						<div className="hidden md:flex items-center gap-2 rounded-xl border border-white/10 bg-white/3 px-3 py-2">
							<ShieldCheck className="h-4 w-4 text-emerald-300" />
							<span className="text-xs text-text-secondary">Account verified</span>
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

				<div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
					<Card className="glass-surface-panel xl:col-span-2">
						<div aria-hidden className="glass-panel-highlight" />
						<CardContent className="glass-panel-inner p-6">
							<div className="flex flex-col items-center gap-4">
								<AvatarUpload
									currentAvatar={avatar}
									username={user.username}
									onAvatarChange={handleAvatarChange}
									size="lg"
								/>

								<div className="flex flex-wrap justify-center gap-3">
									{hasChanges && (
										<>
											<Button onClick={handleSaveAvatar} disabled={isUploading} className="glass-cta-button">
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

					<div className="space-y-5">
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
					</div>
				</div>
			</div>
		</div>
	);
};

export default Profile;
