package vn.qts.identityadmin.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class SecurityPropertiesTest {
    @Test
    void corsAllowedOriginsDropsUnsafeOrigins() {
        SecurityProperties properties = new SecurityProperties(
                true,
                null,
                null,
                null,
                new SecurityProperties.Cors(List.of(
                        " https://portal.example.com ",
                        "*",
                        "null",
                        "file://tmp/qts.html",
                        "https://portal.example.com/app",
                        "http://portal.example.com",
                        "http://localhost:5174",
                        "http://127.0.0.1:3001"
                )),
                null
        );

        assertThat(properties.corsAllowedOrigins())
                .containsExactly("https://portal.example.com", "http://localhost:5174", "http://127.0.0.1:3001");
    }
}
