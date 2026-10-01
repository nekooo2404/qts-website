package vn.qts.events.application;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import vn.qts.events.config.EventProperties;

@Component
public class EventScheduler {
    private final EventProperties properties;
    private final OutboxPublisher publisher;
    private final NotificationConsumer notificationConsumer;

    public EventScheduler(
            EventProperties properties,
            OutboxPublisher publisher,
            NotificationConsumer notificationConsumer
    ) {
        this.properties = properties;
        this.publisher = publisher;
        this.notificationConsumer = notificationConsumer;
    }

    @Scheduled(fixedDelayString = "${qts.events.poll-delay:PT5S}")
    public void poll() {
        if (!properties.isPollEnabled()) {
            return;
        }
        publisher.publishDue();
        notificationConsumer.consumeDue();
    }
}
