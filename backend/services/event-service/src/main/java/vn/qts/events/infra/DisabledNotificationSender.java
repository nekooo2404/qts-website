package vn.qts.events.infra;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import vn.qts.events.application.NotificationDeliveryException;
import vn.qts.events.application.NotificationSender;
import vn.qts.events.domain.NotificationRequest;

@Component
@ConditionalOnProperty(prefix = "qts.events", name = "mail-enabled", havingValue = "false")
public class DisabledNotificationSender implements NotificationSender {
    @Override
    public void send(NotificationRequest request) {
        throw new NotificationDeliveryException("mail delivery is disabled");
    }
}
