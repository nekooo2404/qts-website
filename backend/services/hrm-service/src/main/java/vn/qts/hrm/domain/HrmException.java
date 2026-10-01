package vn.qts.hrm.domain;

public class HrmException extends RuntimeException {
    private final String code;
    private final int status;

    public HrmException(String code, String message, int status) {
        super(message);
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
