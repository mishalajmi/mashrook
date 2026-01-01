package sa.elm.mashrook.configurations;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Configuration to enable asynchronous method execution.
 * Used by NotificationService to send emails asynchronously.
 */
@Configuration
@EnableAsync(proxyTargetClass = true)
public class AsyncConfig {
}
