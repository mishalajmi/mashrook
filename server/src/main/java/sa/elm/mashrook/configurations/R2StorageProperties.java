package sa.elm.mashrook.configurations;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

@ConfigurationProperties(prefix = "mashrook.storage.r2")
public record R2StorageProperties(
        String endpoint,
        String accessKeyId,
        String secretAccessKey,
        String bucketName,
        @DefaultValue("auto") String region,
        @DefaultValue("3600") Long presignedUrlExpirySeconds,
        @DefaultValue("http://localhost:5173") String corsAllowedOrigins
) {}
