package sa.elm.mashrook.pledges;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.exceptions.OrganizationPendingVerificationException;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.organizations.domain.OrganizationStatus;
import sa.elm.mashrook.organizations.domain.OrganizationType;
import sa.elm.mashrook.pledges.dto.PledgeCreateRequest;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Tests for PledgeService verification gates.
 * Ensures PENDING organizations cannot create pledges.
 */
@ExtendWith(MockitoExtension.class)
class PledgeServiceVerificationGateTest {

    @Mock
    private PledgeRepository pledgeRepository;

    private PledgeService pledgeService;

    @BeforeEach
    void setUp() {
        pledgeService = new PledgeService(pledgeRepository);
    }

    private OrganizationEntity createOrganization(UUID id, OrganizationStatus status) {
        OrganizationEntity org = new OrganizationEntity();
        org.setId(id);
        org.setNameEn("Test Buyer");
        org.setNameAr("مشتري اختبار");
        org.setSlug("test-buyer");
        org.setIndustry("Retail");
        org.setType(OrganizationType.BUYER);
        org.setStatus(status);
        return org;
    }

    private CampaignEntity createActiveCampaign() {
        CampaignEntity campaign = new CampaignEntity();
        campaign.setId(UUID.randomUUID());
        campaign.setSupplierId(UUID.randomUUID());
        campaign.setTitle("Test Campaign");
        campaign.setStatus(CampaignStatus.ACTIVE);
        campaign.setStartDate(LocalDate.now());
        campaign.setEndDate(LocalDate.now().plusDays(30));
        return campaign;
    }

    @Test
    @DisplayName("Should block pledge creation when buyer organization status is PENDING")
    void shouldBlockPledgeCreationWhenBuyerOrganizationIsPending() {
        // Given
        UUID buyerOrgId = UUID.randomUUID();
        OrganizationEntity pendingBuyer = createOrganization(buyerOrgId, OrganizationStatus.PENDING);
        CampaignEntity campaign = createActiveCampaign();
        PledgeCreateRequest request = new PledgeCreateRequest(10);

        // When/Then
        assertThatThrownBy(() -> pledgeService.createPledge(campaign, pendingBuyer, request))
                .isInstanceOf(OrganizationPendingVerificationException.class)
                .hasMessage("Your organization is pending verification");
    }

    @Test
    @DisplayName("Should block pledge creation when buyer organization status is INACTIVE")
    void shouldBlockPledgeCreationWhenBuyerOrganizationIsInactive() {
        // Given
        UUID buyerOrgId = UUID.randomUUID();
        OrganizationEntity inactiveBuyer = createOrganization(buyerOrgId, OrganizationStatus.INACTIVE);
        CampaignEntity campaign = createActiveCampaign();
        PledgeCreateRequest request = new PledgeCreateRequest(10);

        // When/Then
        assertThatThrownBy(() -> pledgeService.createPledge(campaign, inactiveBuyer, request))
                .isInstanceOf(OrganizationPendingVerificationException.class)
                .hasMessage("Your organization is pending verification");
    }
}
