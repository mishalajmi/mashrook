package sa.elm.mashrook.scheduling.jobs;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import sa.elm.mashrook.campaigns.domain.CampaignEntity;
import sa.elm.mashrook.campaigns.domain.CampaignRepository;
import sa.elm.mashrook.campaigns.domain.CampaignStatus;
import sa.elm.mashrook.campaigns.service.CampaignLifecycleService;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;
import sa.elm.mashrook.exceptions.InvalidCampaignStateTransitionException;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("CampaignEvaluationJob Tests")
class CampaignEvaluationJobTest {

    @Mock
    private CampaignRepository campaignRepository;

    @Mock
    private CampaignLifecycleService campaignLifecycleService;

    private CampaignEvaluationJob campaignEvaluationJob;

    @BeforeEach
    void setUp() {
        campaignEvaluationJob = new CampaignEvaluationJob(
                campaignRepository,
                campaignLifecycleService
        );
    }

    private CampaignEntity createCampaign(UUID id, CampaignStatus status, LocalDate gracePeriodEndDate) {
        CampaignEntity campaign = new CampaignEntity();
        campaign.setId(id);
        campaign.setSupplierId(UuidGeneratorUtil.generateUuidV7());
        campaign.setTitle("Test Campaign");
        campaign.setDescription("Test Description");
        campaign.setDurationDays(30);
        campaign.setStartDate(gracePeriodEndDate.minusDays(33));
        campaign.setEndDate(gracePeriodEndDate.minusDays(3));
        campaign.setGracePeriodEndDate(gracePeriodEndDate);
        campaign.setTargetQty(100);
        campaign.setStatus(status);
        return campaign;
    }

    @Nested
    @DisplayName("evaluateCampaigns")
    class EvaluateCampaigns {

        @Test
        @DisplayName("should find GRACE_PERIOD campaigns where grace period has ended and call evaluateCampaign for each")
        void shouldEvaluateCampaignsWhereGracePeriodEnded() {
            UUID campaignId1 = UuidGeneratorUtil.generateUuidV7();
            UUID campaignId2 = UuidGeneratorUtil.generateUuidV7();

            LocalDate today = LocalDate.now();
            // Campaigns with gracePeriodEndDate before today
            CampaignEntity campaign1 = createCampaign(campaignId1, CampaignStatus.GRACE_PERIOD, today.minusDays(1));
            CampaignEntity campaign2 = createCampaign(campaignId2, CampaignStatus.GRACE_PERIOD, today.minusDays(2));

            when(campaignRepository.findAllByStatusAndGracePeriodEndDateBefore(CampaignStatus.GRACE_PERIOD, today))
                    .thenReturn(List.of(campaign1, campaign2));
            when(campaignLifecycleService.evaluateCampaign(campaignId1)).thenReturn(campaign1);
            when(campaignLifecycleService.evaluateCampaign(campaignId2)).thenReturn(campaign2);

            campaignEvaluationJob.evaluateCampaigns();

            verify(campaignLifecycleService).evaluateCampaign(campaignId1);
            verify(campaignLifecycleService).evaluateCampaign(campaignId2);
        }

        @Test
        @DisplayName("should not call evaluateCampaign when no campaigns have ended grace period")
        void shouldNotEvaluateWhenNoGracePeriodEnded() {
            LocalDate today = LocalDate.now();
            when(campaignRepository.findAllByStatusAndGracePeriodEndDateBefore(CampaignStatus.GRACE_PERIOD, today))
                    .thenReturn(Collections.emptyList());

            campaignEvaluationJob.evaluateCampaigns();

            verify(campaignLifecycleService, never()).evaluateCampaign(any());
        }

        @Test
        @DisplayName("should continue processing remaining campaigns when one fails")
        void shouldContinueProcessingWhenOneFails() {
            UUID campaignId1 = UuidGeneratorUtil.generateUuidV7();
            UUID campaignId2 = UuidGeneratorUtil.generateUuidV7();
            UUID campaignId3 = UuidGeneratorUtil.generateUuidV7();

            LocalDate today = LocalDate.now();
            CampaignEntity campaign1 = createCampaign(campaignId1, CampaignStatus.GRACE_PERIOD, today.minusDays(1));
            CampaignEntity campaign2 = createCampaign(campaignId2, CampaignStatus.GRACE_PERIOD, today.minusDays(2));
            CampaignEntity campaign3 = createCampaign(campaignId3, CampaignStatus.GRACE_PERIOD, today.minusDays(3));

            when(campaignRepository.findAllByStatusAndGracePeriodEndDateBefore(CampaignStatus.GRACE_PERIOD, today))
                    .thenReturn(List.of(campaign1, campaign2, campaign3));
            when(campaignLifecycleService.evaluateCampaign(campaignId1)).thenReturn(campaign1);
            when(campaignLifecycleService.evaluateCampaign(campaignId2))
                    .thenThrow(new InvalidCampaignStateTransitionException("Error"));
            when(campaignLifecycleService.evaluateCampaign(campaignId3)).thenReturn(campaign3);

            campaignEvaluationJob.evaluateCampaigns();

            verify(campaignLifecycleService).evaluateCampaign(campaignId1);
            verify(campaignLifecycleService).evaluateCampaign(campaignId2);
            verify(campaignLifecycleService).evaluateCampaign(campaignId3);
        }
    }
}
