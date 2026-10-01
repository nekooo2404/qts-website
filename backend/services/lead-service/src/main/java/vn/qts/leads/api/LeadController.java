package vn.qts.leads.api;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;
import vn.qts.leads.application.LeadStaffService;
import vn.qts.leads.config.LeadProperties;
import vn.qts.leads.application.LeadConsultationRateLimiter;
import vn.qts.leads.application.LeadConsultationService;

@RestController
@RequestMapping("/api/v1/leads")
class LeadController {
    private final LeadConsultationService consultationService;
    private final LeadConsultationRateLimiter consultationRateLimiter;
    private final LeadStaffService staffService;
    private final LeadProperties leadProperties;

    LeadController(
        LeadConsultationService consultationService,
        LeadConsultationRateLimiter consultationRateLimiter,
        LeadStaffService staffService,
        LeadProperties leadProperties
    ) {
        this.consultationService = consultationService;
        this.consultationRateLimiter = consultationRateLimiter;
        this.staffService = staffService;
        this.leadProperties = leadProperties;
    }

    @PostMapping("/consultation/")
    ResponseEntity<LeadCreatedResponse> consultation(
        @RequestBody ConsultationLeadRequest request,
        @RequestHeader(name = "X-PoW", required = false) String pow,
        @RequestHeader(name = "X-PoW-Token", required = false) String powToken,
        HttpServletRequest httpRequest
    ) {
        consultationRateLimiter.check(httpRequest);
        LeadConsultationService.Result result = consultationService.submit(request, firstPresent(pow, powToken));
        return ResponseEntity.status(result.created() ? HttpStatus.CREATED : HttpStatus.OK).body(result.response());
    }

    private String firstPresent(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        return second;
    }

    @GetMapping({"", "/"})
    ResponseEntity<LeadPageResponse> list(
        @RequestParam(name = "status", required = false) String status,
        @RequestParam(name = "q", required = false) String query,
        @RequestParam(name = "page", defaultValue = "1") String pageValue,
        @RequestParam(name = "page_size", defaultValue = "20") String pageSizeValue,
        HttpServletRequest request
    ) {
        int page = positive(pageValue, 1);
        int pageSize = Math.min(100, positive(pageSizeValue, 20));
        LeadStaffService.LeadPage result = staffService.page(status, query, page, pageSize);
        String next = page * pageSize < result.count()
            ? pageUrl(request, page + 1, pageSize)
            : null;
        String previous = page > 1
            ? pageUrl(request, page - 1, pageSize)
            : null;
        return ResponseEntity.ok(new LeadPageResponse(result.count(), next, previous, result.results()));
    }

    @PatchMapping({"/{id}", "/{id}/"})
    ResponseEntity<LeadRecord> update(
        @PathVariable long id,
        @RequestBody(required = false) JsonNode body,
        Authentication authentication
    ) {
        return ResponseEntity.ok(staffService.update(
            id,
            body,
            authentication == null ? null : authentication.getName()
        ));
    }

    @GetMapping({"/{id}/activities", "/{id}/activities/"})
    ResponseEntity<List<LeadActivityRecord>> activities(@PathVariable long id) {
        return ResponseEntity.ok(staffService.activities(id));
    }

    @GetMapping({"/export", "/export/"})
    ResponseEntity<byte[]> export(
        @RequestParam(name = "status", required = false) String status,
        @RequestParam(name = "q", required = false) String query
    ) {
        byte[] csv = staffService.export(status, query, leadProperties.exportMaxRowsOrDefault());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDisposition(ContentDisposition.attachment().filename("leads.csv").build());
        headers.add("X-Export-Row-Limit", String.valueOf(leadProperties.exportMaxRowsOrDefault()));
        return new ResponseEntity<>(csv, headers, HttpStatus.OK);
    }

    private int positive(String value, int fallback) {
        try {
            int parsed = Integer.parseInt(value);
            return parsed > 0 ? parsed : fallback;
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private String pageUrl(HttpServletRequest request, int page, int pageSize) {
        UriComponentsBuilder builder = UriComponentsBuilder
            .fromUriString(request.getRequestURL().toString());
        request.getParameterMap().forEach((key, values) -> {
            if (!"page".equals(key) && !"page_size".equals(key)) {
                for (String value : values) {
                    builder.queryParam(key, value);
                }
            }
        });
        return builder
            .queryParam("page", page)
            .queryParam("page_size", pageSize)
            .build()
            .encode(StandardCharsets.UTF_8)
            .toUriString();
    }
}
