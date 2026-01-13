package sa.elm.mashrook.orders.dto;

import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OrderCommentRequest(
        @NotBlank(message = "Comment content is required")
        @Size(max = 2000, message = "Comment must not exceed 2000 characters")
        String content,

        @JsonSetter(nulls = Nulls.SKIP)
        Boolean isInternal
) {
    /**
     * Compact constructor that defaults isInternal to false when null.
     */
    public OrderCommentRequest {
        if (isInternal == null) {
            isInternal = Boolean.FALSE;
        }
    }
}
