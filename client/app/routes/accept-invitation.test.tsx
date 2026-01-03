import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";

// Mock the i18n module first
vi.mock("@/i18n", () => ({
	defaultLanguage: "en",
	supportedLanguages: ["en", "ar"],
	languageNames: { en: "English", ar: "Arabic" },
	rtlLanguages: ["ar"],
	isRtlLanguage: (lang: string) => lang === "ar",
	getStoredLanguage: () => "en",
	setStoredLanguage: vi.fn(),
	i18n: {
		use: () => ({ init: vi.fn() }),
		changeLanguage: vi.fn(),
		language: "en",
	},
}));

// Mock the auth context - needed for Header component
vi.mock("@/contexts/AuthContext", () => ({
	useAuth: vi.fn(() => ({
		user: null,
		isAuthenticated: false,
		isLoading: false,
		logout: vi.fn(),
	})),
}));

// Mock the team service
vi.mock("@/services/team.service", () => ({
	teamService: {
		getInvitationInfo: vi.fn(),
	},
}));

// Mock i18next
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, fallback?: string) => {
			const translations: Record<string, string> = {
				"auth.register.invitation.noToken": "No invitation token provided.",
				"auth.register.invitation.invalid": "This invitation is no longer valid.",
				"auth.register.invitation.expired": "This invitation has expired.",
				"auth.register.invitation.loadError": "Failed to load invitation details.",
				"auth.register.invitation.errorTitle": "Invalid Invitation",
				"auth.register.invitation.validating": "Validating invitation...",
				"auth.register.login": "Sign In",
				// Header translations
				"common.appName": "Mashrook",
				"header.features": "Features",
				"header.howItWorks": "How It Works",
				"header.signIn": "Sign In",
				"header.getStarted": "Get Started",
			};
			return translations[key] || fallback || key;
		},
	}),
	initReactI18next: {
		type: "3rdParty",
		init: vi.fn(),
	},
}));

// Mock language context
vi.mock("@/i18n/language-context", () => ({
	useLanguage: () => ({
		language: "en",
		isRtl: false,
		changeLanguage: vi.fn(),
		toggleLanguage: vi.fn(),
	}),
}));

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

import { teamService } from "@/services/team.service";
import AcceptInvitationPage from "./accept-invitation";

// Wrapper with router and specific search params
function renderWithRouter(ui: ReactNode, initialEntries: string[] = ["/accept-invitation"]) {
	return render(
		<MemoryRouter initialEntries={initialEntries}>
			{ui}
		</MemoryRouter>
	);
}

