package vn.qts.identityadmin.application;

import java.util.List;

public record UpdateMembershipAccessRequest(
        List<String> roles,
        List<String> applications
) {
}
