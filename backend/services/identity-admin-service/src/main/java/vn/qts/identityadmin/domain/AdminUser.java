package vn.qts.identityadmin.domain;

import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AdminUser(
        UUID id,
        @JsonProperty("membership_id")
        UUID membershipId,
        String email,
        @JsonProperty("display_name")
        String displayName,
        @JsonProperty("is_active")
        boolean active,
        @JsonProperty("ory_id")
        UUID oryId,
        AdminMembership membership,
        @JsonProperty("created_at")
        Instant createdAt
) {
}
