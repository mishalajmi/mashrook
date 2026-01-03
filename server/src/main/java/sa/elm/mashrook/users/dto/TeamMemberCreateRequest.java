package sa.elm.mashrook.users.dto;

import lombok.Builder;

import java.util.List;
import java.util.UUID;

@Builder
public record TeamMemberCreateRequest(
        String firstName,
        String lastName,
        String email,
        String password,
        List<String> permissions,
        UUID grantedBy
) {}
