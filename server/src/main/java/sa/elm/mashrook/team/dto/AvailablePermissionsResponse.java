package sa.elm.mashrook.team.dto;

import lombok.Builder;

import java.util.List;
import java.util.Map;

@Builder
public record AvailablePermissionsResponse(
        String organizationType,
        Map<String, List<String>> permissions
) {}
