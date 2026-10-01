package vn.qts.identitybridge.config;

import java.util.UUID;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
class SecurityConfig {
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .requestMatchers("/oauth/ory/login", "/oauth/ory/login/",
                                "/oauth/ory/consent", "/oauth/ory/consent/",
                                "/oauth/ory/logout", "/oauth/ory/logout/",
                                "/oauth/ory/logout/accept", "/oauth/ory/logout/accept/")
                        .permitAll()
                        .anyRequest().denyAll()
                )
                .build();
    }

    /**
     * Prevents Spring Boot from generating a random password for a service that
     * has no human login surface.
     */
    @Bean
    UserDetailsService closedEndpointUserDetailsService() {
        return new InMemoryUserDetailsManager(
                User.withUsername("qts-closed-endpoints")
                        .password("{noop}" + UUID.randomUUID())
                        .roles("NONE")
                        .disabled(true)
                        .build()
        );
    }
}
