package vn.qts.identityadmin.application;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class TrustedClientAddressTest {
    @Test
    void trustsForwardedForOnlyFromConfiguredProxy() {
        MockHttpServletRequest trusted = new MockHttpServletRequest();
        trusted.setRemoteAddr("10.20.30.40");
        trusted.addHeader("X-Forwarded-For", "203.0.113.7, 10.20.30.40");

        assertThat(TrustedClientAddress.resolve(trusted, "10.20.30.0/24"))
                .isEqualTo("203.0.113.7");

        MockHttpServletRequest untrusted = new MockHttpServletRequest();
        untrusted.setRemoteAddr("203.0.113.99");
        untrusted.addHeader("X-Forwarded-For", "198.51.100.1");

        assertThat(TrustedClientAddress.resolve(untrusted, "10.20.30.0/24"))
                .isEqualTo("203.0.113.99");
    }

    @Test
    void rejectsNonIpForwardedForValues() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("127.0.0.1");
        request.addHeader("X-Forwarded-For", "evil.example");

        assertThat(TrustedClientAddress.resolve(request, "127.0.0.1/32"))
                .isEqualTo("127.0.0.1");
    }
}
