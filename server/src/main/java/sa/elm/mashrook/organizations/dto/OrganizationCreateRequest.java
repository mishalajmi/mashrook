package sa.elm.mashrook.organizations.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import lombok.Builder;
import sa.elm.mashrook.auth.dto.RegistrationRequest;
import sa.elm.mashrook.organizations.domain.OrganizationType;

@Builder
public record OrganizationCreateRequest(@NotEmpty(message = "organization english name cannot be empty")
                                        String nameEn,
                                        @NotEmpty(message = "organization arabic name cannot be empty")
                                        String nameAr,
                                        @NotEmpty(message = "organization industry cannot be empty")
                                        String industry,
                                        @NotEmpty(message = "organization type cannot be empty")
                                        OrganizationType type,
                                        @NotEmpty(message = "organization owner first name cannot be empty")
                                        String ownerFirstName,
                                        @NotEmpty(message = "organization owner last name cannot be empty")
                                        String ownerLastName,
                                        @NotEmpty(message = "organization owner email name cannot be empty")
                                        @Email(message = "organization owner email must be valid")
                                        String ownerEmail) {

    public static OrganizationCreateRequest from(RegistrationRequest request) {
        return OrganizationCreateRequest.builder()
                .nameEn(request.organizationNameEn())
                .nameAr(request.organizationNameAr())
                .industry(request.organizationIndustry())
                .type(OrganizationType.getType(request.organizationType()))
                .build();
    }
}
