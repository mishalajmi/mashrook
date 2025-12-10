package sa.elm.mashrook.users.dto;

import lombok.Builder;
import sa.elm.mashrook.auth.dto.RegistrationRequest;
import sa.elm.mashrook.security.domain.UserRole;

@Builder
public record UserCreateRequest(String firstName,
                                String lastName,
                                String email,
                                String password,
                                UserRole role) {
    public static UserCreateRequest from(RegistrationRequest request, UserRole role) {
        return UserCreateRequest.builder()
                .email(request.email())
                .password(request.password())
                .firstName(request.firstName())
                .lastName(request.lastName())
                .role(role)
                .build();
    }
}
