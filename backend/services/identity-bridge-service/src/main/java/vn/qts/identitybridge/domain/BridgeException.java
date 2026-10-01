package vn.qts.identitybridge.domain;

public class BridgeException extends RuntimeException {
    private final String code;
    private final int status;

    public BridgeException(String code, String description, int status) {
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
