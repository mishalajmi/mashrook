package sa.elm.mashrook.campaigns.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CampaignRepository extends JpaRepository<CampaignEntity, UUID> {
    Optional<CampaignEntity> findCampaignEntityById(UUID id);
    List<CampaignEntity> findAllBySupplierId(UUID supplierId);
    List<CampaignEntity> findAllByStatus(CampaignStatus status);
    List<CampaignEntity> findAllBySupplierIdAndStatus(UUID supplierId, CampaignStatus status);
    List<CampaignEntity> findAllByStartDateGreaterThanEqual(LocalDate startDate);
    List<CampaignEntity> findAllByEndDateLessThanEqual(LocalDate endDate);
    List<CampaignEntity> findAllByStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            CampaignStatus status, LocalDate startDate, LocalDate endDate);

    List<CampaignEntity> findAllByStatusAndEndDateBefore(CampaignStatus status, LocalDate endDate);

    /**
     * Finds campaigns with the given status where endDate is on or before the specified date.
     * Used to find campaigns entering their grace period (48 hours before end date).
     */
    List<CampaignEntity> findAllByStatusAndEndDateLessThanEqual(CampaignStatus status, LocalDate endDate);

    /**
     * Alias for findAllByStatusAndEndDateLessThanEqual with clearer naming.
     */
    default List<CampaignEntity> findAllByStatusAndEndDateOnOrBefore(CampaignStatus status, LocalDate endDate) {
        return findAllByStatusAndEndDateLessThanEqual(status, endDate);
    }

    List<CampaignEntity> findAllByStatusAndGracePeriodEndDateBefore(CampaignStatus status, LocalDate date);
}
