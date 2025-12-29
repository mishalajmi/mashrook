package sa.elm.mashrook.common.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import sa.elm.mashrook.configurations.R2StorageProperties;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CORSConfiguration;
import software.amazon.awssdk.services.s3.model.CORSRule;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutBucketCorsRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.util.Arrays;
import java.util.List;

/**
 * Initializes the storage bucket on application startup.
 * Creates the bucket if it doesn't exist and configures CORS rules.
 * Works with both MinIO (local) and Cloudflare R2 (production).
 */
@Component
@Slf4j
public class StorageBucketInitializer {

    private final S3Client s3Client;
    private final R2StorageProperties properties;

    public StorageBucketInitializer(S3Client s3Client, R2StorageProperties properties) {
        this.s3Client = s3Client;
        this.properties = properties;
        initialize();
    }

    private void initialize() {
        createBucketIfNotExists();
        configureCors();
    }

    private void createBucketIfNotExists() {
        try {
            s3Client.headBucket(HeadBucketRequest.builder()
                    .bucket(properties.bucketName())
                    .build());
            log.debug("Bucket already exists: {}", properties.bucketName());
        } catch (NoSuchBucketException e) {
            try {
                s3Client.createBucket(CreateBucketRequest.builder()
                        .bucket(properties.bucketName())
                        .build());
                log.info("Created bucket: {}", properties.bucketName());
            } catch (S3Exception createEx) {
                log.warn("Could not create bucket (may already exist or not have permission): {}",
                        createEx.getMessage());
            }
        } catch (S3Exception e) {
            log.warn("Could not check bucket existence: {}", e.getMessage());
        }
    }

    private void configureCors() {
        // Parse allowed origins (comma-separated)
        List<String> origins = Arrays.asList(properties.corsAllowedOrigins().split(","));

        CORSRule corsRule = CORSRule.builder()
                .allowedMethods("GET", "PUT", "POST", "DELETE", "HEAD")
                .allowedOrigins(origins)
                .allowedHeaders("*")
                .exposeHeaders("ETag", "Content-Length", "Content-Type")
                .maxAgeSeconds(86400) // 24 hours
                .build();

        CORSConfiguration corsConfig = CORSConfiguration.builder()
                .corsRules(corsRule)
                .build();

        try {
            s3Client.putBucketCors(PutBucketCorsRequest.builder()
                    .bucket(properties.bucketName())
                    .corsConfiguration(corsConfig)
                    .build());
            log.info("CORS configured for bucket '{}' with allowed origins: {}",
                    properties.bucketName(), origins);
        } catch (S3Exception e) {
            // R2 may not support programmatic CORS configuration
            // In that case, CORS must be configured via Cloudflare dashboard
            log.warn("Could not configure CORS programmatically (configure via dashboard if using R2): {}",
                    e.getMessage());
        }
    }
}
