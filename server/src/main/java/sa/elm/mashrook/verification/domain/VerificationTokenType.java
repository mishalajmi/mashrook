package sa.elm.mashrook.verification.domain;

import java.time.Duration;

/**
 * Enumeration of verification token types.
 * Each type has a default TTL that can be overridden via configuration.
 */
public enum VerificationTokenType {
    EMAIL_VERIFICATION(Duration.ofHours(24)),
    PASSWORD_RESET(Duration.ofHours(1)),
    ACCOUNT_ACTIVATION(Duration.ofHours(48)),
    EMAIL_CHANGE(Duration.ofHours(24)),
    TWO_FACTOR_SETUP(Duration.ofMinutes(10));

    private final Duration defaultTtl;

    VerificationTokenType(Duration defaultTtl) {
        this.defaultTtl = defaultTtl;
    }

    public Duration getDefaultTtl() {
        return defaultTtl;
    }
}
