package vn.qts.identityadmin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class IdentityAdminServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(IdentityAdminServiceApplication.class, args);
    }
}
