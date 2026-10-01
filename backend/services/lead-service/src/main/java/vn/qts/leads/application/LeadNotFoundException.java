package vn.qts.leads.application;

public class LeadNotFoundException extends RuntimeException {
    public LeadNotFoundException(long id) {
        super("Lead not found: " + id);
    }
}
