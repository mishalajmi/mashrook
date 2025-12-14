/**
 * Placeholder Page Component
 *
 * Temporary placeholder for pages that are not yet implemented.
 */

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Construction } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

interface PlaceholderPageProps {
	title: string;
	description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps): ReactNode {
	const { t } = useTranslation();

	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<Card className="max-w-md text-center">
				<CardHeader>
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
						<Construction className="h-6 w-6" />
					</div>
					<CardTitle>{title}</CardTitle>
					<CardDescription>
						{description || t("dashboard.placeholder.description")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						{t("dashboard.placeholder.comingSoon")}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
