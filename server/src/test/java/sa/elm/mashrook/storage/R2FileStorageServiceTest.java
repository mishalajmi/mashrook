package sa.elm.mashrook.storage;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import sa.elm.mashrook.common.storage.R2FileStorageService;
import sa.elm.mashrook.configurations.R2StorageProperties;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;
import java.time.Duration;
import java.time.YearMonth;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("R2FileStorageService Tests")
class R2FileStorageServiceTest {

    @Mock
    private S3Client s3Client;

    @Mock
    private S3Presigner s3Presigner;

    @Mock
    private R2StorageProperties properties;

    private R2FileStorageService fileStorageService;

    private static final String BUCKET_NAME = "test-bucket";
    private static final UUID ORG_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID CAMPAIGN_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @BeforeEach
    void setUp() {
        when(properties.bucketName()).thenReturn(BUCKET_NAME);
        when(properties.presignedUrlExpirySeconds()).thenReturn(3600L);
        fileStorageService = new R2FileStorageService(s3Client, s3Presigner, properties);
    }

    @Nested
    @DisplayName("uploadFile")
    class UploadFileTests {

        @Test
        @DisplayName("should upload file to S3 and return the storage key")
        void shouldUploadFileAndReturnKey() {
            String key = "org-id/2024-12/campaign-id/uuid_test.jpg";
            InputStream content = new ByteArrayInputStream("test content".getBytes());
            String contentType = "image/jpeg";
            long size = 12L;

            when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                    .thenReturn(PutObjectResponse.builder().build());

            String result = fileStorageService.uploadFile(content, key, contentType, size);

            assertThat(result).isEqualTo(key);

            ArgumentCaptor<PutObjectRequest> requestCaptor = ArgumentCaptor.forClass(PutObjectRequest.class);
            verify(s3Client).putObject(requestCaptor.capture(), any(RequestBody.class));

            PutObjectRequest capturedRequest = requestCaptor.getValue();
            assertThat(capturedRequest.bucket()).isEqualTo(BUCKET_NAME);
            assertThat(capturedRequest.key()).isEqualTo(key);
            assertThat(capturedRequest.contentType()).isEqualTo(contentType);
            assertThat(capturedRequest.contentLength()).isEqualTo(size);
        }

        @Test
        @DisplayName("should set correct content type for video files")
        void shouldSetCorrectContentTypeForVideo() {
            String key = "org-id/2024-12/campaign-id/uuid_video.mp4";
            InputStream content = new ByteArrayInputStream("video content".getBytes());
            String contentType = "video/mp4";
            long size = 1024L;

            when(s3Client.putObject(any(PutObjectRequest.class), any(RequestBody.class)))
                    .thenReturn(PutObjectResponse.builder().build());

            fileStorageService.uploadFile(content, key, contentType, size);

            ArgumentCaptor<PutObjectRequest> requestCaptor = ArgumentCaptor.forClass(PutObjectRequest.class);
            verify(s3Client).putObject(requestCaptor.capture(), any(RequestBody.class));

            assertThat(requestCaptor.getValue().contentType()).isEqualTo("video/mp4");
        }
    }

    @Nested
    @DisplayName("deleteFile")
    class DeleteFileTests {

        @Test
        @DisplayName("should delete file from S3")
        void shouldDeleteFile() {
            String key = "org-id/2024-12/campaign-id/uuid_test.jpg";

            when(s3Client.deleteObject(any(DeleteObjectRequest.class)))
                    .thenReturn(DeleteObjectResponse.builder().build());

            fileStorageService.deleteFile(key);

            ArgumentCaptor<DeleteObjectRequest> requestCaptor = ArgumentCaptor.forClass(DeleteObjectRequest.class);
            verify(s3Client).deleteObject(requestCaptor.capture());

            DeleteObjectRequest capturedRequest = requestCaptor.getValue();
            assertThat(capturedRequest.bucket()).isEqualTo(BUCKET_NAME);
            assertThat(capturedRequest.key()).isEqualTo(key);
        }
    }

    @Nested
    @DisplayName("getPresignedUrl")
    class GetPresignedUrlTests {

