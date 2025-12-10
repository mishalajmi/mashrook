package sa.elm.mashrook;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import sa.elm.mashrook.configurations.AuthenticationConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({
        AuthenticationConfigurationProperties.class,
})
public class MashrookApplication {

    public static void main(String[] args) {
        SpringApplication.run(MashrookApplication.class, args);
    }

}
