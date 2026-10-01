package vn.qts.hrm.config;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
class SecurityConfig {
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, SecurityProperties properties) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .anonymous(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
                        .requestMatchers("/api/v1/**").authenticated()
                        .anyRequest().denyAll()
                );
        if (properties.enabled()) {
            http.oauth2ResourceServer(oauth2 -> oauth2
                    .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())));
        }
        return http.build();
    }

    @Bean
    @ConditionalOnProperty(prefix = "qts.security", name = "enabled", havingValue = "true")
    NimbusJwtDecoder jwtDecoder(SecurityProperties properties) {
        String issuer = properties.issuerOrEmpty();
        if (issuer.isBlank()) {
            throw new IllegalStateException("QTS_IDENTITY_ISSUER is required when QTS_SECURITY_ENABLED=true");
        }
        NimbusJwtDecoder decoder = properties.jwkSetUriOrEmpty().isBlank()
                ? (NimbusJwtDecoder) JwtDecoders.fromIssuerLocation(issuer)
                : NimbusJwtDecoder.withJwkSetUri(properties.jwkSetUriOrEmpty()).build();
        OAuth2TokenValidator<Jwt> issuerValidator = JwtValidators.createDefaultWithIssuer(issuer);
        OAuth2TokenValidator<Jwt> audienceValidator = token -> token.getAudience().contains(properties.audienceOrDefault())
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Required audience is missing", null));
        OAuth2TokenValidator<Jwt> tokenUseValidator = token -> "access".equals(claimAsString(token, "token_use"))
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Only access tokens are accepted", null));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(issuerValidator, audienceValidator, tokenUseValidator));
        return decoder;
    }

    @Bean
    Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            List<GrantedAuthority> authorities = new ArrayList<>();
            addPermissions(authorities, jwt.getClaims().get("permissions"));
            Object ext = jwt.getClaims().get("ext");
            if (ext instanceof Map<?, ?> extMap) {
                addPermissions(authorities, extMap.get("permissions"));
            }
            return authorities;
        });
        return converter;
    }

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

    private static void addPermissions(List<GrantedAuthority> authorities, Object rawPermissions) {
        if (rawPermissions instanceof Collection<?> permissions) {
            for (Object permission : permissions) {
                if (permission != null) {
                    authorities.add(new SimpleGrantedAuthority("PERM_" + permission));
                }
            }
        }
    }

    private static String claimAsString(Jwt jwt, String name) {
        Object value = jwt.getClaims().get(name);
        String text = text(value);
        if (!text.isBlank()) {
            return text;
        }
        Object ext = jwt.getClaims().get("ext");
        if (ext instanceof Map<?, ?> extMap) {
            return text(extMap.get(name));
        }
        return "";
    }

    private static String text(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }
}
