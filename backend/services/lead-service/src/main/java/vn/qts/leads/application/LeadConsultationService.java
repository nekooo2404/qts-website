package vn.qts.leads.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.qts.leads.api.ConsultationLeadRequest;
import vn.qts.leads.api.LeadCreatedResponse;
import vn.qts.leads.config.LeadProperties;
import vn.qts.leads.infra.LeadDraft;
import vn.qts.leads.infra.LeadJdbcRepository;

@Service
public class LeadConsultationService {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final String NEW_STATUS = "new";

    private final LeadJdbcRepository repository;
    private final LeadProperties properties;
    private final Clock clock;

    public LeadConsultationService(LeadJdbcRepository repository, LeadProperties properties, Clock clock) {
        this.repository = repository;
        this.properties = properties;
        this.clock = clock;
    }

    @Transactional
    public Result submit(ConsultationLeadRequest request, String headerPow) {
        String key = trim(request == null ? null : request.idempotencyKey());
        if (!key.isBlank()) {
            Optional<LeadCreatedResponse> existing = repository.findByIdempotencyKey(key);
            if (existing.isPresent()) {
                return new Result(existing.get(), false);
            }
        }

        String pow = trim(headerPow);
        if (pow.isBlank() && request != null) {
            pow = trim(request.pow());
        }
        if (!verifyPow(pow, key)) {
            throw fieldError("pow", "Proof-of-work không hợp lệ.");
        }

        LeadDraft draft = validateAndNormalize(request);
        Instant now = Instant.now(clock);
        try {
            LeadCreatedResponse response = repository.createLead(draft, NEW_STATUS, now);
            repository.createActivity(response.id(), "created", now);
            repository.createNotificationOutbox(response.id(), draft, response.createdAt());
            return new Result(response, true);
        } catch (DuplicateKeyException duplicate) {
            return repository.findByIdempotencyKey(draft.idempotencyKey())
                .map(response -> new Result(response, false))
                .orElseThrow(() -> duplicate);
        }
    }

    private boolean verifyPow(String token, String seed) {
        String prefix = properties.powPrefixOrEmpty();
        if (token.isBlank() || prefix.isBlank()) {
            return false;
        }
        return sha256Hex(seed + ":" + token).startsWith(prefix);
    }

    private LeadDraft validateAndNormalize(ConsultationLeadRequest request) {
        Map<String, List<String>> errors = new LinkedHashMap<>();
        if (request == null) {
            add(errors, "name", "Vui lòng nhập họ và tên.");
            add(errors, "email", "Vui lòng nhập email.");
            add(errors, "company", "Vui lòng nhập tên doanh nghiệp.");
            add(errors, "message", "Vui lòng mô tả nhu cầu của bạn.");
            add(errors, "consent", "Bạn phải đồng ý trước khi gửi yêu cầu này.");
            add(errors, "idempotency_key", "Thiếu khóa chống gửi trùng.");
            throw new FieldValidationException(errors);
        }

        String name = trim(request.name());
        String email = trim(request.email());
        String company = trim(request.company());
        String phone = trim(request.phone());
        String message = trim(request.message());
        String locale = defaultIfBlank(trim(request.locale()), "vi");
        String sourceUrl = trim(request.sourceUrl());
        String utmSource = trim(request.utmSource());
        String utmMedium = trim(request.utmMedium());
        String utmCampaign = trim(request.utmCampaign());
        String idempotencyKey = trim(request.idempotencyKey());
        String website = trim(request.website());

        required(errors, "name", name, "Vui lòng nhập họ và tên.");
        max(errors, "name", name, 120, "Họ và tên không được vượt quá 120 ký tự.");
        required(errors, "email", email, "Vui lòng nhập email.");
        if (!email.isBlank() && !EMAIL_PATTERN.matcher(email).matches()) {
            add(errors, "email", "Địa chỉ email không hợp lệ.");
        }
        required(errors, "company", company, "Vui lòng nhập tên doanh nghiệp.");
        max(errors, "company", company, 180, "Tên doanh nghiệp không được vượt quá 180 ký tự.");
        required(errors, "message", message, "Vui lòng mô tả nhu cầu của bạn.");
        if (!message.isBlank() && message.length() < 10) {
            add(errors, "message", "Nội dung trao đổi cần dài tối thiểu 10 ký tự.");
        }
        max(errors, "message", message, 2000, "Nội dung trao đổi không được vượt quá 2000 ký tự.");
        if (!Boolean.TRUE.equals(request.consent())) {
            add(errors, "consent", "Bạn phải đồng ý trước khi gửi yêu cầu này.");
        }
        required(errors, "idempotency_key", idempotencyKey, "Thiếu khóa chống gửi trùng.");
        max(errors, "idempotency_key", idempotencyKey, 64, "Khóa chống gửi trùng không được vượt quá 64 ký tự.");
        if (!website.isBlank()) {
            add(errors, "website", "Trường này phải để trống.");
        }
        max(errors, "phone", phone, 32, "Số điện thoại không được vượt quá 32 ký tự.");
        max(errors, "locale", locale, 5, "Mã ngôn ngữ không được vượt quá 5 ký tự.");
        max(errors, "source_url", sourceUrl, 500, "Đường dẫn nguồn không được vượt quá 500 ký tự.");
        max(errors, "utm_source", utmSource, 120, "UTM source không được vượt quá 120 ký tự.");
        max(errors, "utm_medium", utmMedium, 120, "UTM medium không được vượt quá 120 ký tự.");
        max(errors, "utm_campaign", utmCampaign, 200, "UTM campaign không được vượt quá 200 ký tự.");

        if (!errors.isEmpty()) {
            throw new FieldValidationException(errors);
        }

        return new LeadDraft(name, email, company, phone, message, locale, true, sourceUrl, utmSource, utmMedium, utmCampaign, idempotencyKey);
    }

    private void required(Map<String, List<String>> errors, String field, String value, String message) {
        if (value == null || value.isBlank()) {
            add(errors, field, message);
        }
    }

    private void max(Map<String, List<String>> errors, String field, String value, int max, String message) {
        if (value != null && value.length() > max) {
            add(errors, field, message);
        }
    }

    private void add(Map<String, List<String>> errors, String field, String message) {
        errors.computeIfAbsent(field, ignored -> new ArrayList<>()).add(message);
    }

    private FieldValidationException fieldError(String field, String message) {
        return new FieldValidationException(Map.of(field, List.of(message)));
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(bytes.length * 2);
            for (byte current : bytes) {
                hex.append(String.format("%02x", current));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 unavailable", error);
        }
    }

    public record Result(LeadCreatedResponse response, boolean created) {
    }
}
