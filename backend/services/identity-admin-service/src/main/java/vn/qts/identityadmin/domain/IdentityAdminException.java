package vn.qts.identityadmin.domain;

public class IdentityAdminException extends RuntimeException {
    private final String code;
    private final int status;

    public IdentityAdminException(String code, String description, int status) {
        super(description);
        this.code = code;
        this.status = status;
    }

    public String code() {
        return code;
    }

    public int status() {
        return status;
    }
}
