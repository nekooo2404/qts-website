package vn.qts.events.infra;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import vn.qts.events.application.NotificationDeliveryException;
import vn.qts.events.application.NotificationSender;
import vn.qts.events.domain.NotificationRequest;

@Component
@ConditionalOnProperty(prefix = "qts.events", name = "mail-enabled", havingValue = "true")
public class MailNotificationSender implements NotificationSender {
    private final JavaMailSender mailSender;

    public MailNotificationSender(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void send(NotificationRequest request) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(request.recipients().toArray(String[]::new));
        message.setSubject(request.subject());
        message.setText(request.body());
        try {
            mailSender.send(message);
        } catch (MailException error) {
            throw new NotificationDeliveryException("notification delivery failed", error);
        }
    }
}
