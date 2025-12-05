import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";

interface ThemeToggleProps {
	isDark: boolean;
	onToggle: () => void;
}

function ThemeToggle({ isDark, onToggle }: ThemeToggleProps): ReactNode {
	const { t } = useTranslation();

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={onToggle}
			aria-label={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
			aria-pressed={isDark}
			className="relative overflow-hidden"
		>
			<Sun
				className={`h-5 w-5 transition-all duration-300 ${
					isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
				}`}
				aria-hidden="true"
			/>
			<Moon
				className={`absolute h-5 w-5 transition-all duration-300 ${
					isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
				}`}
				aria-hidden="true"
			/>
		</Button>
	);
}

export { ThemeToggle };
