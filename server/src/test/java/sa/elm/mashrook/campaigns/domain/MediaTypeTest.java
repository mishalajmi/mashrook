package sa.elm.mashrook.campaigns.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import sa.elm.mashrook.common.storage.domain.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("MediaType Tests")
class MediaTypeTest {

    @Nested
    @DisplayName("Type Values")
    class TypeValues {

        @Test
        @DisplayName("should have IMAGE type")
        void shouldHaveImageType() {
            assertThat(MediaType.IMAGE).isNotNull();
            assertThat(MediaType.IMAGE.getValue()).isEqualTo("image");
        }

        @Test
        @DisplayName("should have VIDEO type")
        void shouldHaveVideoType() {
            assertThat(MediaType.VIDEO).isNotNull();
            assertThat(MediaType.VIDEO.getValue()).isEqualTo("video");
        }

        @Test
        @DisplayName("should have exactly 2 type values")
        void shouldHaveExactlyTwoTypeValues() {
            assertThat(MediaType.values()).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Type Lookup")
    class TypeLookup {

        @ParameterizedTest
        @ValueSource(strings = {"image", "IMAGE", "Image"})
        @DisplayName("should find IMAGE type case-insensitively")
        void shouldFindImageTypeCaseInsensitively(String value) {
            assertThat(MediaType.getType(value)).isEqualTo(MediaType.IMAGE);
        }

        @ParameterizedTest
        @ValueSource(strings = {"video", "VIDEO", "Video"})
        @DisplayName("should find VIDEO type case-insensitively")
        void shouldFindVideoTypeCaseInsensitively(String value) {
            assertThat(MediaType.getType(value)).isEqualTo(MediaType.VIDEO);
        }

        @Test
        @DisplayName("should throw exception for invalid type value")
        void shouldThrowExceptionForInvalidTypeValue() {
            assertThatThrownBy(() -> MediaType.getType("invalid"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("invalid")
                    .hasMessageContaining("is not a valid media type");
        }
    }

    @Nested
    @DisplayName("Enum Iteration")
    class EnumIteration {

        @ParameterizedTest
        @EnumSource(MediaType.class)
        @DisplayName("each type should have a non-null value")
        void eachTypeShouldHaveNonNullValue(MediaType type) {
            assertThat(type.getValue()).isNotNull();
            assertThat(type.getValue()).isNotBlank();
        }
    }
}
