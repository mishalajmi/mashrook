/**
 * Order Comments Section Component
 *
 * Displays a list of comments for an order with the ability to add new comments.
 */

import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/date";
import { getTranslatedErrorMessage } from "@/lib/error-utils";
import {
	Button,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
	Textarea,
	Avatar,
	AvatarFallback,
} from "@/components/ui";
import { orderService, type OrderCommentResponse } from "@/services/order.service";

interface OrderCommentsSectionProps {
	/** Order ID */
	orderId: string;
	/** Existing comments */
	comments: OrderCommentResponse[];
	/** Callback when comments are updated */
	onCommentsUpdate: (comments: OrderCommentResponse[]) => void;
	/** Additional class names */
	className?: string;
}

const createCommentSchema = (t: (key: string) => string) =>
	z.object({
		content: z
			.string()
			.min(1, t("dashboard.orders.validation.commentEmpty"))
			.max(1000, t("dashboard.orders.validation.commentTooLong")),
	});

type CommentFormData = { content: string };

/**
 * Get initials from a name
 */
function getInitials(name: string | undefined | null): string {
	if (!name) {
		return "??";
	}
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

/**
 * OrderCommentsSection - Comments list with add form
 */
export function OrderCommentsSection({
	orderId,
	comments,
	onCommentsUpdate,
	className,
}: OrderCommentsSectionProps): ReactNode {
	const { t } = useTranslation();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const commentSchema = createCommentSchema(t);
	const form = useForm<CommentFormData>({
		resolver: zodResolver(commentSchema),
		defaultValues: {
			content: "",
		},
	});

	const handleSubmit = async (data: CommentFormData) => {
		try {
			setIsSubmitting(true);
			const newComment = await orderService.addComment(orderId, {
				content: data.content,
			});
			onCommentsUpdate([...comments, newComment]);
			form.reset();
			toast.success(t("dashboard.orders.comments.addedSuccessfully"));
		} catch (error) {
			toast.error(getTranslatedErrorMessage(error));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className={cn("space-y-4", className)} data-testid="order-comments-section">
			<h3 className="text-lg font-semibold flex items-center gap-2">
				<MessageSquare className="h-5 w-5" />
				{t("dashboard.orders.comments.title")}
			</h3>

			{/* Comments List */}
			<div className="space-y-4">
				{comments.length === 0 ? (
					<p className="text-sm text-muted-foreground py-4 text-center">
						{t("dashboard.orders.comments.noComments")}
					</p>
				) : (
					comments.map((comment) => (
						<div
							key={comment.id}
							className="flex gap-3"
							data-testid={`comment-${comment.id}`}
						>
							<Avatar className="h-8 w-8">
								<AvatarFallback className="text-xs">
									{getInitials(comment.userName)}
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 space-y-1">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium">{comment.userName}</span>
									<span className="text-xs text-muted-foreground">
										{comment.organizationName}
									</span>
									<span className="text-xs text-muted-foreground">
										{formatRelativeTime(comment.createdAt)}
									</span>
								</div>
								<p className="text-sm text-foreground">{comment.content}</p>
							</div>
						</div>
					))
				)}
			</div>

			{/* Add Comment Form */}
			<Form {...form}>
				<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
					<FormField
						control={form.control}
						name="content"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Textarea
										placeholder={t("dashboard.orders.comments.placeholder")}
										className="min-h-[80px] resize-none"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="flex justify-end">
						<Button
							type="submit"
							disabled={isSubmitting}
							data-testid="submit-comment-btn"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
									{t("dashboard.orders.comments.sending")}
								</>
							) : (
								<>
									<Send className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
									{t("dashboard.orders.comments.send")}
								</>
							)}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
