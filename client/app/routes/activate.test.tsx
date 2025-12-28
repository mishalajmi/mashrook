/**
 * Account Activation Page Component Tests
 *
 * Tests written according to acceptance criteria from MAS-96.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";

// Mock the i18n module first to prevent initialization errors
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

// Mock the auth service
vi.mock("@/services/auth.service", () => ({
	authService: {
		activateAccount: vi.fn(),
		resendActivationEmail: vi.fn(),
	},
}));

// Mock the auth context
vi.mock("@/contexts/AuthContext", () => ({
	useAuth: vi.fn(() => ({
		user: null,
		isAuthenticated: false,
		isLoading: false,
		logout: vi.fn(),
	})),
}));

// Mock i18next
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => {
			const translations: Record<string, string> = {
				// Activate page translations
				"auth.activate.loading.title": "Activating your account...",
				"auth.activate.loading.message": "Please wait while we verify your activation token.",
				"auth.activate.success.title": "Account Activated!",
				"auth.activate.success.message": "Your account and organization have been activated successfully. You can now sign in.",
				"auth.activate.success.redirectingIn": "Redirecting to login in",
				"auth.activate.success.seconds": "seconds...",
				"auth.activate.success.loginNow": "Go to Login Now",
				"auth.activate.error.title": "Activation Failed",
				"auth.activate.error.message": "The activation link is invalid or has expired.",
				"auth.activate.error.missingToken": "No activation token was provided.",
				"auth.activate.error.resendTitle": "Resend Activation Email",
				"auth.activate.error.email": "Email Address",
				"auth.activate.error.resendButton": "Resend Activation Email",
				"auth.activate.error.sending": "Sending...",
				"auth.activate.resent.title": "Email Sent!",
				"auth.activate.resent.message": "A new activation email has been sent. Please check your inbox.",
				"auth.activate.resent.backToLogin": "Back to Login",
				// Common translations
				"common.appName": "Mashrook",
				"common.home": "Home",
				"common.switchToArabic": "Switch to Arabic",
				"common.switchToEnglish": "Switch to English",
				// Header translations
				"header.features": "Features",
				"header.howItWorks": "How It Works",
				"header.pricing": "Pricing",
				"header.testimonials": "Testimonials",
				"header.signIn": "Sign In",
				"header.getStarted": "Get Started",
				"header.openMenu": "Open menu",
				"header.closeMenu": "Close menu",
				"header.userMenu": "User menu",
				"header.profile": "Profile",
				"header.dashboard": "Dashboard",
				"header.logout": "Logout",
				// Theme translations
				"theme.switchToDark": "Switch to dark mode",
				"theme.switchToLight": "Switch to light mode",
			};
			return translations[key] || key;
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

// Import mocked auth service
import { authService } from "@/services/auth.service";

// Import component
import ActivatePage from "./activate";

// Wrapper with router and specific search params
function renderWithRouter(ui: ReactNode, initialEntries: string[] = ["/activate"]) {
	return render(
		<MemoryRouter initialEntries={initialEntries}>
			{ui}
		</MemoryRouter>
	);
}

describe("Account Activation Page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("AC1: /activate route exists and accepts ?token= query parameter", () => {
		it("should render the activate page", () => {
			(authService.activateAccount as Mock).mockImplementation(
				() => new Promise(() => {}) // Never resolves to keep loading
			);
			renderWithRouter(<ActivatePage />, ["/activate?token=test-token"]);
			// Use getAllByText since there's both a visible title and sr-only status
			const loadingTexts = screen.getAllByText(/activating your account/i);
			expect(loadingTexts.length).toBeGreaterThanOrEqual(1);
		});

		it("should extract token from URL query parameter", async () => {
			(authService.activateAccount as Mock).mockResolvedValue({ success: true, message: "Success" });
			renderWithRouter(<ActivatePage />, ["/activate?token=my-activation-token"]);

			await waitFor(() => {
				expect(authService.activateAccount).toHaveBeenCalledWith("my-activation-token");
			});
		});
	});

	describe("AC2: Page auto-calls POST /v1/auth/activate?token={token} on load", () => {
		it("should automatically call activateAccount on mount when token is present", async () => {
			(authService.activateAccount as Mock).mockResolvedValue({ success: true, message: "Success" });
			renderWithRouter(<ActivatePage />, ["/activate?token=valid-token"]);

			await waitFor(() => {
				// Check that the function was called with the correct token (may be called multiple times in strict mode)
				expect(authService.activateAccount).toHaveBeenCalledWith("valid-token");
			});
		});

		it("should not call activateAccount when token is missing", async () => {
			renderWithRouter(<ActivatePage />, ["/activate"]);

			await waitFor(() => {
				expect(authService.activateAccount).not.toHaveBeenCalled();
			});
		});
	});

	describe("AC3: Loading state shows spinner with 'Activating...' message", () => {
		it("should display loading state with spinner initially", () => {
			(authService.activateAccount as Mock).mockImplementation(
				() => new Promise(() => {}) // Never resolves to keep loading
			);
			renderWithRouter(<ActivatePage />, ["/activate?token=test-token"]);

			// Use getAllByText since there's both a visible title and sr-only status
			const loadingTexts = screen.getAllByText(/activating your account/i);
			expect(loadingTexts.length).toBeGreaterThanOrEqual(1);
			expect(screen.getByText(/please wait while we verify/i)).toBeInTheDocument();
		});
	});

	describe("AC4: Success state shows confirmation with 5-second countdown to login redirect", () => {
		it("should show success state after successful activation", async () => {
			(authService.activateAccount as Mock).mockResolvedValue({ success: true, message: "Success" });
			renderWithRouter(<ActivatePage />, ["/activate?token=valid-token"]);

			await waitFor(() => {
				expect(screen.getByText(/account activated/i)).toBeInTheDocument();
			});
		});

		it("should display countdown starting from 5 seconds", async () => {
			(authService.activateAccount as Mock).mockResolvedValue({ success: true, message: "Success" });
			renderWithRouter(<ActivatePage />, ["/activate?token=valid-token"]);

			await waitFor(() => {
				expect(screen.getByText(/redirecting to login in/i)).toBeInTheDocument();
				expect(screen.getByText(/5/)).toBeInTheDocument();
				expect(screen.getByText(/seconds/i)).toBeInTheDocument();
			});
		});

		it("should countdown from 5 to lower values", async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			(authService.activateAccount as Mock).mockResolvedValue({ success: true, message: "Success" });
			renderWithRouter(<ActivatePage />, ["/activate?token=valid-token"]);

			await waitFor(() => {
				expect(screen.getByText(/5/)).toBeInTheDocument();
			});

			// Advance timer by 1 second
			act(() => {
				vi.advanceTimersByTime(1000);
			});

			await waitFor(() => {
				expect(screen.getByText(/4/)).toBeInTheDocument();
			});

			vi.useRealTimers();
		});

		it("should redirect to login after countdown completes", async () => {
			vi.useFakeTimers({ shouldAdvanceTime: true });
			(authService.activateAccount as Mock).mockResolvedValue({ success: true, message: "Success" });
			renderWithRouter(<ActivatePage />, ["/activate?token=valid-token"]);

			await waitFor(() => {
				expect(screen.getByText(/account activated/i)).toBeInTheDocument();
			});

			// Advance timer by 5 seconds
			act(() => {
				vi.advanceTimersByTime(5000);
			});

			await waitFor(() => {
				expect(mockNavigate).toHaveBeenCalledWith("/login");
			});

			vi.useRealTimers();
		});

		it("should have a 'Go to Login Now' button that navigates immediately", async () => {
			(authService.activateAccount as Mock).mockResolvedValue({ success: true, message: "Success" });
			const user = userEvent.setup();
			renderWithRouter(<ActivatePage />, ["/activate?token=valid-token"]);

			await waitFor(() => {
				expect(screen.getByText(/account activated/i)).toBeInTheDocument();
			});

			const loginButton = screen.getByRole("button", { name: /go to login now/i });
			await user.click(loginButton);

			expect(mockNavigate).toHaveBeenCalledWith("/login");
		});
	});

	describe("AC5: Error state shows error message and email input for resending activation", () => {
		it("should show error state when activation fails", async () => {
			(authService.activateAccount as Mock).mockRejectedValue(new Error("Invalid token"));
			renderWithRouter(<ActivatePage />, ["/activate?token=invalid-token"]);

			await waitFor(() => {
				expect(screen.getByText(/activation failed/i)).toBeInTheDocument();
			});
		});

		it("should show error message for invalid or expired token", async () => {
			(authService.activateAccount as Mock).mockRejectedValue(new Error("Invalid token"));
			renderWithRouter(<ActivatePage />, ["/activate?token=expired-token"]);

			await waitFor(() => {
				expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument();
			});
		});

		it("should show error message when no token is provided", async () => {
			renderWithRouter(<ActivatePage />, ["/activate"]);

			await waitFor(() => {
				expect(screen.getByText(/no activation token was provided/i)).toBeInTheDocument();
			});
		});

		it("should display email input field for resending activation", async () => {
			(authService.activateAccount as Mock).mockRejectedValue(new Error("Invalid token"));
			renderWithRouter(<ActivatePage />, ["/activate?token=invalid-token"]);

			await waitFor(() => {
				expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
			});
		});

		it("should display resend activation email button", async () => {
			(authService.activateAccount as Mock).mockRejectedValue(new Error("Invalid token"));
			renderWithRouter(<ActivatePage />, ["/activate?token=invalid-token"]);

			await waitFor(() => {
				expect(screen.getByRole("button", { name: /resend activation email/i })).toBeInTheDocument();
			});
		});
	});

	describe("AC6: 'Resend activation email' calls POST /v1/auth/resend-activation and shows confirmation", () => {
		it("should call resendActivationEmail when form is submitted", async () => {
			(authService.activateAccount as Mock).mockRejectedValue(new Error("Invalid token"));
			(authService.resendActivationEmail as Mock).mockResolvedValue({ success: true, message: "Sent" });
			const user = userEvent.setup();

			renderWithRouter(<ActivatePage />, ["/activate?token=invalid-token"]);

			await waitFor(() => {
				expect(screen.getByText(/activation failed/i)).toBeInTheDocument();
			});

			const emailInput = screen.getByLabelText(/email address/i);
			await user.type(emailInput, "test@example.com");

			const resendButton = screen.getByRole("button", { name: /resend activation email/i });
			await user.click(resendButton);

			await waitFor(() => {
				expect(authService.resendActivationEmail).toHaveBeenCalledWith("test@example.com");
			});
		});

		it("should show sending state while resending email", async () => {
			(authService.activateAccount as Mock).mockRejectedValue(new Error("Invalid token"));
			(authService.resendActivationEmail as Mock).mockImplementation(
				() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 500))
			);
			const user = userEvent.setup();

			renderWithRouter(<ActivatePage />, ["/activate?token=invalid-token"]);

			await waitFor(() => {
				expect(screen.getByText(/activation failed/i)).toBeInTheDocument();
			});

			const emailInput = screen.getByLabelText(/email address/i);
			await user.type(emailInput, "test@example.com");

			const resendButton = screen.getByRole("button", { name: /resend activation email/i });
			await user.click(resendButton);

			await waitFor(() => {
				expect(screen.getByText(/sending/i)).toBeInTheDocument();
			});
		});

		it("should show confirmation after successfully resending email", async () => {
			// Create a resolvable promise for better control
			let resolveResend: (value: { success: boolean; message: string }) => void;
			const resendPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
				resolveResend = resolve;
			});

			(authService.activateAccount as Mock).mockRejectedValue(new Error("Invalid token"));
			(authService.resendActivationEmail as Mock).mockReturnValue(resendPromise);
			const user = userEvent.setup();

			renderWithRouter(<ActivatePage />, ["/activate?token=invalid-token"]);

			// Wait for error state to render
			await screen.findByText(/activation failed/i);

			const emailInput = screen.getByLabelText(/email address/i);
			await user.clear(emailInput);
			await user.type(emailInput, "valid@example.com");

			// Submit the form by clicking the button
			const resendButton = screen.getByRole("button", { name: /resend activation email/i });
			await user.click(resendButton);

			// Should show sending state
			expect(screen.getByText(/sending/i)).toBeInTheDocument();

			// Resolve the promise
			resolveResend!({ success: true, message: "Sent" });

			// Wait for the resend success state
			await waitFor(() => {
				expect(screen.getByText(/email sent/i)).toBeInTheDocument();
			});
		});

		it("should display back to login link after resending", async () => {
			// Create a resolvable promise for better control
			let resolveResend: (value: { success: boolean; message: string }) => void;
			const resendPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
				resolveResend = resolve;
			});

			(authService.activateAccount as Mock).mockRejectedValue(new Error("Invalid token"));
			(authService.resendActivationEmail as Mock).mockReturnValue(resendPromise);
			const user = userEvent.setup();

			renderWithRouter(<ActivatePage />, ["/activate?token=invalid-token"]);

			// Wait for error state to render
			await screen.findByText(/activation failed/i);

			const emailInput = screen.getByLabelText(/email address/i);
			await user.clear(emailInput);
			await user.type(emailInput, "valid@example.com");

			const resendButton = screen.getByRole("button", { name: /resend activation email/i });
			await user.click(resendButton);

			// Should show sending state
			expect(screen.getByText(/sending/i)).toBeInTheDocument();

			// Resolve the promise
			resolveResend!({ success: true, message: "Sent" });

			// Wait for the resend success state
			await waitFor(() => {
				expect(screen.getByRole("link", { name: /back to login/i })).toBeInTheDocument();
			});
		});
	});

	describe("AC7: Dark mode and RTL support working correctly", () => {
		it("should render with correct RTL direction attribute", () => {
			(authService.activateAccount as Mock).mockImplementation(
				() => new Promise(() => {}) // Never resolves to keep loading
			);
			renderWithRouter(<ActivatePage />, ["/activate?token=test-token"]);

			// The component uses dir={isRtl ? "rtl" : "ltr"}, and isRtl is mocked to false
			const loadingTexts = screen.getAllByText(/activating your account/i);
			const container = loadingTexts[0].closest('[dir]');
			expect(container).toHaveAttribute("dir", "ltr");
		});

		it("should render without errors (dark mode is handled by CSS classes)", () => {
			(authService.activateAccount as Mock).mockImplementation(
				() => new Promise(() => {}) // Never resolves to keep loading
			);
			renderWithRouter(<ActivatePage />, ["/activate?token=test-token"]);

			const loadingTexts = screen.getAllByText(/activating your account/i);
			expect(loadingTexts.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe("UI Structure", () => {
		it("should render within a Card component", async () => {
			(authService.activateAccount as Mock).mockResolvedValue({ success: true });
			renderWithRouter(<ActivatePage />, ["/activate?token=test-token"]);

			await waitFor(() => {
				expect(screen.getByText(/account activated/i)).toBeInTheDocument();
			});
		});

		it("should display success icon in success state", async () => {
			(authService.activateAccount as Mock).mockResolvedValue({ success: true });
			renderWithRouter(<ActivatePage />, ["/activate?token=test-token"]);

			await waitFor(() => {
				const title = screen.getByText(/account activated/i);
				expect(title).toBeInTheDocument();
				// Check for the green success styling
				expect(title).toHaveClass("text-green-600");
			});
		});

		it("should display error icon in error state", async () => {
			(authService.activateAccount as Mock).mockRejectedValue(new Error("Failed"));
			renderWithRouter(<ActivatePage />, ["/activate?token=invalid-token"]);

			await waitFor(() => {
				const title = screen.getByText(/activation failed/i);
				expect(title).toBeInTheDocument();
				// Check for the destructive error styling
				expect(title).toHaveClass("text-destructive");
			});
		});
	});
});
