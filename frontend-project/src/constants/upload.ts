// Upload configuration constants

export const UPLOAD_LIMITS = {
  AVATAR_MAX_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  AVATAR_MAX_SIZE_TEXT: "10MB",
  ACCEPTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
} as const;

export const UPLOAD_ERRORS = {
  INVALID_TYPE: "Please select an image file (JPEG, PNG, GIF, or WebP)",
  TOO_LARGE: `File size must be less than ${UPLOAD_LIMITS.AVATAR_MAX_SIZE_TEXT}`,
  UPLOAD_FAILED: "Failed to upload avatar. Please try again.",
} as const;
