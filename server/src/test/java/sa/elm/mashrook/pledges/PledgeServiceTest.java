package sa.elm.mashrook.pledges;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.exceptions.InvalidCampaignStateException;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.pledges.domain.PledgeStatus;
import sa.elm.mashrook.pledges.dto.PledgeCreateRequest;
import sa.elm.mashrook.pledges.dto.PledgeResponse;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PledgeService Tests")
class PledgeServiceTest {

    @Mock
    private PledgeRepository pledgeRepository;

    private PledgeService pledgeService;

    private UUID campaignId;
    private UUID buyerOrgId;
    private CampaignEntity campaign;
    private OrganizationEntity buyerOrg;

    @BeforeEach
    void setUp() {
        pledgeService = new PledgeService(pledgeRepository);
        campaignId = UuidGeneratorUtil.generateUuidV7();
        buyerOrgId = UuidGeneratorUtil.generateUuidV7();
        campaign = createCampaign(campaignId, CampaignStatus.ACTIVE);
        buyerOrg = createOrganization(buyerOrgId);
    }

    private CampaignEntity createCampaign(UUID id, CampaignStatus status) {
        CampaignEntity c = new CampaignEntity();
        c.setId(id);
        c.setSupplierId(UuidGeneratorUtil.generateUuidV7());
        c.setTitle("Test Campaign");
        c.setDescription("Test Description");
        c.setDurationDays(30);
        c.setStartDate(LocalDate.now());
        c.setEndDate(LocalDate.now().plusDays(30));
        c.setTargetQty(100);
        c.setStatus(status);
        return c;
    }

    private OrganizationEntity createOrganization(UUID id) {
        OrganizationEntity org = new OrganizationEntity();
        org.setId(id);
        org.setNameEn("Test Org");
        org.setNameAr("Test Org AR");
        return org;
    }

    @Nested
    @DisplayName("createPledge")
    class CreatePledge {

        @Test
        @DisplayName("should allow pledge creation when campaign is ACTIVE")
        void shouldAllowPledgeWhenCampaignActive() {
            campaign.setStatus(CampaignStatus.ACTIVE);
            PledgeCreateRequest request = new PledgeCreateRequest(10);

            when(pledgeRepository.existsByCampaignIdAndOrganizationId(campaignId, buyerOrgId))
                    .thenReturn(false);
            when(pledgeRepository.save(any(PledgeEntity.class))).thenAnswer(invocation -> {
                PledgeEntity pledge = invocation.getArgument(0);
                pledge.setId(UuidGeneratorUtil.generateUuidV7());
                return pledge;
            });

            PledgeResponse result = pledgeService.createPledge(campaign, buyerOrg, request);

            assertThat(result).isNotNull();
            assertThat(result.quantity()).isEqualTo(10);
            assertThat(result.status()).isEqualTo(PledgeStatus.PENDING);
        }

        @Test
        @DisplayName("should allow pledge creation when campaign is in GRACE_PERIOD")
        void shouldAllowPledgeWhenCampaignInGracePeriod() {
            campaign.setStatus(CampaignStatus.GRACE_PERIOD);
            PledgeCreateRequest request = new PledgeCreateRequest(15);

            when(pledgeRepository.existsByCampaignIdAndOrganizationId(campaignId, buyerOrgId))
                    .thenReturn(false);
            when(pledgeRepository.save(any(PledgeEntity.class))).thenAnswer(invocation -> {
                PledgeEntity pledge = invocation.getArgument(0);
                pledge.setId(UuidGeneratorUtil.generateUuidV7());
                return pledge;
            });

            PledgeResponse result = pledgeService.createPledge(campaign, buyerOrg, request);

            assertThat(result).isNotNull();
            assertThat(result.quantity()).isEqualTo(15);
            assertThat(result.status()).isEqualTo(PledgeStatus.PENDING);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateException when campaign is DRAFT")
        void shouldThrowWhenCampaignDraft() {
            campaign.setStatus(CampaignStatus.DRAFT);
            PledgeCreateRequest request = new PledgeCreateRequest(10);

            assertThatThrownBy(() -> pledgeService.createPledge(campaign, buyerOrg, request))
                    .isInstanceOf(InvalidCampaignStateException.class);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateException when campaign is LOCKED")
        void shouldThrowWhenCampaignLocked() {
            campaign.setStatus(CampaignStatus.LOCKED);
            PledgeCreateRequest request = new PledgeCreateRequest(10);

            assertThatThrownBy(() -> pledgeService.createPledge(campaign, buyerOrg, request))
                    .isInstanceOf(InvalidCampaignStateException.class);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateException when campaign is CANCELLED")
        void shouldThrowWhenCampaignCancelled() {
            campaign.setStatus(CampaignStatus.CANCELLED);
            PledgeCreateRequest request = new PledgeCreateRequest(10);

            assertThatThrownBy(() -> pledgeService.createPledge(campaign, buyerOrg, request))
                    .isInstanceOf(InvalidCampaignStateException.class);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateException when campaign is DONE")
        void shouldThrowWhenCampaignDone() {
            campaign.setStatus(CampaignStatus.DONE);
            PledgeCreateRequest request = new PledgeCreateRequest(10);

            assertThatThrownBy(() -> pledgeService.createPledge(campaign, buyerOrg, request))
                    .isInstanceOf(InvalidCampaignStateException.class);
        }
    }
}
