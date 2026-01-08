/**
 * Media Gallery Component
 *
 * Displays campaign media in a responsive grid with lightbox functionality.
 * Supports both images and videos with keyboard navigation.
 */

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, X, Play, Image as ImageIcon, Video } from "lucide-react";

import { cn } from "@/lib/utils";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { CampaignMedia } from "@/types/campaign";

interface MediaGalleryProps {
	/** Array of media items to display */
	media: CampaignMedia[];
	/** Number of columns in grid */
	columns?: 2 | 3 | 4;
	/** Whether to show the thumbnail strip in lightbox */
	showThumbnails?: boolean;
	/** Additional class names */
	className?: string;
}

/**
 * MediaGallery - Responsive media gallery with lightbox
 *
 * Features:
 * - Responsive grid layout
 * - Full-screen lightbox modal
 * - Previous/next navigation
 * - Keyboard navigation (Arrow keys, Escape)
 * - Video playback support
 * - Thumbnail strip in lightbox
 */
export function MediaGallery({
	media,
	columns = 3,
	showThumbnails = true,
	className,
}: MediaGalleryProps): ReactNode {
	const [isOpen, setIsOpen] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);

	const currentMedia = media[currentIndex];
	const hasMultiple = media.length > 1;

	const goToPrevious = useCallback(() => {
		setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
	}, [media.length]);

	const goToNext = useCallback(() => {
		setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
	}, [media.length]);

	const openLightbox = (index: number) => {
		setCurrentIndex(index);
		setIsOpen(true);
	};

	// Keyboard navigation
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			switch (e.key) {
				case "ArrowLeft":
					e.preventDefault();
					goToPrevious();
					break;
				case "ArrowRight":
					e.preventDefault();
					goToNext();
					break;
				case "Escape":
					setIsOpen(false);
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, goToPrevious, goToNext]);

	const gridColsClass = {
		2: "grid-cols-2",
		3: "grid-cols-2 sm:grid-cols-3",
		4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
	}[columns];

	if (media.length === 0) {
		return null;
	}

	return (
		<>
			{/* Grid View */}
			<div
				data-testid="media-gallery"
				className={cn("grid gap-3", gridColsClass, className)}
			>
				{media.map((item, index) => (
					<button
						key={item.id}
						type="button"
						onClick={() => openLightbox(index)}
						className="relative group rounded-lg overflow-hidden border bg-muted aspect-video cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
						aria-label={`View ${item.originalFilename}`}
					>
						{item.mediaType === "IMAGE" ? (
							<img
								src={item.presignedUrl}
								alt={item.originalFilename}
								className="w-full h-full object-cover transition-transform group-hover:scale-105"
								loading="lazy"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center bg-muted relative">
								<Video className="h-8 w-8 text-muted-foreground" />
								<div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
									<div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
										<Play className="h-6 w-6 text-black ml-1" />
									</div>
								</div>
							</div>
						)}

						{/* Hover overlay with zoom icon */}
						{item.mediaType === "IMAGE" && (
							<div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
								<div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
									<ImageIcon className="h-5 w-5 text-black" />
								</div>
							</div>
						)}
					</button>
				))}
			</div>

			{/* Lightbox Modal */}
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogPortal>
					<DialogOverlay className="bg-black/95" />
					<DialogPrimitive.Content
						className="fixed inset-0 z-50 flex flex-col items-center justify-center focus:outline-none"
						onPointerDownOutside={(e) => e.preventDefault()}
					>
						{/* Close button */}
						<button
							type="button"
							onClick={() => setIsOpen(false)}
							className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
							aria-label="Close gallery"
						>
							<X className="h-6 w-6" />
						</button>

						{/* Position indicator */}
						<div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-white/10 text-white text-sm">
							{currentIndex + 1} / {media.length}
						</div>

						{/* Main media display */}
						<div className="relative flex-1 w-full flex items-center justify-center p-4">
							{/* Previous button */}
							{hasMultiple && (
								<button
									type="button"
									onClick={goToPrevious}
									className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
									aria-label="Previous image"
								>
									<ChevronLeft className="h-8 w-8" />
								</button>
							)}

							{/* Media content */}
							<div className="max-w-full max-h-[calc(100vh-200px)] flex items-center justify-center">
								{currentMedia?.mediaType === "IMAGE" ? (
									<img
										src={currentMedia.presignedUrl}
										alt={currentMedia.originalFilename}
										className="max-w-full max-h-[calc(100vh-200px)] object-contain rounded-lg"
									/>
								) : currentMedia?.mediaType === "VIDEO" ? (
									<video
										key={currentMedia.id}
										src={currentMedia.presignedUrl}
										controls
										autoPlay
										className="max-w-full max-h-[calc(100vh-200px)] rounded-lg"
									>
										<track kind="captions" />
									</video>
								) : null}
							</div>

							{/* Next button */}
							{hasMultiple && (
								<button
									type="button"
									onClick={goToNext}
									className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
									aria-label="Next image"
								>
									<ChevronRight className="h-8 w-8" />
								</button>
							)}
						</div>

						{/* Filename */}
						<div className="text-white/70 text-sm mb-2">
							{currentMedia?.originalFilename}
						</div>

						{/* Thumbnail strip */}
						{showThumbnails && hasMultiple && (
							<div className="w-full max-w-3xl px-4 pb-4">
								<div className="flex gap-2 justify-center overflow-x-auto py-2">
									{media.map((item, index) => (
										<button
											key={item.id}
											type="button"
											onClick={() => setCurrentIndex(index)}
											className={cn(
												"flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all",
												index === currentIndex
													? "border-white opacity-100"
													: "border-transparent opacity-50 hover:opacity-75"
											)}
											aria-label={`Go to ${item.originalFilename}`}
										>
											{item.mediaType === "IMAGE" ? (
												<img
													src={item.presignedUrl}
													alt={item.originalFilename}
													className="w-full h-full object-cover"
												/>
											) : (
												<div className="w-full h-full bg-muted flex items-center justify-center">
													<Video className="h-4 w-4 text-muted-foreground" />
												</div>
											)}
										</button>
									))}
								</div>
							</div>
						)}
					</DialogPrimitive.Content>
				</DialogPortal>
			</Dialog>
		</>
	);
}
