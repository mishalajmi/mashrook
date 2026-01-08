package sa.elm.mashrook.campaigns.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sa.elm.mashrook.brackets.DiscountBracketService;
import sa.elm.mashrook.campaigns.domain.CampaignRepository;
import sa.elm.mashrook.campaigns.dto.CampaignCreateRequest;
import sa.elm.mashrook.brackets.dtos.DiscountBracketRequest;
import sa.elm.mashrook.exceptions.OrganizationPendingVerificationException;
import sa.elm.mashrook.notifications.NotificationService;
import sa.elm.mashrook.organizations.OrganizationService;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationStatus;
import sa.elm.mashrook.organizations.domain.OrganizationType;
import sa.elm.mashrook.pledges.PledgeService;
import sa.elm.mashrook.users.UserService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * Tests for CampaignService verification gates.
 * Ensures PENDING organizations cannot create campaigns.
 */
@ExtendWith(MockitoExtension.class)
class CampaignServiceVerificationGateTest {

    @Mock
    private CampaignRepository campaignRepository;

    @Mock
    private DiscountBracketService discountBracketService;

    @Mock
    private OrganizationService organizationService;

    @Mock
    private PledgeService pledgeService;

    @Mock
    private UserService userService;

    @Mock
    private NotificationService notificationService;

    private CampaignService campaignService;
    private CampaignMediaService campaignMediaService;

    @BeforeEach
    void setUp() {
        campaignService = new CampaignService(
                campaignRepository,
                discountBracketService,
                organizationService,
                pledgeService,
                userService,
                notificationService,
                campaignMediaService
        );
    }

    private OrganizationEntity createOrganization(UUID id, OrganizationStatus status) {
        OrganizationEntity org = new OrganizationEntity();
        org.setId(id);
        org.setNameEn("Test Supplier");
        org.setNameAr("مورد اختبار");
        org.setSlug("test-supplier");
        org.setIndustry("Technology");
        org.setType(OrganizationType.SUPPLIER);
        org.setStatus(status);
        return org;
    }

    private CampaignCreateRequest createValidCampaignRequest() {
        return new CampaignCreateRequest(
                "Test Campaign",
                "Description",
                "Product details",
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(30),
                100,
                List.of(DiscountBracketRequest.builder()
                        .minQuantity(0)
                        .maxQuantity(10)
                        .unitPrice(new BigDecimal("100.00"))
                        .bracketOrder(0)
                        .build())
        );
    }

    @Test
    @DisplayName("Should block campaign creation when organization status is PENDING")
    void shouldBlockCampaignCreationWhenOrganizationIsPending() {
        // Given
        UUID supplierId = UUID.randomUUID();
        OrganizationEntity pendingOrg = createOrganization(supplierId, OrganizationStatus.PENDING);
        CampaignCreateRequest request = createValidCampaignRequest();

        when(organizationService.findById(supplierId)).thenReturn(pendingOrg);

        // When/Then
        assertThatThrownBy(() -> campaignService.createCampaign(request, supplierId))
                .isInstanceOf(OrganizationPendingVerificationException.class)
                .hasMessage("Your organization is pending verification");
    }

    @Test
    @DisplayName("Should block campaign creation when organization status is INACTIVE")
    void shouldBlockCampaignCreationWhenOrganizationIsInactive() {
        // Given
        UUID supplierId = UUID.randomUUID();
        OrganizationEntity inactiveOrg = createOrganization(supplierId, OrganizationStatus.INACTIVE);
        CampaignCreateRequest request = createValidCampaignRequest();

        when(organizationService.findById(supplierId)).thenReturn(inactiveOrg);

        // When/Then
        assertThatThrownBy(() -> campaignService.createCampaign(request, supplierId))
                .isInstanceOf(OrganizationPendingVerificationException.class)
                .hasMessage("Your organization is pending verification");
    }
}