        @Test
        @DisplayName("should generate presigned URL with specified expiry")
        void shouldGeneratePresignedUrl() throws Exception {
            String key = "org-id/2024-12/campaign-id/uuid_test.jpg";
            Duration expiry = Duration.ofHours(1);
            URL expectedUrl = URI.create("https://r2.example.com/test-bucket/test-key?signature=xyz").toURL();

            PresignedGetObjectRequest presignedRequest = mock(PresignedGetObjectRequest.class);
            when(presignedRequest.url()).thenReturn(expectedUrl);
            when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class)))
                    .thenReturn(presignedRequest);

            String result = fileStorageService.getPresignedUrl(key, expiry);

            assertThat(result).isEqualTo(expectedUrl.toString());

            ArgumentCaptor<GetObjectPresignRequest> requestCaptor = ArgumentCaptor.forClass(GetObjectPresignRequest.class);
            verify(s3Presigner).presignGetObject(requestCaptor.capture());

            GetObjectPresignRequest capturedRequest = requestCaptor.getValue();
            assertThat(capturedRequest.signatureDuration()).isEqualTo(expiry);
            assertThat(capturedRequest.getObjectRequest().bucket()).isEqualTo(BUCKET_NAME);
            assertThat(capturedRequest.getObjectRequest().key()).isEqualTo(key);
        }

        @Test
        @DisplayName("should use default expiry from properties when not specified")
        void shouldUseDefaultExpiryFromProperties() throws Exception {
            String key = "org-id/2024-12/campaign-id/uuid_test.jpg";
            URL expectedUrl = URI.create("https://r2.example.com/test-bucket/test-key?signature=xyz").toURL();

            PresignedGetObjectRequest presignedRequest = mock(PresignedGetObjectRequest.class);
            when(presignedRequest.url()).thenReturn(expectedUrl);
            when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class)))
                    .thenReturn(presignedRequest);

            String result = fileStorageService.getPresignedUrl(key);

            assertThat(result).isEqualTo(expectedUrl.toString());

            ArgumentCaptor<GetObjectPresignRequest> requestCaptor = ArgumentCaptor.forClass(GetObjectPresignRequest.class);
            verify(s3Presigner).presignGetObject(requestCaptor.capture());

            assertThat(requestCaptor.getValue().signatureDuration()).isEqualTo(Duration.ofSeconds(3600));
        }
    }

    @Nested
    @DisplayName("generateKey")
    class GenerateKeyTests {

        @Test
        @DisplayName("should generate key with correct path structure")
        void shouldGenerateKeyWithCorrectStructure() {
            String filename = "product-image.jpg";

            String result = fileStorageService.generateKey(ORG_ID.toString(), CAMPAIGN_ID.toString(), filename);

            String expectedYearMonth = YearMonth.now().toString();
            assertThat(result).startsWith(ORG_ID + "/" + expectedYearMonth + "/" + CAMPAIGN_ID + "/");
            assertThat(result).endsWith("_product-image.jpg");
        }

        @Test
        @DisplayName("should include UUID in generated key for uniqueness")
        void shouldIncludeUuidForUniqueness() {
            String filename = "test.png";

            String key1 = fileStorageService.generateKey(ORG_ID.toString(), CAMPAIGN_ID.toString(), filename);
            String key2 = fileStorageService.generateKey(ORG_ID.toString(), CAMPAIGN_ID.toString(), filename);

            assertThat(key1).isNotEqualTo(key2);
        }

        @Test
        @DisplayName("should preserve original filename in the key")
        void shouldPreserveOriginalFilename() {
            String filename = "my-product-photo.jpeg";

            String result = fileStorageService.generateKey(ORG_ID.toString(), CAMPAIGN_ID.toString(), filename);

            assertThat(result).contains("my-product-photo.jpeg");
        }

        @Test
        @DisplayName("should use YYYY-MM format for date component")
        void shouldUseYearMonthFormat() {
            String filename = "test.jpg";

            String result = fileStorageService.generateKey(ORG_ID.toString(), CAMPAIGN_ID.toString(), filename);

            String yearMonth = YearMonth.now().toString();
            assertThat(result).contains("/" + yearMonth + "/");
        }
    }
}
