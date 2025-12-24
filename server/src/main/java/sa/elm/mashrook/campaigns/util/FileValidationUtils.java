package sa.elm.mashrook.campaigns.util;

import org.springframework.web.multipart.MultipartFile;
import sa.elm.mashrook.campaigns.domain.MediaType;
import sa.elm.mashrook.exceptions.FileSizeExceededException;
import sa.elm.mashrook.exceptions.InvalidMediaTypeException;

import java.util.Map;
import java.util.Set;

public final class FileValidationUtils {

    private static final long MAX_IMAGE_SIZE = 50 * 1024 * 1024L; // 50MB
    private static final long MAX_VIDEO_SIZE = 500 * 1024 * 1024L; // 500MB

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png");
    private static final Set<String> ALLOWED_VIDEO_TYPES = Set.of("video/mp4");

    private static final Map<String, Set<String>> CONTENT_TYPE_EXTENSIONS = Map.of(
            "image/jpeg", Set.of("jpg", "jpeg"),
            "image/png", Set.of("png"),
            "video/mp4", Set.of("mp4")
    );

    private FileValidationUtils() {
    }

    public static void validateFile(MultipartFile file) {
        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();
        long size = file.getSize();

        validateContentType(contentType);
        validateExtensionMatchesContentType(filename, contentType);
        validateFileSize(contentType, size);
    }

    public static MediaType determineMediaType(String contentType) {
        return ALLOWED_IMAGE_TYPES.contains(contentType) ? MediaType.IMAGE : MediaType.VIDEO;
    }

    private static void validateContentType(String contentType) {
        if (!isAllowedContentType(contentType)) {
            throw new InvalidMediaTypeException("Unsupported content type: " + contentType +
                    ". Allowed types: jpg, jpeg, png, mp4");
        }
    }

    private static boolean isAllowedContentType(String contentType) {
        return ALLOWED_IMAGE_TYPES.contains(contentType) || ALLOWED_VIDEO_TYPES.contains(contentType);
    }

    private static void validateExtensionMatchesContentType(String filename, String contentType) {
        if (filename == null || !filename.contains(".")) {
            throw new InvalidMediaTypeException("Filename must have an extension");
        }

        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        Set<String> allowedExtensions = CONTENT_TYPE_EXTENSIONS.get(contentType);

        if (allowedExtensions == null || !allowedExtensions.contains(extension)) {
            throw new InvalidMediaTypeException("File extension ." + extension +
                    " does not match content type " + contentType);
        }
    }

    private static void validateFileSize(String contentType, long size) {
        long maxSize = ALLOWED_IMAGE_TYPES.contains(contentType) ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;

        if (size > maxSize) {
            String type = ALLOWED_IMAGE_TYPES.contains(contentType) ? "Image" : "Video";
            long maxSizeMb = maxSize / (1024 * 1024);
            throw new FileSizeExceededException(type + " file size exceeds maximum allowed size of " + maxSizeMb + "MB");
        }
    }
}
