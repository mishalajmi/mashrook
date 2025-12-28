package sa.elm.mashrook.configurations;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Configuration class that enables Spring's scheduled task execution capability.
 *
 * <p>This enables the use of {@code @Scheduled} annotations on methods
 * within Spring beans. All scheduled jobs in the {@code scheduling.jobs}
 * package will be automatically discovered and scheduled.
 */
@Configuration
@EnableScheduling
public class SchedulingConfiguration {
}
