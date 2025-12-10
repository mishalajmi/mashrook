package sa.elm.mashrook.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RegistrationRequest(@NotBlank(message = "Organization name english must not be blank")
                                  String organizationNameEn,
                                  @NotBlank(message = "Organization name arabic must not be blank")
                                  String organizationNameAr,
                                  @NotBlank(message = "Organization type must not be blank")
                                  String organizationType,
                                  @NotBlank(message = "Organization industry must not be blank")
                                  String organizationIndustry,
                                  @NotBlank(message = "Owner first name must not be blank")
                                  String firstName,
                                  @NotBlank(message = "Owner last name must not be blank")
                                  String lastName,
                                  @NotBlank(message = "Email must not be blank")
                                  @Email(message = "must be a valid email")
                                  String email,
                                  @NotBlank(message = "Password must not be blank")
                                  @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#$%^&+=]).{6,}",
                                  message = "password must be at least 8 characters and include lowercase, uppercase, digit and special character")
                                  String password) {
}
