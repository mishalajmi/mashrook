/**
 * Authentication Form Validation Schemas
 *
 * Zod schemas for login and registration form validation.
 * Includes password strength calculation utility.
 */

import {z} from "zod";

/**
 * Login form validation schema
 *
 * - Email: required, valid email format
 * - Password: required, minimum 8 characters
 */
export const loginSchema = z.object({
	email: z
		.string()
		.min(1, "Email is required")
		.email("Please enter a valid email address"),
	password: z
		.string()
		.min(1, "Password is required")
		.min(8, "Password must be at least 8 characters"),
});

/**
 * Registration form validation schema
 *
 * - Email: required, valid email format
 * - Password: required, min 8 chars, must contain uppercase, lowercase, and number
 * - Confirm Password: must match password
 * - Organization Name: required, min 2 chars
 * - Organization Type: required, SUPPLIER or BUYER
 */
export const registerSchema = z
	.object({
        ownerFirstName: z
            .string()
            .min(1, "Please enter a valid first name"),
        ownerLastName: z
            .string()
            .min(1, "Please enter a valid last name"),
		ownerEmail: z
			.email("Please enter a valid email address")
			.min(1, "Email is required"),
		ownerPassword: z
			.string()
			.min(1, "Password is required")
			.min(8, "Password must be at least 8 characters")
			.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
			.regex(/[a-z]/, "Password must contain at least one lowercase letter")
			.regex(/[0-9]/, "Password must contain at least one number"),
		ownerConfirmPassword: z.string().min(1, "Please confirm your password"),
		organizationNameEn: z
			.string()
			.min(1, "Organization english name is required")
			.min(2, "Organization english name must be at least 2 characters"),
        organizationNameAr: z
            .string()
            .min(1, "Organization arabic name is required")
            .min(2, "Organization arabic name must be at least 2 characters"),
		organizationType: z.enum(["SUPPLIER", "BUYER"], { message: "Please select an organization type" }),
        organizationIndustry: z
            .string()
            .min(4, "Please enter a valid industry field")
	})
	.refine((data) => data.ownerPassword === data.ownerConfirmPassword, {
		message: "Passwords do not match",
		path: ["ownerConfirmPassword"],
	});

/**
 * Invitation registration form validation schema
 *
 * Simplified schema for users accepting a team invitation.
 * Organization fields are not needed since the user joins an existing org.
 *
 * - First Name: required
 * - Last Name: required
 * - Email: required, valid email format (pre-filled from invitation)
 * - Password: required, min 8 chars, must contain uppercase, lowercase, and number
 * - Confirm Password: must match password
 */
export const invitationRegisterSchema = z
	.object({
		ownerFirstName: z
			.string()
			.min(1, "Please enter a valid first name"),
		ownerLastName: z
			.string()
			.min(1, "Please enter a valid last name"),
		ownerEmail: z
			.email("Please enter a valid email address")
			.min(1, "Email is required"),
		ownerPassword: z
			.string()
			.min(1, "Password is required")
			.min(8, "Password must be at least 8 characters")
			.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
			.regex(/[a-z]/, "Password must contain at least one lowercase letter")
			.regex(/[0-9]/, "Password must contain at least one number"),
		ownerConfirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine((data) => data.ownerPassword === data.ownerConfirmPassword, {
		message: "Passwords do not match",
		path: ["ownerConfirmPassword"],
	});

/**
 * Type inference for login form data
 */
export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Type inference for registration form data
 */
export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Type inference for invitation registration form data
 */
export type InvitationRegisterFormData = z.infer<typeof invitationRegisterSchema>;

/**
 * Password strength criteria
 */
export interface PasswordCriteria {
	hasMinLength: boolean;
	hasUppercase: boolean;
	hasLowercase: boolean;
	hasNumber: boolean;
	hasSpecialChar: boolean;
}

/**
 * Password strength level
 */
export type PasswordStrengthLevel = "weak" | "medium" | "strong";

/**
 * Password strength result
 */
export interface PasswordStrength {
	level: PasswordStrengthLevel;
	score: number;
	criteria: PasswordCriteria;
}

/**
 * Calculate password strength
 *
 * Evaluates password against multiple criteria:
 * - Minimum length (8 characters)
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains number
 * - Contains special character
 *
 * @param password - Password to evaluate
 * @returns Password strength object with level, score, and criteria
 */
export function getPasswordStrength(password: string): PasswordStrength {
	const criteria: PasswordCriteria = {
		hasMinLength: password.length >= 8,
		hasUppercase: /[A-Z]/.test(password),
		hasLowercase: /[a-z]/.test(password),
		hasNumber: /[0-9]/.test(password),
		hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
	};

	// Calculate score based on criteria met
	const score = Object.values(criteria).filter(Boolean).length;

	// Determine strength level
	// Min length is required for medium or strong
	let level: PasswordStrengthLevel;
	if (!criteria.hasMinLength || score <= 2) {
		level = "weak";
	} else if (score <= 3) {
		level = "medium";
	} else {
		level = "strong";
	}

	return {
		level,
		score,
		criteria,
	};
}
