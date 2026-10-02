package vn.qts.identityadmin.application;

import java.math.BigInteger;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

final class TrustedClientAddress {
    private TrustedClientAddress() {
    }

    static String resolve(HttpServletRequest request, String trustedProxyCidrs) {
        if (request == null) {
            return "";
        }
        String remote = safe(request.getRemoteAddr());
        InetAddress remoteAddress = parseIpLiteral(remote);
        if (remoteAddress != null && isTrustedProxy(remoteAddress, trustedProxyCidrs)) {
            String forwarded = firstHeaderIp(request.getHeader("X-Forwarded-For"));
            if (!forwarded.isBlank()) {
                return forwarded;
            }
            String realIp = singleHeaderIp(request.getHeader("X-Real-IP"));
            if (!realIp.isBlank()) {
                return realIp;
            }
        }
        return remote;
    }

    private static boolean isTrustedProxy(InetAddress address, String trustedProxyCidrs) {
        for (CidrRange range : CidrRange.parseAll(trustedProxyCidrs)) {
            if (range.matches(address)) {
                return true;
            }
        }
        return false;
    }

    private static String firstHeaderIp(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        for (String part : value.split(",")) {
            String normalized = normalizeIpLiteral(part);
            if (parseIpLiteral(normalized) != null) {
                return normalized;
            }
            return "";
        }
        return "";
    }

    private static String singleHeaderIp(String value) {
        String normalized = normalizeIpLiteral(value);
        return parseIpLiteral(normalized) == null ? "" : normalized;
    }

    private static InetAddress parseIpLiteral(String value) {
        String normalized = normalizeIpLiteral(value);
        if (normalized.isBlank() || normalized.contains("%")) {
            return null;
        }
        if (normalized.indexOf(':') < 0 && !isValidIpv4Literal(normalized)) {
            return null;
        }
        if (normalized.indexOf(':') >= 0 && !normalized.matches("[0-9A-Fa-f:.]+")) {
            return null;
        }
        try {
            return InetAddress.getByName(normalized);
        } catch (UnknownHostException error) {
            return null;
        }
    }

    private static boolean isValidIpv4Literal(String value) {
        String[] parts = value.split("\\.", -1);
        if (parts.length != 4) {
            return false;
        }
        for (String part : parts) {
            if (!part.matches("\\d{1,3}")) {
                return false;
            }
            int octet = Integer.parseInt(part);
            if (octet < 0 || octet > 255) {
                return false;
            }
        }
        return true;
    }

    private static String normalizeIpLiteral(String value) {
        String normalized = safe(value).trim();
        if (normalized.startsWith("[") && normalized.endsWith("]")) {
            return normalized.substring(1, normalized.length() - 1);
        }
        return normalized;
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    private record CidrRange(InetAddress address, int prefix) {
        static List<CidrRange> parseAll(String raw) {
            List<CidrRange> ranges = new ArrayList<>();
            String source = raw == null || raw.isBlank() ? "127.0.0.1/32,::1/128" : raw;
            for (String entry : source.split(",")) {
                CidrRange range = parse(entry);
                if (range != null) {
                    ranges.add(range);
                }
            }
            return ranges;
        }

        private static CidrRange parse(String raw) {
            String value = safe(raw).trim();
            if (value.isBlank()) {
                return null;
            }
            String[] parts = value.split("/", 2);
            InetAddress parsedAddress = parseIpLiteral(parts[0]);
            if (parsedAddress == null) {
                return null;
            }
            int totalBits = parsedAddress.getAddress().length * 8;
            int parsedPrefix = totalBits;
            if (parts.length == 2) {
                try {
                    parsedPrefix = Integer.parseInt(parts[1]);
                } catch (NumberFormatException error) {
                    return null;
                }
            }
            if (parsedPrefix < 0 || parsedPrefix > totalBits) {
                return null;
            }
            return new CidrRange(parsedAddress, parsedPrefix);
        }

        boolean matches(InetAddress candidate) {
            byte[] expectedBytes = address.getAddress();
            byte[] candidateBytes = candidate.getAddress();
            if (expectedBytes.length != candidateBytes.length) {
                return false;
            }
            int totalBits = expectedBytes.length * 8;
            int suffixBits = totalBits - prefix;
            BigInteger expected = new BigInteger(1, expectedBytes).shiftRight(suffixBits);
            BigInteger actual = new BigInteger(1, candidateBytes).shiftRight(suffixBits);
            return expected.equals(actual);
        }
    }
}
