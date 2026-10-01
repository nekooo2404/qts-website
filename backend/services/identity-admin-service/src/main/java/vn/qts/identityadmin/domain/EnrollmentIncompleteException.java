package vn.qts.identityadmin.domain;

import java.util.List;

public class EnrollmentIncompleteException extends IdentityAdminException {
    private final List<String> missing;

    public EnrollmentIncompleteException(List<String> missing) {
        super("enrollment_incomplete", "Chưa hoàn tất thiết lập bảo mật.", 400);
        this.missing = List.copyOf(missing);
    }

    public List<String> missing() {
        return missing;
    }
}
