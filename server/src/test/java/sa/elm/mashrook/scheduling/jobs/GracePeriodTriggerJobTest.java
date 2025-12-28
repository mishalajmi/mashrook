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

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("GracePeriodTriggerJob Tests")
class GracePeriodTriggerJobTest {

    @Mock
    private CampaignRepository campaignRepository;

    @Mock
    private CampaignLifecycleService campaignLifecycleService;

    private GracePeriodTriggerJob gracePeriodTriggerJob;

    @BeforeEach
    void setUp() {
        gracePeriodTriggerJob = new GracePeriodTriggerJob(campaignRepository, campaignLifecycleService);
    }

    private CampaignEntity createCampaign(UUID id, CampaignStatus status, LocalDate endDate) {
        CampaignEntity campaign = new CampaignEntity();
        campaign.setId(id);
        campaign.setSupplierId(UuidGeneratorUtil.generateUuidV7());
        campaign.setTitle("Test Campaign");
        campaign.setDescription("Test Description");
        campaign.setDurationDays(30);
        campaign.setStartDate(endDate.minusDays(30));
        campaign.setEndDate(endDate);
        campaign.setTargetQty(100);
        campaign.setStatus(status);
        return campaign;
    }

    @Nested
    @DisplayName("triggerGracePeriods")
    class TriggerGracePeriods {

        @Test
        @DisplayName("should find ACTIVE campaigns where endDate has passed and call startGracePeriod for each")
        void shouldTriggerGracePeriodForActiveCampaignsWithPassedEndDate() {
            UUID campaignId1 = UuidGeneratorUtil.generateUuidV7();
            UUID campaignId2 = UuidGeneratorUtil.generateUuidV7();

            CampaignEntity campaign1 = createCampaign(campaignId1, CampaignStatus.ACTIVE, LocalDate.now().minusDays(1));
            CampaignEntity campaign2 = createCampaign(campaignId2, CampaignStatus.ACTIVE, LocalDate.now().minusDays(2));

            when(campaignRepository.findAllByStatusAndEndDateBefore(CampaignStatus.ACTIVE, LocalDate.now()))
                    .thenReturn(List.of(campaign1, campaign2));
            when(campaignLifecycleService.startGracePeriod(campaignId1)).thenReturn(campaign1);
            when(campaignLifecycleService.startGracePeriod(campaignId2)).thenReturn(campaign2);

            gracePeriodTriggerJob.triggerGracePeriods();

            verify(campaignLifecycleService).startGracePeriod(campaignId1);
            verify(campaignLifecycleService).startGracePeriod(campaignId2);
        }

        @Test
        @DisplayName("should not call startGracePeriod when no campaigns have passed end date")
        void shouldNotTriggerWhenNoCampaignsHavePassedEndDate() {
            when(campaignRepository.findAllByStatusAndEndDateBefore(CampaignStatus.ACTIVE, LocalDate.now()))
                    .thenReturn(Collections.emptyList());

            gracePeriodTriggerJob.triggerGracePeriods();

            verify(campaignLifecycleService, never()).startGracePeriod(org.mockito.ArgumentMatchers.any());
        }

        @Test
        @DisplayName("should continue processing remaining campaigns when one fails")
        void shouldContinueProcessingWhenOneFails() {
            UUID campaignId1 = UuidGeneratorUtil.generateUuidV7();
            UUID campaignId2 = UuidGeneratorUtil.generateUuidV7();
            UUID campaignId3 = UuidGeneratorUtil.generateUuidV7();

            CampaignEntity campaign1 = createCampaign(campaignId1, CampaignStatus.ACTIVE, LocalDate.now().minusDays(1));
            CampaignEntity campaign2 = createCampaign(campaignId2, CampaignStatus.ACTIVE, LocalDate.now().minusDays(2));
            CampaignEntity campaign3 = createCampaign(campaignId3, CampaignStatus.ACTIVE, LocalDate.now().minusDays(3));

            when(campaignRepository.findAllByStatusAndEndDateBefore(CampaignStatus.ACTIVE, LocalDate.now()))
                    .thenReturn(List.of(campaign1, campaign2, campaign3));
            when(campaignLifecycleService.startGracePeriod(campaignId1)).thenReturn(campaign1);
            when(campaignLifecycleService.startGracePeriod(campaignId2))
                    .thenThrow(new InvalidCampaignStateTransitionException("Error"));
            when(campaignLifecycleService.startGracePeriod(campaignId3)).thenReturn(campaign3);

            gracePeriodTriggerJob.triggerGracePeriods();

            verify(campaignLifecycleService).startGracePeriod(campaignId1);
            verify(campaignLifecycleService).startGracePeriod(campaignId2);
            verify(campaignLifecycleService).startGracePeriod(campaignId3);
        }

        @Test
        @DisplayName("should only query for ACTIVE status campaigns")
        void shouldOnlyQueryForActiveCampaigns() {
            when(campaignRepository.findAllByStatusAndEndDateBefore(CampaignStatus.ACTIVE, LocalDate.now()))
                    .thenReturn(Collections.emptyList());

            gracePeriodTriggerJob.triggerGracePeriods();

            verify(campaignRepository).findAllByStatusAndEndDateBefore(CampaignStatus.ACTIVE, LocalDate.now());
        }
    }
}
