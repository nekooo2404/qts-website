package vn.qts.hrm.domain;

import java.util.List;

public record PageResult<T>(List<T> items, int page, int pageSize, long total) {
}