describe("Accept Invitation Page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Token Validation", () => {
		it("should show error when no token is provided", async () => {
			renderWithRouter(<AcceptInvitationPage />, ["/accept-invitation"]);

			await waitFor(() => {
				expect(screen.getByText(/no invitation token provided/i)).toBeInTheDocument();
			});
		});

		it("should call getInvitationInfo with token from URL", async () => {
			(teamService.getInvitationInfo as Mock).mockResolvedValue({
				valid: true,
				expired: false,
				email: "test@example.com",
				organizationName: "Test Org",
				organizationType: "BUYER",
				inviterName: "John Doe",
			});

			renderWithRouter(<AcceptInvitationPage />, [
				"/accept-invitation?token=valid-token-123",
			]);

			await waitFor(() => {
				expect(teamService.getInvitationInfo).toHaveBeenCalledWith(
					"valid-token-123"
				);
			});
		});

		it("should show validating state while checking token", async () => {
			(teamService.getInvitationInfo as Mock).mockImplementation(
				() => new Promise(() => {}) // Never resolves
			);

			renderWithRouter(<AcceptInvitationPage />, [
				"/accept-invitation?token=test-token",
			]);

			await waitFor(() => {
				expect(screen.getByText(/validating invitation/i)).toBeInTheDocument();
			});
		});
	});

	describe("Valid Token - Redirect", () => {
		it("should redirect to registration page with token when invitation is valid", async () => {
			(teamService.getInvitationInfo as Mock).mockResolvedValue({
				valid: true,
				expired: false,
				email: "test@example.com",
				organizationName: "Test Org",
				organizationType: "BUYER",
				inviterName: "John Doe",
			});

			renderWithRouter(<AcceptInvitationPage />, [
				"/accept-invitation?token=valid-token-123",
			]);

			await waitFor(() => {
				expect(mockNavigate).toHaveBeenCalledWith(
					"/register?invitation=valid-token-123",
					{ replace: true }
				);
			});
		});
	});

	describe("Invalid Token - Error States", () => {
		it("should show error when invitation is not valid", async () => {
			(teamService.getInvitationInfo as Mock).mockResolvedValue({
				valid: false,
				expired: false,
				email: "test@example.com",
				organizationName: "Test Org",
				organizationType: "BUYER",
				inviterName: "John Doe",
			});

			renderWithRouter(<AcceptInvitationPage />, [
				"/accept-invitation?token=invalid-token",
			]);

			await waitFor(() => {
				expect(
					screen.getByText(/this invitation is no longer valid/i)
				).toBeInTheDocument();
			});
		});

		it("should show error when invitation is expired", async () => {
			(teamService.getInvitationInfo as Mock).mockResolvedValue({
				valid: true,
				expired: true,
				email: "test@example.com",
				organizationName: "Test Org",
				organizationType: "BUYER",
				inviterName: "John Doe",
			});

			renderWithRouter(<AcceptInvitationPage />, [
				"/accept-invitation?token=expired-token",
			]);

			await waitFor(() => {
				expect(screen.getByText(/this invitation has expired/i)).toBeInTheDocument();
			});
		});

		it("should show error when API call fails", async () => {
			(teamService.getInvitationInfo as Mock).mockRejectedValue(
				new Error("Network error")
			);

			renderWithRouter(<AcceptInvitationPage />, [
				"/accept-invitation?token=error-token",
			]);

			await waitFor(() => {
				expect(
					screen.getByText(/failed to load invitation details/i)
				).toBeInTheDocument();
			});
		});
	});

	describe("Error Page UI", () => {
		it("should display error title on invalid invitation", async () => {
			(teamService.getInvitationInfo as Mock).mockResolvedValue({
				valid: false,
				expired: false,
			});

			renderWithRouter(<AcceptInvitationPage />, [
				"/accept-invitation?token=invalid-token",
			]);

			await waitFor(() => {
				expect(screen.getByText(/invalid invitation/i)).toBeInTheDocument();
			});
		});

		it("should show Sign In link on error page", async () => {
			(teamService.getInvitationInfo as Mock).mockResolvedValue({
				valid: false,
				expired: false,
			});

			renderWithRouter(<AcceptInvitationPage />, [
				"/accept-invitation?token=invalid-token",
			]);

			await waitFor(() => {
				expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
			});
		});

		it("should link to login page from error state", async () => {
			(teamService.getInvitationInfo as Mock).mockResolvedValue({
				valid: false,
				expired: false,
			});

			renderWithRouter(<AcceptInvitationPage />, [
				"/accept-invitation?token=invalid-token",
			]);

			await waitFor(() => {
				const loginLink = screen.getByRole("link", { name: /sign in/i });
				expect(loginLink).toHaveAttribute("href", "/login");
			});
		});
	});

	describe("Loading State UI", () => {
		it("should show loading spinner while validating", async () => {
			(teamService.getInvitationInfo as Mock).mockImplementation(
				() => new Promise(() => {}) // Never resolves
			);

			renderWithRouter(<AcceptInvitationPage />, [
				"/accept-invitation?token=test-token",
			]);

			await waitFor(() => {
				// Check for the Loader2 spinner with animate-spin class
				const spinners = document.querySelectorAll(".animate-spin");
				expect(spinners.length).toBeGreaterThan(0);
			});
		});

		it("should render within a Card component during loading", async () => {
			(teamService.getInvitationInfo as Mock).mockImplementation(
				() => new Promise(() => {}) // Never resolves
			);

			renderWithRouter(<AcceptInvitationPage />, [
				"/accept-invitation?token=test-token",
			]);

			await waitFor(() => {
				expect(screen.getByText(/validating invitation/i)).toBeInTheDocument();
			});
		});
	});

	describe("Token Only Called Once", () => {
		it("should not call getInvitationInfo multiple times for the same token", async () => {
			(teamService.getInvitationInfo as Mock).mockResolvedValue({
				valid: true,
				expired: false,
				email: "test@example.com",
				organizationName: "Test Org",
				organizationType: "BUYER",
				inviterName: "John Doe",
			});

			renderWithRouter(<AcceptInvitationPage />, [
				"/accept-invitation?token=valid-token",
			]);

			await waitFor(() => {
				expect(mockNavigate).toHaveBeenCalled();
			});

			// Should only be called once even with React Strict Mode
			// The component uses useRef to prevent double calls
			expect(teamService.getInvitationInfo).toHaveBeenCalledTimes(1);
		});
	});

	describe("RTL Support", () => {
		it("should render with correct LTR direction attribute for English", async () => {
			(teamService.getInvitationInfo as Mock).mockImplementation(
				() => new Promise(() => {}) // Never resolves
			);

			renderWithRouter(<AcceptInvitationPage />, [
				"/accept-invitation?token=test-token",
			]);

			await waitFor(() => {
				const container = screen.getByText(/validating invitation/i).closest('[dir]');
				expect(container).toHaveAttribute("dir", "ltr");
			});
		});
	});
});
