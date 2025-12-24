/**
 * Media Uploader Component
 *
 * Drag and drop media upload for campaign images and videos.
 * Supports jpg, jpeg, png, and mp4 files.
 */

import { useState, useRef, useCallback, type ReactNode, type DragEvent, type ChangeEvent } from "react";
import { Upload, X, Image, Video, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import type { CampaignMedia, MediaType } from "@/types/campaign";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4"];
const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface MediaUploaderProps {
	/** Currently uploaded media */
	media: CampaignMedia[];
	/** Callback when uploading a file */
	onUpload: (file: File) => Promise<void>;
	/** Callback when deleting media */
	onDelete: (mediaId: string) => Promise<void>;
	/** Disable all interactions */
	disabled?: boolean;
	/** Additional class names */
	className?: string;
}

function getMediaTypeFromContentType(contentType: string): MediaType {
	if (ACCEPTED_IMAGE_TYPES.includes(contentType)) return "IMAGE";
	return "VIDEO";
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * MediaUploader - Drag and drop media upload component
 *
 * Features:
 * - Drag and drop file upload
 * - Click to select files
 * - Image and video preview
 * - Delete uploaded media
 * - File type and size validation
 */
export function MediaUploader({
	media,
	onUpload,
	onDelete,
	disabled = false,
	className,
}: MediaUploaderProps): ReactNode {
	const [isDragOver, setIsDragOver] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const validateFile = (file: File): string | null => {
		if (!ACCEPTED_TYPES.includes(file.type)) {
			return "File type not supported. Please use JPG, PNG, or MP4.";
		}
		if (file.size > MAX_FILE_SIZE) {
			return "File size exceeds 50MB limit.";
		}
		return null;
	};

	const handleUpload = useCallback(async (file: File) => {
		const validationError = validateFile(file);
		if (validationError) {
			setError(validationError);
			return;
		}

		setError(null);
		setUploading(true);
		try {
			await onUpload(file);
		} catch {
			setError("Failed to upload file. Please try again.");
		} finally {
			setUploading(false);
		}
	}, [onUpload]);

	const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		if (!disabled && !uploading) {
			setIsDragOver(true);
		}
	};

	const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragOver(false);
	};

	const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragOver(false);

		if (disabled || uploading) return;

		const files = Array.from(e.dataTransfer.files);
		if (files.length > 0) {
			await handleUpload(files[0]);
		}
	};

	const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			await handleUpload(files[0]);
		}
		// Reset input
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleDelete = async (mediaId: string) => {
		setDeletingId(mediaId);
		try {
			await onDelete(mediaId);
		} catch {
			setError("Failed to delete media. Please try again.");
		} finally {
			setDeletingId(null);
		}
	};

	const handleClick = () => {
		if (!disabled && !uploading && fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	return (
		<div
			data-testid="media-uploader"
			className={cn("space-y-4", className)}
		>
			{/* Drop Zone */}
			<div
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={handleClick}
				className={cn(
					"border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
					isDragOver && "border-primary bg-primary/5",
					!isDragOver && "border-muted-foreground/25 hover:border-primary/50",
					disabled && "opacity-50 cursor-not-allowed",
					uploading && "cursor-wait"
				)}
			>
				<input
					ref={fileInputRef}
					type="file"
					accept={ACCEPTED_TYPES.join(",")}
					onChange={handleFileSelect}
					className="hidden"
					disabled={disabled || uploading}
				/>

				<div className="flex flex-col items-center gap-2">
					{uploading ? (
						<Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
					) : (
						<Upload className="h-10 w-10 text-muted-foreground" />
					)}
					<div className="text-sm text-muted-foreground">
						{uploading ? (
							"Uploading..."
						) : (
							<>
								<span className="font-medium text-foreground">Click to upload</span> or drag and drop
							</>
						)}
					</div>
					<div className="text-xs text-muted-foreground">
						JPG, PNG, or MP4 (max 50MB)
					</div>
				</div>
			</div>

			{/* Error Message */}
			{error && (
				<div className="text-sm text-destructive" data-testid="upload-error">
					{error}
				</div>
			)}

			{/* Media Grid */}
			{media.length > 0 && (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
					{media.map((item) => (
						<div
							key={item.id}
							data-testid={`media-item-${item.id}`}
							className="relative group rounded-lg overflow-hidden border bg-muted aspect-square"
						>
							{/* Preview */}
							{item.mediaType === "IMAGE" ? (
								<img
									src={item.presignedUrl}
									alt={item.originalFilename}
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center bg-muted">
									<Video className="h-8 w-8 text-muted-foreground" />
								</div>
							)}

							{/* Overlay */}
							<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
								<Button
									type="button"
									variant="destructive"
									size="icon-sm"
									onClick={(e) => {
										e.stopPropagation();
										handleDelete(item.id);
									}}
									disabled={disabled || deletingId === item.id}
									aria-label={`Delete ${item.originalFilename}`}
								>
									{deletingId === item.id ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<X className="h-4 w-4" />
									)}
								</Button>
							</div>

							{/* File Info */}
							<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
								<div className="flex items-center gap-1 text-white">
									{item.mediaType === "IMAGE" ? (
										<Image className="h-3 w-3" />
									) : (
										<Video className="h-3 w-3" />
									)}
									<span className="text-xs truncate">{item.originalFilename}</span>
								</div>
								<div className="text-xs text-white/70">
									{formatFileSize(item.sizeBytes)}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
