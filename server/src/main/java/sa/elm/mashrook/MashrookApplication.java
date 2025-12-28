package sa.elm.mashrook;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import sa.elm.mashrook.configurations.AuthenticationConfigurationProperties;
import sa.elm.mashrook.notifications.NotificationConfigProperties;

@SpringBootApplication
@EnableConfigurationProperties({
        AuthenticationConfigurationProperties.class,
        NotificationConfigProperties.class,
})
public class MashrookApplication {

    public static void main(String[] args) {
        SpringApplication.run(MashrookApplication.class, args);
    }

}
