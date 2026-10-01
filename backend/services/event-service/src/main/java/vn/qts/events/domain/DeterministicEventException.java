package vn.qts.events.domain;

public class DeterministicEventException extends RuntimeException {
    public DeterministicEventException(String message) {
        super(message);
    }
}
