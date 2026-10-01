package vn.qts.identityadmin.domain;

import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AdminMembership(
        UUID id,
        String status,
        @JsonProperty("status_label")
        String statusLabel,
        List<String> roles,
        List<String> applications,
        @JsonProperty("policy_version")
        int policyVersion
) {
}
