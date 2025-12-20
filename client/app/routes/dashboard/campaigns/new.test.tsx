/**
 * Campaign Creation Page Tests
 *
 * TDD tests for the campaign creation page.
 * Tests written FIRST according to acceptance criteria.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

import NewCampaignPage from "./new";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
	const actual = await vi.importActual("react-router");
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

describe("NewCampaignPage", () => {
	const renderWithRouter = (ui: React.ReactNode) => {
		return render(<MemoryRouter>{ui}</MemoryRouter>);
	};

	beforeEach(() => {
		mockNavigate.mockClear();
	});

	describe("Basic Rendering", () => {
		it("should render the page title", () => {
			renderWithRouter(<NewCampaignPage />);

			expect(screen.getByText("Create Campaign")).toBeInTheDocument();
		});

		it("should render back link to campaigns list", () => {
			renderWithRouter(<NewCampaignPage />);

			expect(screen.getByRole("link", { name: /back to campaigns/i })).toBeInTheDocument();
		});
	});

	describe("Multi-step Form", () => {
		it("should render step indicators", () => {
			renderWithRouter(<NewCampaignPage />);

			expect(screen.getByText("Basic Info")).toBeInTheDocument();
			expect(screen.getByText("Timeline")).toBeInTheDocument();
			expect(screen.getByText("Pricing")).toBeInTheDocument();
		});

		it("should start on Basic Info step", () => {
			renderWithRouter(<NewCampaignPage />);

			expect(screen.getByTestId("step-1")).toHaveAttribute("data-active", "true");
		});
	});

	describe("Basic Info Step", () => {
		it("should render title input", () => {
			renderWithRouter(<NewCampaignPage />);

			expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
		});

		it("should render description textarea", () => {
			renderWithRouter(<NewCampaignPage />);

			expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
		});

		it("should render product details textarea", () => {
			renderWithRouter(<NewCampaignPage />);

			expect(screen.getByLabelText(/product details/i)).toBeInTheDocument();
		});

		it("should render target quantity input", () => {
			renderWithRouter(<NewCampaignPage />);

			expect(screen.getByLabelText(/target quantity/i)).toBeInTheDocument();
		});

		it("should render Next button", () => {
			renderWithRouter(<NewCampaignPage />);

			expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
		});
	});

	describe("Form Navigation", () => {
		it("should move to Timeline step when Next is clicked on Basic Info", async () => {
			const user = userEvent.setup();
			renderWithRouter(<NewCampaignPage />);

			// Fill required fields
			await user.type(screen.getByLabelText(/title/i), "Test Campaign");
			await user.type(screen.getByLabelText(/description/i), "Test description");
			await user.type(screen.getByLabelText(/product details/i), "Test product");
			await user.clear(screen.getByLabelText(/target quantity/i));
			await user.type(screen.getByLabelText(/target quantity/i), "100");

			await user.click(screen.getByRole("button", { name: /next/i }));

			expect(screen.getByTestId("step-2")).toHaveAttribute("data-active", "true");
		});

		it("should show Back button on subsequent steps", async () => {
			const user = userEvent.setup();
			renderWithRouter(<NewCampaignPage />);

			// Fill required fields and go to next step
			await user.type(screen.getByLabelText(/title/i), "Test Campaign");
			await user.type(screen.getByLabelText(/description/i), "Test description");
			await user.type(screen.getByLabelText(/product details/i), "Test product");
			await user.clear(screen.getByLabelText(/target quantity/i));
			await user.type(screen.getByLabelText(/target quantity/i), "100");
			await user.click(screen.getByRole("button", { name: /next/i }));

			expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
		});

		it("should go back to previous step when Back is clicked", async () => {
			const user = userEvent.setup();
			renderWithRouter(<NewCampaignPage />);

			// Fill required fields and go to next step
			await user.type(screen.getByLabelText(/title/i), "Test Campaign");
			await user.type(screen.getByLabelText(/description/i), "Test description");
			await user.type(screen.getByLabelText(/product details/i), "Test product");
			await user.clear(screen.getByLabelText(/target quantity/i));
			await user.type(screen.getByLabelText(/target quantity/i), "100");
			await user.click(screen.getByRole("button", { name: /next/i }));
			await user.click(screen.getByRole("button", { name: /back/i }));

			expect(screen.getByTestId("step-1")).toHaveAttribute("data-active", "true");
		});
	});

	describe("Save Actions", () => {
		it("should render Save Draft button", () => {
			renderWithRouter(<NewCampaignPage />);

			expect(screen.getByRole("button", { name: /save draft/i })).toBeInTheDocument();
		});
	});

	describe("Validation", () => {
		it("should show error when title is empty and Next is clicked", async () => {
			const user = userEvent.setup();
			renderWithRouter(<NewCampaignPage />);

			await user.click(screen.getByRole("button", { name: /next/i }));

			expect(screen.getByText(/title is required/i)).toBeInTheDocument();
		});
	});
});
