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
}
