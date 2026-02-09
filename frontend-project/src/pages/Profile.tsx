import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { AvatarUpload } from "../components/ui/AvatarUpload";
import Button from "@/components/ui/button";
import axios from "axios";
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

  const handleAvatarChange = async (newAvatar: string | null) => {
    setAvatar(newAvatar);
    setMessage(null);
  };

  const handleSaveAvatar = async () => {
    try {
      setIsUploading(true);
      setMessage(null);

      const response = await axios.post(
        "http://localhost:3000/api/upload/avatar",
        { avatar },
        { withCredentials: true },
      );

      if (response.status === 200) {
        setMessage({ type: "success", text: "Avatar updated successfully!" });
        // Refresh user profile
        dispatch(fetchProfile());
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to upload avatar",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      setIsUploading(true);
      setMessage(null);

      const response = await axios.delete(
        "http://localhost:3000/api/upload/avatar",
        { withCredentials: true },
      );

      if (response.status === 200) {
        setAvatar(null);
        setMessage({ type: "success", text: "Avatar removed successfully!" });
        // Refresh user profile
        dispatch(fetchProfile());
      }
    } catch (error) {
      console.error("Error deleting avatar:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to delete avatar",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="mt-4 text-text-secondary">{t("loading")}</p>
      </div>
    );
  }

  const hasChanges = avatar !== user.avatar;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        {t("profile")}
      </h1>

      <div className="card-padded max-w-2xl">
        <div className="mb-8">
          {message && (
            <div
              className={
                message.type === "success" ? "alert-success" : "alert-error"
              }
            >
              {message.text}
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <AvatarUpload
              currentAvatar={avatar}
              username={user.username}
              onAvatarChange={handleAvatarChange}
              size="lg"
            />

            {hasChanges && (
              <div className="flex gap-3">
                <Button onClick={handleSaveAvatar} disabled={isUploading}>
                  {isUploading ? t("saving") : t("saveChanges")}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setAvatar(user.avatar || null)}
                  disabled={isUploading}
                >
                  {t("cancel")}
                </Button>
              </div>
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
        </div>

        <div className="border-t border-bg-hover pt-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            {t("accountInformation")}
          </h2>

          <div className="space-y-4">
            <div className="data-item">
              <span className="data-item-label">{t("username")}</span>
              <span className="data-item-value">{user.username}</span>
            </div>

            <div className="data-item">
              <span className="data-item-label">{t("balance")}</span>
              <span className="data-item-value text-green">
                ${user.balance.toFixed(2)}
              </span>
            </div>

            <div className="data-item">
              <span className="data-item-label">{t("userId")}</span>
              <span className="data-item-value">#{user.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
