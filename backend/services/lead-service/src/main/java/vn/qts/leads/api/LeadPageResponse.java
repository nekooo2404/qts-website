package vn.qts.leads.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.ALWAYS)
public record LeadPageResponse(
    long count,
    String next,
    String previous,
    List<LeadRecord> results
) {
}
