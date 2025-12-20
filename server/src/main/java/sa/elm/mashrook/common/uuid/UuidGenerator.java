package sa.elm.mashrook.common.uuid;

import com.github.f4b6a3.uuid.UuidCreator;

import java.util.UUID;

/**
 * Centralized UUID v7 generation utility following RFC 9562.
 */
public final class UuidGenerator {

    private UuidGenerator() {
        // Utility class - prevent instantiation
    }

    /**
     * Generates a new UUID v7 (time-ordered).
     *
     * @return a new UUID v7 instance
     */
    public static UUID generateUuidV7() {
        return UuidCreator.getTimeOrderedEpoch();
    }

    /**
     * Generates a new UUID v7 and returns its string representation.
     *
     * @return a new UUID v7 as a lowercase string
     */
    public static String generateUuidV7String() {
        return generateUuidV7().toString();
    }
}
