package sa.elm.mashrook.notifications;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("NotificationType Tests")
class NotificationTypeTest {

    @Test
    @DisplayName("should have EMAIL, SMS, and PUSH types")
    void shouldHaveAllRequiredNotificationTypes() {
        assertThat(NotificationType.values()).containsExactlyInAnyOrder(
                NotificationType.EMAIL,
                NotificationType.SMS,
                NotificationType.PUSH
        );
    }

    @Test
    @DisplayName("should have exactly 3 notification types")
    void shouldHaveExactlyThreeTypes() {
        assertThat(NotificationType.values()).hasSize(3);
    }
}
