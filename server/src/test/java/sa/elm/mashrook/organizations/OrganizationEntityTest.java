package sa.elm.mashrook.organizations;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationStatus;
import sa.elm.mashrook.organizations.domain.OrganizationType;
import sa.elm.mashrook.organizations.dto.OrganizationCreateRequest;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests for OrganizationEntity.
 * Validates organization creation behavior.
 */
class OrganizationEntityTest {

    @Test
    @DisplayName("New organizations created from request should have PENDING status")
    void newOrganizationsFromRequestShouldHavePendingStatus() {
        // Given
        OrganizationCreateRequest request = OrganizationCreateRequest.builder()
                .nameEn("Test Organization")
                .nameAr("منظمة اختبار")
                .industry("Technology")
                .type(OrganizationType.BUYER)
                .ownerFirstName("John")
                .ownerLastName("Doe")
                .ownerEmail("john@test.com")
                .build();

        // When
        OrganizationEntity organization = OrganizationEntity.from(request);

        // Then
        assertThat(organization.getStatus()).isEqualTo(OrganizationStatus.PENDING);
    }

    @Test
    @DisplayName("New organizations should have all fields properly set from request")
    void newOrganizationsShouldHaveAllFieldsFromRequest() {
        // Given
        OrganizationCreateRequest request = OrganizationCreateRequest.builder()
                .nameEn("Test Organization")
                .nameAr("منظمة اختبار")
                .industry("Technology")
                .type(OrganizationType.SUPPLIER)
                .ownerFirstName("John")
                .ownerLastName("Doe")
                .ownerEmail("john@test.com")
                .build();

        // When
        OrganizationEntity organization = OrganizationEntity.from(request);

        // Then
        assertThat(organization.getNameEn()).isEqualTo("Test Organization");
        assertThat(organization.getNameAr()).isEqualTo("منظمة اختبار");
        assertThat(organization.getIndustry()).isEqualTo("Technology");
        assertThat(organization.getType()).isEqualTo(OrganizationType.SUPPLIER);
        assertThat(organization.getSlug()).isEqualTo("test-organization");
    }
}
