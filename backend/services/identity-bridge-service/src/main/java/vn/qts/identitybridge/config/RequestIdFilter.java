package vn.qts.identitybridge.config;

import java.io.IOException;
import java.util.UUID;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
class RequestIdFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        response.setHeader("X-Request-ID", requestId(request));
        filterChain.doFilter(request, response);
    }

    private static String requestId(HttpServletRequest request) {
        String incoming = request.getHeader("X-Request-ID");
        if (incoming == null || incoming.isBlank()) {
            incoming = request.getHeader("X-Request-Id");
        }
        if (incoming == null || incoming.isBlank() || incoming.length() > 128
                || incoming.contains("\r") || incoming.contains("\n")) {
            return UUID.randomUUID().toString();
        }
        return incoming.trim();
    }
}
