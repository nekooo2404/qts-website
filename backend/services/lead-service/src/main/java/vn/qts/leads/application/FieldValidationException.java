package vn.qts.leads.application;

import java.util.List;
import java.util.Map;

public class FieldValidationException extends RuntimeException {
    private final Map<String, List<String>> errors;

    public FieldValidationException(Map<String, List<String>> errors) {
        super("Request validation failed");
        this.errors = Map.copyOf(errors);
    }

    public Map<String, List<String>> errors() {
        return errors;
    }
}
