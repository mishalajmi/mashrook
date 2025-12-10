package sa.elm.mashrook.configurations;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "mashrook.auth")
public record AuthenticationConfigurationProperties(
        JwtConfigurationProperties jwt,
        CookieConfigurationProperties cookie,
        VerificationConfigurationProperties verification
) {

    public record JwtConfigurationProperties(
            String secret,
            String issuer,
            @DefaultValue("900000") Long accessTokenExpirationMs,
            @DefaultValue("604800000") Long refreshTokenExpirationMs
    ) {}

    public record CookieConfigurationProperties(
            @DefaultValue("true") boolean secure,
            @DefaultValue("Lax") String sameSite,
            @DefaultValue("/api/v1/auth/refresh") String path,
            @DefaultValue("refresh_token") String name
    ) {}

    /**
     * Configuration for verification token TTLs (in milliseconds).
     */
    public record VerificationConfigurationProperties(
            @DefaultValue("86400000") Long emailVerificationTtlMs,  // 24 hours
            @DefaultValue("3600000") Long passwordResetTtlMs,       // 1 hour
            @DefaultValue("172800000") Long accountActivationTtlMs, // 48 hours
            @DefaultValue("${FRONTEND_BASE_URL:http://localhost:5173}") String frontendBaseUrl
    ) {}
}
