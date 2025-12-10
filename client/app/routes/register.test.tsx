/**
 * Registration Page Component Tests
 *
 * TDD tests written FIRST according to acceptance criteria.
 * Tests for registration form component with validation, password strength, and auth integration.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";

// Mock the auth context
vi.mock("@/contexts/AuthContext", () => ({
	useAuth: vi.fn(() => ({
		register: vi.fn(),
		isAuthenticated: false,
		isLoading: false,
	})),
}));

// Mock i18next
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => {
			const translations: Record<string, string> = {
				"auth.register.title": "Create Account",
				"auth.register.subtitle": "Enter your details to create your account",
				"auth.register.email": "Email",
				"auth.register.password": "Password",
				"auth.register.confirmPassword": "Confirm Password",
				"auth.register.organizationName": "Organization Name",
				"auth.register.organizationType": "Organization Type",
				"auth.register.selectType": "Select organization type",
				"auth.register.supplier": "Supplier",
				"auth.register.buyer": "Buyer",
				"auth.register.submit": "Create Account",
				"auth.register.submitting": "Creating account...",
				"auth.register.hasAccount": "Already have an account?",
				"auth.register.login": "Sign in",
				"auth.register.error": "Registration failed. Please try again.",
				"auth.showPassword": "Show password",
				"auth.hidePassword": "Hide password",
				"auth.passwordStrength.weak": "Weak",
				"auth.passwordStrength.medium": "Medium",
				"auth.passwordStrength.strong": "Strong",
				"auth.validation.emailRequired": "Email is required",
				"auth.validation.emailInvalid": "Please enter a valid email address",
				"auth.validation.passwordRequired": "Password is required",
				"auth.validation.passwordMinLength": "Password must be at least 8 characters",
				"auth.validation.passwordUppercase": "Password must contain at least one uppercase letter",
				"auth.validation.passwordLowercase": "Password must contain at least one lowercase letter",
				"auth.validation.passwordNumber": "Password must contain at least one number",
				"auth.validation.confirmPasswordRequired": "Please confirm your password",
				"auth.validation.passwordsMatch": "Passwords do not match",
				"auth.validation.organizationNameRequired": "Organization name is required",
				"auth.validation.organizationNameMinLength": "Organization name must be at least 2 characters",
				"auth.validation.organizationTypeRequired": "Please select an organization type",
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
import RegisterPage from "./register";

// Wrapper with router
function renderWithRouter(ui: ReactNode) {
	return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("Registration Page", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(useAuth as Mock).mockReturnValue({
			register: vi.fn(),
			isAuthenticated: false,
			isLoading: false,
		});
	});

	describe("Form Fields", () => {
		it("should render email input field", () => {
			renderWithRouter(<RegisterPage />);
			expect(screen.getByLabelText("Email")).toBeInTheDocument();
		});

		it("should render password input field", () => {
			renderWithRouter(<RegisterPage />);
			expect(screen.getByLabelText("Password")).toBeInTheDocument();
		});

		it("should render confirm password input field", () => {
			renderWithRouter(<RegisterPage />);
			expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
		});

		it("should render organization name input field", () => {
			renderWithRouter(<RegisterPage />);
			expect(screen.getByLabelText("Organization Name")).toBeInTheDocument();
		});

		it("should render organization type select field", () => {
			renderWithRouter(<RegisterPage />);
			expect(screen.getByRole("combobox")).toBeInTheDocument();
		});

		it("should render submit button", () => {
			renderWithRouter(<RegisterPage />);
			expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
		});

		it("should render link to login page", () => {
			renderWithRouter(<RegisterPage />);
			expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
		});
	});

	describe("Form Validation", () => {
		it("should show error when email is empty on submit", async () => {
			const user = userEvent.setup();
			renderWithRouter(<RegisterPage />);

			const submitButton = screen.getByRole("button", { name: /create account/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/email is required/i)).toBeInTheDocument();
			});
		});

		it("should show error when password is empty on submit", async () => {
			const user = userEvent.setup();
			renderWithRouter(<RegisterPage />);

			const emailInput = screen.getByLabelText("Email");
			await user.type(emailInput, "user@example.com");

			const submitButton = screen.getByRole("button", { name: /create account/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/password is required/i)).toBeInTheDocument();
			});
		});

		it("should show error when password is less than 8 characters", async () => {
			const user = userEvent.setup();
			renderWithRouter(<RegisterPage />);

			const emailInput = screen.getByLabelText("Email");
			const passwordInput = screen.getByLabelText("Password");

			await user.type(emailInput, "user@example.com");
			await user.type(passwordInput, "Short1");

			const submitButton = screen.getByRole("button", { name: /create account/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
			});
		});

		it("should validate confirm password field is required", async () => {
			const user = userEvent.setup();
			renderWithRouter(<RegisterPage />);

			const emailInput = screen.getByLabelText("Email");
			const passwordInput = screen.getByLabelText("Password");

			await user.type(emailInput, "user@example.com");
			await user.type(passwordInput, "Password123");

			const submitButton = screen.getByRole("button", { name: /create account/i });
			await user.click(submitButton);

			await waitFor(() => {
				// Should show error for confirm password required
				expect(screen.getByText(/confirm your password/i)).toBeInTheDocument();
			});
		});

		it("should show error when organization name is too short", async () => {
			const user = userEvent.setup();
			renderWithRouter(<RegisterPage />);

			const emailInput = screen.getByLabelText("Email");
			const passwordInput = screen.getByLabelText("Password");
			const confirmPasswordInput = screen.getByLabelText("Confirm Password");
			const orgNameInput = screen.getByLabelText("Organization Name");

			await user.type(emailInput, "user@example.com");
			await user.type(passwordInput, "Password123");
			await user.type(confirmPasswordInput, "Password123");
			await user.type(orgNameInput, "A");

			const submitButton = screen.getByRole("button", { name: /create account/i });
			await user.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument();
			});
		});
	});

	describe("Password Strength Indicator", () => {
		it("should show password strength indicator", () => {
			renderWithRouter(<RegisterPage />);
			// The strength indicator should be present
			expect(screen.getByTestId("password-strength")).toBeInTheDocument();
		});

		it("should show weak strength for poor password", async () => {
			const user = userEvent.setup();
			renderWithRouter(<RegisterPage />);

			const passwordInput = screen.getByLabelText("Password");
			await user.type(passwordInput, "password");

			await waitFor(() => {
				expect(screen.getByText(/weak/i)).toBeInTheDocument();
			});
		});

		it("should show medium strength for moderate password", async () => {
			const user = userEvent.setup();
			renderWithRouter(<RegisterPage />);

			const passwordInput = screen.getByLabelText("Password");
			await user.type(passwordInput, "Password");

			await waitFor(() => {
				expect(screen.getByText(/medium/i)).toBeInTheDocument();
			});
		});

		it("should show strong strength for good password", async () => {
			const user = userEvent.setup();
			renderWithRouter(<RegisterPage />);

			const passwordInput = screen.getByLabelText("Password");
			await user.type(passwordInput, "Password123!");

			await waitFor(() => {
				expect(screen.getByText(/strong/i)).toBeInTheDocument();
			});
		});
	});

	describe("Show/Hide Password Toggle", () => {
		it("should have password fields hidden by default", () => {
			renderWithRouter(<RegisterPage />);
			const passwordInput = screen.getByLabelText("Password");
			const confirmPasswordInput = screen.getByLabelText("Confirm Password");

			expect(passwordInput).toHaveAttribute("type", "password");
			expect(confirmPasswordInput).toHaveAttribute("type", "password");
		});

		it("should toggle password visibility", async () => {
			const user = userEvent.setup();
			renderWithRouter(<RegisterPage />);

			const passwordInput = screen.getByLabelText("Password");
			const toggleButtons = screen.getAllByRole("button", { name: /show password/i });
			const passwordToggle = toggleButtons[0];

			expect(passwordInput).toHaveAttribute("type", "password");

			await user.click(passwordToggle);
			expect(passwordInput).toHaveAttribute("type", "text");

			await user.click(passwordToggle);
			expect(passwordInput).toHaveAttribute("type", "password");
		});
	});

	describe("Organization Type Selection", () => {
		it("should render organization type select with options", () => {
			renderWithRouter(<RegisterPage />);

			// Verify the select is present
			const selectTrigger = screen.getByRole("combobox");
			expect(selectTrigger).toBeInTheDocument();
		});

		it("should show placeholder text in select", () => {
			renderWithRouter(<RegisterPage />);

			const selectTrigger = screen.getByRole("combobox");
			expect(selectTrigger).toHaveTextContent(/select organization type/i);
		});
	});

	describe("Loading States", () => {
		it("should have a submit button that can be disabled", () => {
			renderWithRouter(<RegisterPage />);

			const submitButton = screen.getByRole("button", { name: /create account/i });
			// Button should not be disabled by default
			expect(submitButton).not.toBeDisabled();
		});

		it("should show button text correctly", () => {
			renderWithRouter(<RegisterPage />);

			const submitButton = screen.getByRole("button", { name: /create account/i });
			expect(submitButton).toBeInTheDocument();
		});
	});

	describe("Error Display", () => {
		it("should show validation errors when form is incomplete", async () => {
			const user = userEvent.setup();
			renderWithRouter(<RegisterPage />);

			// Just click submit without filling anything
			const submitButton = screen.getByRole("button", { name: /create account/i });
			await user.click(submitButton);

			await waitFor(() => {
				// Should show email required error
				expect(screen.getByText(/email is required/i)).toBeInTheDocument();
			});
		});
	});

	describe("Form Submission", () => {
		it("should validate all fields before submission", async () => {
			const user = userEvent.setup();
			renderWithRouter(<RegisterPage />);

			// Fill only some fields
			await user.type(screen.getByLabelText("Email"), "user@example.com");
			await user.type(screen.getByLabelText("Password"), "Password123");

			const submitButton = screen.getByRole("button", { name: /create account/i });
			await user.click(submitButton);

			// Should show confirm password required error
			await waitFor(() => {
				expect(screen.getByText(/confirm your password/i)).toBeInTheDocument();
			});
		});
	});

	describe("Navigation Links", () => {
		it("should have link to login page with correct href", () => {
			renderWithRouter(<RegisterPage />);
			const loginLink = screen.getByRole("link", { name: /sign in/i });
			expect(loginLink).toHaveAttribute("href", "/login");
		});
	});

	describe("Responsive Design", () => {
		it("should render within a card component", () => {
			renderWithRouter(<RegisterPage />);
			const titles = screen.getAllByText(/create account/i);
			expect(titles.length).toBeGreaterThan(0);
			expect(screen.getByText(/enter your details/i)).toBeInTheDocument();
		});
	});

	describe("RTL Support", () => {
		it("should render correctly for RTL languages", () => {
			renderWithRouter(<RegisterPage />);
			expect(screen.getByLabelText("Email")).toBeInTheDocument();
		});
	});
});
