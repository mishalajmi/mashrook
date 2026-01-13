/**
 * Address Service
 *
 * Provides address management functionality for organizations.
 * Communicates with the Spring Boot backend address endpoints.
 */

import { apiClient } from "@/lib/api-client";

/**
 * Address response from API
 */
export interface AddressResponse {
	id: string;
	organizationId: string;
	label: string;
	addressLine1: string;
	addressLine2?: string;
	city: string;
	state?: string;
	postalCode?: string;
	country: string;
	isPrimary: boolean;
	createdAt: string;
	updatedAt: string;
}

/**
 * Request payload for creating an address
 */
export interface CreateAddressRequest {
	label: string;
	addressLine1: string;
	addressLine2?: string;
	city: string;
	state?: string;
	postalCode?: string;
	country: string;
	isPrimary?: boolean;
}

/**
 * Request payload for updating an address
 */
export interface UpdateAddressRequest {
	label?: string;
	addressLine1?: string;
	addressLine2?: string;
	city?: string;
	state?: string;
	postalCode?: string;
	country?: string;
}

/**
 * Address service object providing address-related operations
 */
export const addressService = {
	/**
	 * Get all addresses for the current user's organization
	 *
	 * @returns List of addresses
	 */
	async getAddresses(): Promise<AddressResponse[]> {
		return apiClient.get<AddressResponse[]>("/v1/addresses");
	},

	/**
	 * Get a single address by ID
	 *
	 * @param id - Address ID
	 * @returns Address details
	 * @throws Error if address not found or not authorized
	 */
	async getAddress(id: string): Promise<AddressResponse> {
		return apiClient.get<AddressResponse>(`/v1/addresses/${id}`);
	},

	/**
	 * Create a new address
	 *
	 * @param request - Address details
	 * @returns Created address
	 */
	async createAddress(request: CreateAddressRequest): Promise<AddressResponse> {
		return apiClient.post<AddressResponse>("/v1/addresses", request);
	},

	/**
	 * Update an existing address
	 *
	 * @param id - Address ID
	 * @param request - Updated address details
	 * @returns Updated address
	 */
	async updateAddress(id: string, request: UpdateAddressRequest): Promise<AddressResponse> {
		return apiClient.patch<AddressResponse>(`/v1/addresses/${id}`, request);
	},

	/**
	 * Delete an address
	 *
	 * @param id - Address ID
	 */
	async deleteAddress(id: string): Promise<void> {
		return apiClient.delete(`/v1/addresses/${id}`);
	},

	/**
	 * Set an address as primary
	 *
	 * @param id - Address ID
	 * @returns Updated address
	 */
	async setPrimary(id: string): Promise<AddressResponse> {
		return apiClient.patch<AddressResponse>(`/v1/addresses/${id}/set-primary`, {});
	},
};
