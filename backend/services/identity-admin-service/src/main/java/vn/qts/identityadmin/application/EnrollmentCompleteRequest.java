package vn.qts.identityadmin.application;

import com.fasterxml.jackson.annotation.JsonProperty;

public record EnrollmentCompleteRequest(
        @JsonProperty("confirm_password_changed")
        boolean confirmPasswordChanged
) {
}
