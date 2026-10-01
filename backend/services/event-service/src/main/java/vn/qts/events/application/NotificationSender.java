package vn.qts.events.application;

import vn.qts.events.domain.NotificationRequest;

public interface NotificationSender {
    void send(NotificationRequest request);
}
