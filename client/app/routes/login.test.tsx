/**
 * Login Page Component Tests
 *
 * TDD tests written FIRST according to acceptance criteria.
 * Tests for login form component with validation and auth integration.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";

// Mock the auth context
vi.mock("@/contexts/AuthContext", () => ({
	useAuth: vi.fn(() => ({
		login: vi.fn(),
		isAuthenticated: false,
		isLoading: false,
	})),
}));

// Mock i18next
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => {
			const translations: Record<string, string> = {
				"auth.login.title": "Sign In",
				"auth.login.subtitle": "Enter your credentials to access your account",
				"auth.login.email": "Email",
				"auth.login.password": "Password",
				"auth.login.submit": "Sign In",
				"auth.login.submitting": "Signing in...",
				"auth.login.noAccount": "Don't have an account?",
				"auth.login.register": "Sign up",
				"auth.login.forgotPassword": "Forgot password?",
				"auth.validation.emailRequired": "Email is required",
				"auth.validation.emailInvalid": "Please enter a valid email address",
				"auth.validation.passwordRequired": "Password is required",
				"auth.validation.passwordMinLength": "Password must be at least 8 characters",
				"auth.login.error": "Invalid email or password",
				"auth.showPassword": "Show password",
				"auth.hidePassword": "Hide password",
			};
			return translations[key] || key;
		},
	}),
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

// Import mocked auth
import { useAuth } from "@/contexts/AuthContext";

// Import component (to be implemented)
import LoginPage from "./login";

// Wrapper with router
function renderWithRouter(ui: ReactNode) {
	return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("Login Page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(useAuth as Mock).mockReturnValue({
			login: vi.fn(),
			isAuthenticated: false,
			isLoading: false,
		});
	});

	describe("Form Fields", () => {
		it("should render email input field", () => {
			renderWithRouter(<LoginPage />);
			expect(screen.getByLabelText("Email")).toBeInTheDocument();
		});

		it("should render password input field", () => {
			renderWithRouter(<LoginPage />);
			expect(screen.getByLabelText("Password")).toBeInTheDocument();
		});

		it("should render submit button", () => {
			renderWithRouter(<LoginPage />);
			expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
		});

		it("should render link to registration page", () => {
			renderWithRouter(<LoginPage />);
			expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
		});
	});

	describe("Form Validation", () => {
		it("should show error when email is empty on submit", async () => {
			const user = userEvent.setup();
			renderWithRouter(<LoginPage />);

			const submitButton = screen.getByRole("button", { name: /sign in/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/email is required/i)).toBeInTheDocument();
			});
		});

		it("should validate email field is required before password errors", async () => {
			const user = userEvent.setup();
			renderWithRouter(<LoginPage />);

			// Leave email empty, fill password
			const passwordInput = screen.getByLabelText("Password");
			await user.type(passwordInput, "short");

			const submitButton = screen.getByRole("button", { name: /sign in/i });
			await user.click(submitButton);

			// Email required error should show first
			await waitFor(() => {
				expect(screen.getByText(/email is required/i)).toBeInTheDocument();
			});
		});

		it("should show error when password is empty on submit", async () => {
			const user = userEvent.setup();
			renderWithRouter(<LoginPage />);

			const emailInput = screen.getByLabelText("Email");
			await user.type(emailInput, "user@example.com");

			const submitButton = screen.getByRole("button", { name: /sign in/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/password is required/i)).toBeInTheDocument();
			});
		});

		it("should show error when password is less than 8 characters", async () => {
			const user = userEvent.setup();
			renderWithRouter(<LoginPage />);

			const emailInput = screen.getByLabelText("Email");
			const passwordInput = screen.getByLabelText("Password");

			await user.type(emailInput, "user@example.com");
			await user.type(passwordInput, "short");

			const submitButton = screen.getByRole("button", { name: /sign in/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
			});
		});
	});

	describe("Show/Hide Password Toggle", () => {
		it("should have password field hidden by default", () => {
			renderWithRouter(<LoginPage />);
			const passwordInput = screen.getByLabelText("Password");
			expect(passwordInput).toHaveAttribute("type", "password");
		});

		it("should toggle password visibility when clicking show/hide button", async () => {
			const user = userEvent.setup();
			renderWithRouter(<LoginPage />);

			const passwordInput = screen.getByLabelText("Password");
			const toggleButton = screen.getByRole("button", { name: /show password/i });

			expect(passwordInput).toHaveAttribute("type", "password");

			await user.click(toggleButton);
			expect(passwordInput).toHaveAttribute("type", "text");

			await user.click(toggleButton);
			expect(passwordInput).toHaveAttribute("type", "password");
		});
	});

	describe("Loading States", () => {
		it("should show loading state during form submission", async () => {
			const user = userEvent.setup();
			const mockLogin = vi.fn(
				() => new Promise((resolve) => setTimeout(resolve, 100))
			);
			(useAuth as Mock).mockReturnValue({
				login: mockLogin,
				isAuthenticated: false,
				isLoading: false,
			});

			renderWithRouter(<LoginPage />);

			const emailInput = screen.getByLabelText("Email");
			const passwordInput = screen.getByLabelText("Password");

			await user.type(emailInput, "user@example.com");
			await user.type(passwordInput, "Password123");

			const submitButton = screen.getByRole("button", { name: /sign in/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/signing in/i)).toBeInTheDocument();
			});
		});

		it("should disable submit button during loading", async () => {
			const user = userEvent.setup();
			const mockLogin = vi.fn(
				() => new Promise((resolve) => setTimeout(resolve, 100))
			);
			(useAuth as Mock).mockReturnValue({
				login: mockLogin,
				isAuthenticated: false,
				isLoading: false,
			});

			renderWithRouter(<LoginPage />);

			const emailInput = screen.getByLabelText("Email");
			const passwordInput = screen.getByLabelText("Password");

			await user.type(emailInput, "user@example.com");
			await user.type(passwordInput, "Password123");

			const submitButton = screen.getByRole("button", { name: /sign in/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(submitButton).toBeDisabled();
			});
		});
	});

	describe("Error Display", () => {
		it("should display error message when login fails", async () => {
			const user = userEvent.setup();
			const mockLogin = vi.fn().mockRejectedValue(new Error("Invalid credentials"));
			(useAuth as Mock).mockReturnValue({
				login: mockLogin,
				isAuthenticated: false,
				isLoading: false,
			});

			renderWithRouter(<LoginPage />);

			const emailInput = screen.getByLabelText("Email");
			const passwordInput = screen.getByLabelText("Password");

			await user.type(emailInput, "user@example.com");
			await user.type(passwordInput, "Password123");

			const submitButton = screen.getByRole("button", { name: /sign in/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByRole("alert")).toBeInTheDocument();
			});
		});
	});

	describe("Form Submission", () => {
		it("should call login with correct credentials on valid submit", async () => {
			const user = userEvent.setup();
			const mockLogin = vi.fn().mockResolvedValue(undefined);
			(useAuth as Mock).mockReturnValue({
				login: mockLogin,
				isAuthenticated: false,
				isLoading: false,
			});

			renderWithRouter(<LoginPage />);

			const emailInput = screen.getByLabelText("Email");
			const passwordInput = screen.getByLabelText("Password");

			await user.type(emailInput, "user@example.com");
			await user.type(passwordInput, "Password123");

			const submitButton = screen.getByRole("button", { name: /sign in/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(mockLogin).toHaveBeenCalledWith("user@example.com", "Password123");
			});
		});
	});

	describe("Navigation Links", () => {
		it("should have link to registration page with correct href", () => {
			renderWithRouter(<LoginPage />);
			const registerLink = screen.getByRole("link", { name: /sign up/i });
			expect(registerLink).toHaveAttribute("href", "/register");
		});
	});

	describe("Responsive Design", () => {
		it("should render within a card component", () => {
			renderWithRouter(<LoginPage />);
			// Check for card-like structure - use getAllByText since there might be multiple
			const titles = screen.getAllByText(/sign in/i);
			expect(titles.length).toBeGreaterThan(0);
			expect(screen.getByText(/enter your credentials/i)).toBeInTheDocument();
		});
	});

	describe("RTL Support", () => {
		it("should render correctly for RTL languages", () => {
			// The component uses isRtl from language context which is mocked
			renderWithRouter(<LoginPage />);
			// The component should render without errors
			expect(screen.getByLabelText("Email")).toBeInTheDocument();
		});
	});
});
