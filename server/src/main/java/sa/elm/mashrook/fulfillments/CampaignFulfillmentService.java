package sa.elm.mashrook.fulfillments;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import sa.elm.mashrook.fulfillments.domain.CampaignFulfillmentEntity;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CampaignFulfillmentService {
    private final CampaignFulfillmentRepository campaignFulfillmentRepository;

    public List<CampaignFulfillmentEntity> findAllByCampaignId(UUID campaignId) {
        return campaignFulfillmentRepository.findAllByCampaignId(campaignId);
    }
}
