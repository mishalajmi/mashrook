package sa.elm.mashrook.orders.dto;

import java.util.List;
import java.util.UUID;

public record BulkStatusUpdateResponse(
        int successCount,
        int failureCount,
        List<UUID> successIds,
        List<FailedUpdate> failures
) {

    public record FailedUpdate(UUID orderId, String reason) {}

    public static BulkStatusUpdateResponse of(List<UUID> successIds, List<FailedUpdate> failures) {
        return new BulkStatusUpdateResponse(
                successIds.size(),
                failures.size(),
                successIds,
                failures
        );
    }
}
