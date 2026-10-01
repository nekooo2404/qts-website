package vn.qts.identitybridge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class IdentityBridgeServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(IdentityBridgeServiceApplication.class, args);
    }
}
