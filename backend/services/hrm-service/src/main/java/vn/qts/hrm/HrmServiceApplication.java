package vn.qts.hrm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class HrmServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(HrmServiceApplication.class, args);
    }
}
