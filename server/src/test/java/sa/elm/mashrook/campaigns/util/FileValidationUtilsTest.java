package sa.elm.mashrook.campaigns.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.web.multipart.MultipartFile;
import sa.elm.mashrook.common.storage.domain.MediaType;
import sa.elm.mashrook.common.util.FileValidationUtils;
import sa.elm.mashrook.exceptions.FileSizeExceededException;
import sa.elm.mashrook.exceptions.InvalidMediaTypeException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("FileValidationUtils Tests")
class FileValidationUtilsTest {

    private static final long MAX_IMAGE_SIZE = 50 * 1024 * 1024L;
    private static final long MAX_VIDEO_SIZE = 500 * 1024 * 1024L;

    @Nested
    @DisplayName("validateFile")
    class ValidateFileTests {

        @Test
        @DisplayName("should accept valid JPEG image")
        void shouldAcceptValidJpegImage() {
            MultipartFile file = mock(MultipartFile.class);
            when(file.getContentType()).thenReturn("image/jpeg");
            when(file.getOriginalFilename()).thenReturn("test.jpg");
            when(file.getSize()).thenReturn(1024L);

            assertThatCode(() -> FileValidationUtils.validateFile(file))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("should accept valid PNG image")
        void shouldAcceptValidPngImage() {
            MultipartFile file = mock(MultipartFile.class);
            when(file.getContentType()).thenReturn("image/png");
            when(file.getOriginalFilename()).thenReturn("test.png");
            when(file.getSize()).thenReturn(1024L);

            assertThatCode(() -> FileValidationUtils.validateFile(file))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("should accept valid MP4 video")
        void shouldAcceptValidMp4Video() {
            MultipartFile file = mock(MultipartFile.class);
            when(file.getContentType()).thenReturn("video/mp4");
            when(file.getOriginalFilename()).thenReturn("video.mp4");
            when(file.getSize()).thenReturn(10_000_000L);

            assertThatCode(() -> FileValidationUtils.validateFile(file))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("should reject unsupported content type")
        void shouldRejectUnsupportedContentType() {
            MultipartFile file = mock(MultipartFile.class);
            when(file.getContentType()).thenReturn("application/pdf");

            assertThatThrownBy(() -> FileValidationUtils.validateFile(file))
                    .isInstanceOf(InvalidMediaTypeException.class)
                    .hasMessageContaining("Unsupported content type");
        }

        @Test
        @DisplayName("should reject mismatched extension and content type")
        void shouldRejectMismatchedExtension() {
            MultipartFile file = mock(MultipartFile.class);
            when(file.getContentType()).thenReturn("image/jpeg");
            when(file.getOriginalFilename()).thenReturn("test.png");
            when(file.getSize()).thenReturn(1024L);

            assertThatThrownBy(() -> FileValidationUtils.validateFile(file))
                    .isInstanceOf(InvalidMediaTypeException.class)
                    .hasMessageContaining("does not match content type");
        }

        @Test
        @DisplayName("should reject image exceeding 50MB")
        void shouldRejectOversizedImage() {
            MultipartFile file = mock(MultipartFile.class);
            when(file.getContentType()).thenReturn("image/jpeg");
            when(file.getOriginalFilename()).thenReturn("large.jpg");
            when(file.getSize()).thenReturn(MAX_IMAGE_SIZE + 1);

            assertThatThrownBy(() -> FileValidationUtils.validateFile(file))
                    .isInstanceOf(FileSizeExceededException.class)
                    .hasMessageContaining("exceeds maximum allowed size");
        }

        @Test
        @DisplayName("should reject video exceeding 500MB")
        void shouldRejectOversizedVideo() {
            MultipartFile file = mock(MultipartFile.class);
            when(file.getContentType()).thenReturn("video/mp4");
            when(file.getOriginalFilename()).thenReturn("large.mp4");
            when(file.getSize()).thenReturn(MAX_VIDEO_SIZE + 1);

            assertThatThrownBy(() -> FileValidationUtils.validateFile(file))
                    .isInstanceOf(FileSizeExceededException.class)
                    .hasMessageContaining("exceeds maximum allowed size");
        }

        @Test
        @DisplayName("should reject filename without extension")
        void shouldRejectFilenameWithoutExtension() {
            MultipartFile file = mock(MultipartFile.class);
            when(file.getContentType()).thenReturn("image/jpeg");
            when(file.getOriginalFilename()).thenReturn("testfile");
            when(file.getSize()).thenReturn(1024L);

            assertThatThrownBy(() -> FileValidationUtils.validateFile(file))
                    .isInstanceOf(InvalidMediaTypeException.class)
                    .hasMessageContaining("must have an extension");
        }
    }

    @Nested
    @DisplayName("determineMediaType")
    class DetermineMediaTypeTests {

        @Test
        @DisplayName("should return IMAGE for JPEG content type")
        void shouldReturnImageForJpeg() {
            MediaType result = FileValidationUtils.determineMediaType("image/jpeg");
            assertThat(result).isEqualTo(MediaType.IMAGE);
        }

        @Test
        @DisplayName("should return IMAGE for PNG content type")
        void shouldReturnImageForPng() {
            MediaType result = FileValidationUtils.determineMediaType("image/png");
            assertThat(result).isEqualTo(MediaType.IMAGE);
        }

        @Test
        @DisplayName("should return VIDEO for MP4 content type")
        void shouldReturnVideoForMp4() {
            MediaType result = FileValidationUtils.determineMediaType("video/mp4");
            assertThat(result).isEqualTo(MediaType.VIDEO);
        }
    }
}
