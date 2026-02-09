import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AvatarUploadProps } from "@/store/types";
import { UPLOAD_LIMITS, UPLOAD_ERRORS } from "@/constants/upload";
import { getInitials } from "@/utils/formatPrice";

export function AvatarUpload({
  currentAvatar,
  username,
  onAvatarChange,
  size = "lg",
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClass = `avatar-${size}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert(UPLOAD_ERRORS.INVALID_TYPE);
      return;
    }

    // Validate file size
    if (file.size > UPLOAD_LIMITS.AVATAR_MAX_SIZE) {
      alert(UPLOAD_ERRORS.TOO_LARGE);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      onAvatarChange(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onAvatarChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const initials = getInitials(username);

  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar className={sizeClass}>
        {preview ? (
          <AvatarImage src={preview} alt={username} />
        ) : (
          <AvatarFallback className="text-lg font-semibold bg-blue text-white">
            {initials}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="avatar-upload"
        />
        <label
          htmlFor="avatar-upload"
          className="btn-outline btn-small cursor-pointer"
        >
          {preview ? "Change" : "Upload"}
        </label>
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            className="btn-outline btn-small text-red-500"
          >
            Remove
          </button>
        )}
      </div>
      <p className="text-xs text-text-secondary">
        Max size: {UPLOAD_LIMITS.AVATAR_MAX_SIZE_TEXT}
      </p>
    </div>
  );
}
