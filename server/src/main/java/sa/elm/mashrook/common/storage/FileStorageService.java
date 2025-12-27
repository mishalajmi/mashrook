package sa.elm.mashrook.common.storage;

import java.io.InputStream;
import java.time.Duration;

public interface FileStorageService {

    String uploadFile(InputStream content, String key, String contentType, long size);

    void deleteFile(String key);

    String getPresignedUrl(String key, Duration expiry);

    String getPresignedUrl(String key);

    String generateKey(String organizationId, String campaignId, String filename);
}
