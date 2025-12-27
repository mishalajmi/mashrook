package sa.elm.mashrook.common.uuid;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;
import sa.elm.mashrook.common.util.UuidGeneratorUtil;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for the UuidGenerator utility class.
 * <p>
 * Tests verify that:
 * - UUID v7 is generated correctly following RFC 9562
 * - Generated UUIDs are unique
 * - Generated UUIDs are time-ordered (sequential inserts for B-tree performance)
 * - UUID version bits indicate version 7
 * - Generated UUIDs are compatible with java.util.UUID
 */
@DisplayName("UuidGenerator Utility Tests")
class UuidGeneratorUtilTest {

    private static final int UUID_VERSION_7 = 7;
    private static final int UUID_VARIANT_RFC_4122 = 2;

    @Nested
    @DisplayName("UUID v7 Generation")
    class UuidV7Generation {

        @Test
        @DisplayName("should generate a valid UUID")
        void shouldGenerateValidUuid() {
            // Act
            UUID uuid = UuidGeneratorUtil.generateUuidV7();

            // Assert
            assertThat(uuid).isNotNull();
        }

        @Test
        @DisplayName("should generate UUID with version 7")
        void shouldGenerateUuidWithVersion7() {
            // Act
            UUID uuid = UuidGeneratorUtil.generateUuidV7();

            // Assert
            assertThat(uuid.version()).isEqualTo(UUID_VERSION_7);
        }

        @Test
        @DisplayName("should generate UUID with RFC 4122 variant")
        void shouldGenerateUuidWithRfc4122Variant() {
            // Act
            UUID uuid = UuidGeneratorUtil.generateUuidV7();

            // Assert
            assertThat(uuid.variant()).isEqualTo(UUID_VARIANT_RFC_4122);
        }

        @RepeatedTest(100)
        @DisplayName("should generate unique UUIDs")
        void shouldGenerateUniqueUuids() {
            // Arrange
            Set<UUID> uuids = new HashSet<>();

            // Act
            for (int i = 0; i < 1000; i++) {
                uuids.add(UuidGeneratorUtil.generateUuidV7());
            }

            // Assert
            assertThat(uuids).hasSize(1000);
        }
    }

    @Nested
    @DisplayName("Time-Ordered UUID Generation")
    class TimeOrderedUuidGeneration {

        @Test
        @DisplayName("should generate time-ordered UUIDs for sequential calls")
        void shouldGenerateTimeOrderedUuids() {
            // Arrange
            List<UUID> uuids = new ArrayList<>();

            // Act - generate UUIDs sequentially
            for (int i = 0; i < 100; i++) {
                uuids.add(UuidGeneratorUtil.generateUuidV7());
            }

            // Assert - UUIDs should be in ascending order when sorted lexicographically
            // UUID v7 embeds timestamp in the most significant bits, so string comparison works
            for (int i = 1; i < uuids.size(); i++) {
                UUID previous = uuids.get(i - 1);
                UUID current = uuids.get(i);

                // The timestamp portion (first 48 bits) should be non-decreasing
                long previousTimestamp = extractTimestamp(previous);
                long currentTimestamp = extractTimestamp(current);

                assertThat(currentTimestamp)
                        .as("UUID at index %d should have timestamp >= previous UUID", i)
                        .isGreaterThanOrEqualTo(previousTimestamp);
            }
        }

        @Test
        @DisplayName("should embed current timestamp in UUID")
        void shouldEmbedCurrentTimestampInUuid() {
            // Arrange
            long beforeMs = System.currentTimeMillis();

            // Act
            UUID uuid = UuidGeneratorUtil.generateUuidV7();

            // Assert
            long afterMs = System.currentTimeMillis();
            long uuidTimestamp = extractTimestamp(uuid);

            assertThat(uuidTimestamp)
                    .isGreaterThanOrEqualTo(beforeMs)
                    .isLessThanOrEqualTo(afterMs);
        }

        /**
         * Extracts the 48-bit Unix timestamp (milliseconds) from a UUID v7.
         * The timestamp is stored in the most significant 48 bits.
         */
        private long extractTimestamp(UUID uuid) {
            // UUID v7 structure: timestamp (48 bits) | version (4 bits) | random_a (12 bits) | variant (2 bits) | random_b (62 bits)
            // Most significant long contains: timestamp (48) | version (4) | random_a (12)
            long msb = uuid.getMostSignificantBits();
            // Shift right by 16 to remove version (4 bits) and random_a (12 bits)
            return msb >>> 16;
        }
    }

    @Nested
    @DisplayName("String Representation")
    class StringRepresentation {

        @Test
        @DisplayName("should generate UUID string in standard format")
        void shouldGenerateUuidStringInStandardFormat() {
            // Act
            String uuidString = UuidGeneratorUtil.generateUuidV7String();

            // Assert - UUID string format: 8-4-4-4-12 (36 characters including hyphens)
            assertThat(uuidString)
                    .matches("^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")
                    .hasSize(36);
        }

        @Test
        @DisplayName("should be parseable back to UUID")
        void shouldBeParseableBackToUuid() {
            // Act
            String uuidString = UuidGeneratorUtil.generateUuidV7String();
            UUID parsed = UUID.fromString(uuidString);

            // Assert
            assertThat(parsed.version()).isEqualTo(UUID_VERSION_7);
            assertThat(parsed.toString()).isEqualTo(uuidString);
        }
    }

    @Nested
    @DisplayName("Database B-tree Compatibility")
    class DatabaseBtreeCompatibility {

        @Test
        @DisplayName("should generate UUIDs that sort correctly for B-tree indexes")
        void shouldGenerateUuidsThatSortCorrectlyForBtreeIndexes() {
            // Arrange - generate UUIDs with a small delay to ensure different timestamps
            List<UUID> generatedOrder = new ArrayList<>();

            for (int i = 0; i < 10; i++) {
                generatedOrder.add(UuidGeneratorUtil.generateUuidV7());
            }

            // Act - sort UUIDs using natural ordering (how database would sort them)
            List<UUID> sortedUuids = new ArrayList<>(generatedOrder);
            sortedUuids.sort(UUID::compareTo);

            // Assert - sorted order should match generation order (time-ordered property)
            // This is the key benefit for B-tree performance - new records append at the end
            assertThat(sortedUuids).isEqualTo(generatedOrder);
        }
    }
}
