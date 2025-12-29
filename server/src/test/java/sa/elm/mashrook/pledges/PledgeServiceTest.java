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
import sa.elm.mashrook.exceptions.InvalidPledgeStateException;
import sa.elm.mashrook.exceptions.PledgeNotFoundException;
import sa.elm.mashrook.organizations.domain.OrganizationEntity;
import sa.elm.mashrook.pledges.domain.PledgeEntity;
import sa.elm.mashrook.pledges.domain.PledgeStatus;
import sa.elm.mashrook.pledges.dto.PledgeCreateRequest;
import sa.elm.mashrook.pledges.dto.PledgeResponse;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
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

    @Nested
    @DisplayName("commitPledge")
    class CommitPledge {

        private PledgeEntity pledge;
        private UUID pledgeId;

        @BeforeEach
        void setUpPledge() {
            pledgeId = UuidGeneratorUtil.generateUuidV7();
            pledge = new PledgeEntity();
            pledge.setId(pledgeId);
            pledge.setCampaign(campaign);
            pledge.setOrganization(buyerOrg);
            pledge.setQuantity(10);
            pledge.setStatus(PledgeStatus.PENDING);
        }

        @Test
        @DisplayName("should commit pledge when campaign is in GRACE_PERIOD and pledge is PENDING")
        void shouldCommitPledgeWhenCampaignInGracePeriodAndPledgeIsPending() {
            campaign.setStatus(CampaignStatus.GRACE_PERIOD);

            when(pledgeRepository.findById(pledgeId)).thenReturn(Optional.of(pledge));
            when(pledgeRepository.save(any(PledgeEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

            PledgeResponse result = pledgeService.commitPledge(pledgeId, buyerOrgId);

            assertThat(result).isNotNull();
            assertThat(result.status()).isEqualTo(PledgeStatus.COMMITTED);
            assertThat(result.committedAt()).isNotNull();
            verify(pledgeRepository).save(any(PledgeEntity.class));
        }

        @Test
        @DisplayName("should set committedAt timestamp when committing pledge")
        void shouldSetCommittedAtTimestampWhenCommitting() {
            campaign.setStatus(CampaignStatus.GRACE_PERIOD);
            LocalDateTime beforeCommit = LocalDateTime.now();

            when(pledgeRepository.findById(pledgeId)).thenReturn(Optional.of(pledge));
            when(pledgeRepository.save(any(PledgeEntity.class))).thenAnswer(invocation -> {
                PledgeEntity savedPledge = invocation.getArgument(0);
                return savedPledge;
            });

            PledgeResponse result = pledgeService.commitPledge(pledgeId, buyerOrgId);

            assertThat(result.committedAt()).isNotNull();
            assertThat(result.committedAt()).isAfterOrEqualTo(beforeCommit);
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateException when campaign is ACTIVE")
        void shouldThrowWhenCampaignIsActive() {
            campaign.setStatus(CampaignStatus.ACTIVE);

            when(pledgeRepository.findById(pledgeId)).thenReturn(Optional.of(pledge));

            assertThatThrownBy(() -> pledgeService.commitPledge(pledgeId, buyerOrgId))
                    .isInstanceOf(InvalidCampaignStateException.class)
                    .hasMessageContaining("GRACE_PERIOD");

            verify(pledgeRepository, never()).save(any(PledgeEntity.class));
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateException when campaign is DRAFT")
        void shouldThrowWhenCampaignIsDraft() {
            campaign.setStatus(CampaignStatus.DRAFT);

            when(pledgeRepository.findById(pledgeId)).thenReturn(Optional.of(pledge));

            assertThatThrownBy(() -> pledgeService.commitPledge(pledgeId, buyerOrgId))
                    .isInstanceOf(InvalidCampaignStateException.class)
                    .hasMessageContaining("GRACE_PERIOD");

            verify(pledgeRepository, never()).save(any(PledgeEntity.class));
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateException when campaign is LOCKED")
        void shouldThrowWhenCampaignIsLocked() {
            campaign.setStatus(CampaignStatus.LOCKED);

            when(pledgeRepository.findById(pledgeId)).thenReturn(Optional.of(pledge));

            assertThatThrownBy(() -> pledgeService.commitPledge(pledgeId, buyerOrgId))
                    .isInstanceOf(InvalidCampaignStateException.class)
                    .hasMessageContaining("GRACE_PERIOD");

            verify(pledgeRepository, never()).save(any(PledgeEntity.class));
        }

        @Test
        @DisplayName("should throw InvalidCampaignStateException when campaign is CANCELLED")
        void shouldThrowWhenCampaignIsCancelled() {
            campaign.setStatus(CampaignStatus.CANCELLED);

            when(pledgeRepository.findById(pledgeId)).thenReturn(Optional.of(pledge));

            assertThatThrownBy(() -> pledgeService.commitPledge(pledgeId, buyerOrgId))
                    .isInstanceOf(InvalidCampaignStateException.class)
                    .hasMessageContaining("GRACE_PERIOD");

            verify(pledgeRepository, never()).save(any(PledgeEntity.class));
        }

        @Test
        @DisplayName("should throw InvalidPledgeStateException when pledge is already COMMITTED")
        void shouldThrowWhenPledgeAlreadyCommitted() {
            campaign.setStatus(CampaignStatus.GRACE_PERIOD);
            pledge.setStatus(PledgeStatus.COMMITTED);

            when(pledgeRepository.findById(pledgeId)).thenReturn(Optional.of(pledge));

            assertThatThrownBy(() -> pledgeService.commitPledge(pledgeId, buyerOrgId))
                    .isInstanceOf(InvalidPledgeStateException.class)
                    .hasMessageContaining("PENDING");

            verify(pledgeRepository, never()).save(any(PledgeEntity.class));
        }

        @Test
        @DisplayName("should throw InvalidPledgeStateException when pledge is WITHDRAWN")
        void shouldThrowWhenPledgeIsWithdrawn() {
            campaign.setStatus(CampaignStatus.GRACE_PERIOD);
            pledge.setStatus(PledgeStatus.WITHDRAWN);

            when(pledgeRepository.findById(pledgeId)).thenReturn(Optional.of(pledge));

            assertThatThrownBy(() -> pledgeService.commitPledge(pledgeId, buyerOrgId))
                    .isInstanceOf(InvalidPledgeStateException.class)
                    .hasMessageContaining("PENDING");

            verify(pledgeRepository, never()).save(any(PledgeEntity.class));
        }

        @Test
        @DisplayName("should throw PledgeNotFoundException when pledge does not exist")
        void shouldThrowWhenPledgeNotFound() {
            UUID nonExistentPledgeId = UuidGeneratorUtil.generateUuidV7();

            when(pledgeRepository.findById(nonExistentPledgeId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> pledgeService.commitPledge(nonExistentPledgeId, buyerOrgId))
                    .isInstanceOf(PledgeNotFoundException.class);

            verify(pledgeRepository, never()).save(any(PledgeEntity.class));
        }

        @Test
        @DisplayName("should throw PledgeAccessDeniedException when buyer does not own the pledge")
        void shouldThrowWhenBuyerDoesNotOwnPledge() {
            campaign.setStatus(CampaignStatus.GRACE_PERIOD);
            UUID differentBuyerOrgId = UuidGeneratorUtil.generateUuidV7();

            when(pledgeRepository.findById(pledgeId)).thenReturn(Optional.of(pledge));

            assertThatThrownBy(() -> pledgeService.commitPledge(pledgeId, differentBuyerOrgId))
                    .isInstanceOf(sa.elm.mashrook.exceptions.PledgeAccessDeniedException.class);

            verify(pledgeRepository, never()).save(any(PledgeEntity.class));
        }
    }

    @Nested
    @DisplayName("withdrawAllPendingPledges")
    class WithdrawAllPendingPledges {

        @Test
        @DisplayName("should withdraw all PENDING pledges for a campaign")
        void shouldWithdrawAllPendingPledges() {
            PledgeEntity pledge1 = new PledgeEntity();
            pledge1.setId(UuidGeneratorUtil.generateUuidV7());
            pledge1.setCampaign(campaign);
            pledge1.setOrganization(buyerOrg);
            pledge1.setQuantity(10);
            pledge1.setStatus(PledgeStatus.PENDING);

            OrganizationEntity anotherBuyerOrg = createOrganization(UuidGeneratorUtil.generateUuidV7());
            PledgeEntity pledge2 = new PledgeEntity();
            pledge2.setId(UuidGeneratorUtil.generateUuidV7());
            pledge2.setCampaign(campaign);
            pledge2.setOrganization(anotherBuyerOrg);
            pledge2.setQuantity(5);
            pledge2.setStatus(PledgeStatus.PENDING);

            when(pledgeRepository.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.PENDING))
                    .thenReturn(java.util.List.of(pledge1, pledge2));
            when(pledgeRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

            pledgeService.withdrawAllPendingPledges(campaignId);

            verify(pledgeRepository).saveAll(any());
        }

        @Test
        @DisplayName("should set status to WITHDRAWN for all pending pledges")
        void shouldSetStatusToWithdrawnForAllPendingPledges() {
            PledgeEntity pledge1 = new PledgeEntity();
            pledge1.setId(UuidGeneratorUtil.generateUuidV7());
            pledge1.setCampaign(campaign);
            pledge1.setOrganization(buyerOrg);
            pledge1.setQuantity(10);
            pledge1.setStatus(PledgeStatus.PENDING);

            when(pledgeRepository.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.PENDING))
                    .thenReturn(java.util.List.of(pledge1));
            when(pledgeRepository.saveAll(any())).thenAnswer(invocation -> {
                @SuppressWarnings("unchecked")
                java.util.List<PledgeEntity> pledges = (java.util.List<PledgeEntity>) invocation.getArgument(0);
                assertThat(pledges).hasSize(1);
                assertThat(pledges.get(0).getStatus()).isEqualTo(PledgeStatus.WITHDRAWN);
                return pledges;
            });

            pledgeService.withdrawAllPendingPledges(campaignId);

            verify(pledgeRepository).saveAll(any());
        }

        @Test
        @DisplayName("should handle empty list of pending pledges gracefully")
        void shouldHandleEmptyListGracefully() {
            when(pledgeRepository.findAllByCampaignIdAndStatus(campaignId, PledgeStatus.PENDING))
                    .thenReturn(java.util.Collections.emptyList());

            pledgeService.withdrawAllPendingPledges(campaignId);

            verify(pledgeRepository).saveAll(java.util.Collections.emptyList());
        }
    }

    @Nested
    @DisplayName("getCampaignPledges")
    class GetCampaignPledges {

        @Test
        @DisplayName("should return empty PledgeListResponse when no pledges exist for campaign")
        void shouldReturnEmptyResponseWhenNoPledgesExist() {
            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
            org.springframework.data.domain.Page<PledgeEntity> emptyPage =
                    new org.springframework.data.domain.PageImpl<>(
                            java.util.Collections.emptyList(),
                            pageable,
                            0
                    );

            when(pledgeRepository.findAllByCampaignId(campaignId, pageable)).thenReturn(emptyPage);

            sa.elm.mashrook.pledges.dto.PledgeListResponse result = pledgeService.getCampaignPledges(campaign, pageable);

            assertThat(result).isNotNull();
            assertThat(result.content()).isEmpty();
            assertThat(result.totalElements()).isZero();
            assertThat(result.totalPages()).isZero();
            assertThat(result.page()).isZero();
            assertThat(result.size()).isEqualTo(10);
        }

        @Test
        @DisplayName("should return pledges when they exist for campaign")
        void shouldReturnPledgesWhenTheyExist() {
            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);

            PledgeEntity pledge = new PledgeEntity();
            pledge.setId(UuidGeneratorUtil.generateUuidV7());
            pledge.setCampaign(campaign);
            pledge.setOrganization(buyerOrg);
            pledge.setQuantity(5);
            pledge.setStatus(PledgeStatus.PENDING);

            org.springframework.data.domain.Page<PledgeEntity> pageWithPledge =
                    new org.springframework.data.domain.PageImpl<>(
                            java.util.List.of(pledge),
                            pageable,
                            1
                    );

            when(pledgeRepository.findAllByCampaignId(campaignId, pageable)).thenReturn(pageWithPledge);

            sa.elm.mashrook.pledges.dto.PledgeListResponse result = pledgeService.getCampaignPledges(campaign, pageable);

            assertThat(result).isNotNull();
            assertThat(result.content()).hasSize(1);
            assertThat(result.content().get(0).quantity()).isEqualTo(5);
            assertThat(result.totalElements()).isEqualTo(1);
        }
    }
}
