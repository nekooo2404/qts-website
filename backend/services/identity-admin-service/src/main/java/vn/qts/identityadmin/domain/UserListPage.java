package vn.qts.identityadmin.domain;

import java.util.List;
import java.util.Map;

public record UserListPage(List<AdminUser> users, Map<String, Integer> pagination) {
}
