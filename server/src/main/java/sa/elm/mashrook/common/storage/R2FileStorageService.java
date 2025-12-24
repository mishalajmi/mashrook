package sa.elm.mashrook.common.storage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import sa.elm.mashrook.configurations.R2StorageProperties;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.InputStream;
import java.time.Duration;
import java.time.YearMonth;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class R2FileStorageService implements FileStorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final R2StorageProperties properties;

    @Override
    public String uploadFile(InputStream content, String key, String contentType, long size) {
        log.debug("Uploading file with key: {}", key);

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(properties.bucketName())
                .key(key)
                .contentType(contentType)
                .contentLength(size)
                .build();

        s3Client.putObject(request, RequestBody.fromInputStream(content, size));

        log.info("Successfully uploaded file: {}", key);
        return key;
    }

    @Override
    public void deleteFile(String key) {
        log.debug("Deleting file with key: {}", key);

        DeleteObjectRequest request = DeleteObjectRequest.builder()
                .bucket(properties.bucketName())
                .key(key)
                .build();

        s3Client.deleteObject(request);

        log.info("Successfully deleted file: {}", key);
    }

    @Override
    public String getPresignedUrl(String key, Duration expiry) {
        log.debug("Generating presigned URL for key: {} with expiry: {}", key, expiry);

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(properties.bucketName())
                .key(key)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(expiry)
                .getObjectRequest(getObjectRequest)
                .build();

        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    @Override
    public String getPresignedUrl(String key) {
        return getPresignedUrl(key, Duration.ofSeconds(properties.presignedUrlExpirySeconds()));
    }

    @Override
    public String generateKey(String organizationId, String campaignId, String filename) {
        String yearMonth = YearMonth.now().toString();
        String uuid = UUID.randomUUID().toString();

        return String.format("%s/%s/%s/%s_%s",
                organizationId,
                yearMonth,
                campaignId,
                uuid,
                filename);
    }
}
