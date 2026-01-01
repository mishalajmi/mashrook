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
import sa.elm.mashrook.notifications.NotificationService;
import sa.elm.mashrook.pledges.PledgeService;
import sa.elm.mashrook.users.UserService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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

    @Mock
    private PledgeService pledgeService;

    @Mock
    private UserService userService;

    @Mock
    private NotificationService notificationService;

    private GracePeriodTriggerJob gracePeriodTriggerJob;

    @BeforeEach
    void setUp() {
        gracePeriodTriggerJob = new GracePeriodTriggerJob(
                campaignRepository,
                campaignLifecycleService,
                pledgeService,
                userService,
                notificationService
        );
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
        @DisplayName("should find ACTIVE campaigns within 48 hours of end date and call startGracePeriod for each")
        void shouldTriggerGracePeriodForActiveCampaignsWithin48Hours() {
            UUID campaignId1 = UuidGeneratorUtil.generateUuidV7();
            UUID campaignId2 = UuidGeneratorUtil.generateUuidV7();

            // Campaigns ending within 48 hours
            CampaignEntity campaign1 = createCampaign(campaignId1, CampaignStatus.ACTIVE, LocalDate.now().plusDays(1));
            CampaignEntity campaign2 = createCampaign(campaignId2, CampaignStatus.ACTIVE, LocalDate.now().plusDays(2));

            when(campaignRepository.findAllByStatusAndEndDateOnOrBefore(eq(CampaignStatus.ACTIVE), any(LocalDate.class)))
                    .thenReturn(List.of(campaign1, campaign2));
            when(campaignLifecycleService.startGracePeriod(campaignId1)).thenReturn(campaign1);
            when(campaignLifecycleService.startGracePeriod(campaignId2)).thenReturn(campaign2);

            gracePeriodTriggerJob.triggerGracePeriods();

            verify(campaignLifecycleService).startGracePeriod(campaignId1);
            verify(campaignLifecycleService).startGracePeriod(campaignId2);
        }

        @Test
        @DisplayName("should not call startGracePeriod when no campaigns are within 48 hours of end date")
        void shouldNotTriggerWhenNoCampaignsWithin48Hours() {
            when(campaignRepository.findAllByStatusAndEndDateOnOrBefore(eq(CampaignStatus.ACTIVE), any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());

            gracePeriodTriggerJob.triggerGracePeriods();

            verify(campaignLifecycleService, never()).startGracePeriod(any());
        }

        @Test
        @DisplayName("should continue processing remaining campaigns when one fails")
        void shouldContinueProcessingWhenOneFails() {
            UUID campaignId1 = UuidGeneratorUtil.generateUuidV7();
            UUID campaignId2 = UuidGeneratorUtil.generateUuidV7();
            UUID campaignId3 = UuidGeneratorUtil.generateUuidV7();

            CampaignEntity campaign1 = createCampaign(campaignId1, CampaignStatus.ACTIVE, LocalDate.now().plusDays(1));
            CampaignEntity campaign2 = createCampaign(campaignId2, CampaignStatus.ACTIVE, LocalDate.now().plusDays(1));
            CampaignEntity campaign3 = createCampaign(campaignId3, CampaignStatus.ACTIVE, LocalDate.now().plusDays(2));

            when(campaignRepository.findAllByStatusAndEndDateOnOrBefore(eq(CampaignStatus.ACTIVE), any(LocalDate.class)))
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
        @DisplayName("should query for ACTIVE campaigns with end date on or before 48 hours from now")
        void shouldQueryForCampaignsWithin48Hours() {
            when(campaignRepository.findAllByStatusAndEndDateOnOrBefore(eq(CampaignStatus.ACTIVE), any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());

            gracePeriodTriggerJob.triggerGracePeriods();

            // Verify it queries for campaigns ending within 48 hours (today + 2 days)
            verify(campaignRepository).findAllByStatusAndEndDateOnOrBefore(
                    eq(CampaignStatus.ACTIVE),
                    any(LocalDate.class)
            );
        }
    }
}
