import { useState, useRef, useCallback } from "react";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
	currentAvatar: string | null;
	username: string;
	onAvatarChange: (avatar: string | null) => void;
	size?: "sm" | "md" | "lg";
}

const sizeClasses = {
	sm: "w-16 h-16",
	md: "w-24 h-24",
	lg: "w-32 h-32",
};

export const AvatarUpload = ({ currentAvatar, username, onAvatarChange, size = "md" }: AvatarUploadProps) => {
	const [isDragging, setIsDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFile = useCallback(
		(file: File) => {
			if (!file.type.startsWith("image/")) return;
			if (file.size > 10 * 1024 * 1024) return;
			const reader = new FileReader();
			reader.onload = (e) => {
				onAvatarChange(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		},
		[onAvatarChange],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			const file = e.dataTransfer.files[0];
			if (file) handleFile(file);
		},
		[handleFile],
	);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) handleFile(file);
		},
		[handleFile],
	);

	return (
		<div
			className={cn(
				sizeClasses[size],
				"relative rounded-full border-2 border-dashed border-white/20 cursor-pointer transition-all duration-200 overflow-hidden group",
				isDragging && "border-[#f23f5d]/60 bg-[#f23f5d]/10",
				!currentAvatar && "bg-white/[0.04]",
			)}
			onClick={() => inputRef.current?.click()}
			onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
			onDragLeave={() => setIsDragging(false)}
			onDrop={handleDrop}
		>
			<input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
			{currentAvatar ? (
				<img src={currentAvatar} alt={username} className="w-full h-full object-cover" />
			) : (
				<div className="flex flex-col items-center justify-center w-full h-full text-white/40">
					<Camera className="w-5 h-5 mb-1" />
					<span className="text-[10px]">Upload</span>
				</div>
			)}
			<div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
				<Camera className="w-5 h-5 text-white" />
			</div>
		</div>
	);
};
