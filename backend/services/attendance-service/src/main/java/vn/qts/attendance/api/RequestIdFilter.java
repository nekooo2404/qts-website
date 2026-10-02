package vn.qts.attendance.api;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
class RequestIdFilter extends OncePerRequestFilter {
    static final String ATTRIBUTE = "qts.request.id";
    private static final Pattern SAFE_REQUEST_ID = Pattern.compile("[A-Za-z0-9._:-]{1,128}");

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String requestId = requestId(request);
        request.setAttribute(ATTRIBUTE, requestId);
        response.setHeader("X-Request-ID", requestId);
        filterChain.doFilter(request, response);
    }

    private static String requestId(HttpServletRequest request) {
        String incoming = request.getHeader("X-Request-ID");
        if (incoming == null || incoming.isBlank()) {
            incoming = request.getHeader("X-Request-Id");
        }
        String normalized = incoming == null ? "" : incoming.trim();
        if (!SAFE_REQUEST_ID.matcher(normalized).matches()) {
            return UUID.randomUUID().toString();
        }
        return normalized;
    }
}
