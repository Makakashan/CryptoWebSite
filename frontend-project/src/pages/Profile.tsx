import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { AvatarUpload } from "../components/ui/AvatarUpload";
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
        <p className="mt-4 text-text-secondary">Loading profile...</p>
      </div>
    );
  }

  const hasChanges = avatar !== user.avatar;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        {t("profile") || "Profile"}
      </h1>

      <div className="card-padded max-w-2xl">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            {t("profilePicture") || "Profile Picture"}
          </h2>

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
                <button
                  onClick={handleSaveAvatar}
                  disabled={isUploading}
                  className="btn-primary"
                >
                  {isUploading
                    ? t("saving") || "Saving..."
                    : t("saveChanges") || "Save Changes"}
                </button>
                <button
                  onClick={() => setAvatar(user.avatar || null)}
                  disabled={isUploading}
                  className="btn-secondary"
                >
                  {t("cancel") || "Cancel"}
                </button>
              </div>
            )}

            {avatar && !hasChanges && (
              <button
                onClick={handleDeleteAvatar}
                disabled={isUploading}
                className="btn-danger"
              >
                {isUploading
                  ? t("deleting") || "Deleting..."
                  : t("removeAvatar") || "Remove Avatar"}
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-bg-hover pt-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            {t("accountInfo") || "Account Information"}
          </h2>

          <div className="space-y-4">
            <div className="data-item">
              <span className="data-item-label">
                {t("username") || "Username"}
              </span>
              <span className="data-item-value">{user.username}</span>
            </div>

            <div className="data-item">
              <span className="data-item-label">
                {t("balance") || "Balance"}
              </span>
              <span className="data-item-value text-green">
                ${user.balance.toFixed(2)}
              </span>
            </div>

            <div className="data-item">
              <span className="data-item-label">
                {t("userId") || "User ID"}
              </span>
              <span className="data-item-value">#{user.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
