package vn.qts.events.application;

import java.time.Duration;
import java.util.List;

import vn.qts.events.domain.StreamMessage;

public interface EventStream {
    String add(String stream, String envelope);

    long length(String stream);

    void ensureGroup(String stream, String group);

    List<StreamMessage> read(String stream, String group, String consumer, int count, Duration block);

    List<StreamMessage> reclaim(String stream, String group, String consumer, int count, Duration minIdle);

    void acknowledge(String stream, String group, String messageId);
}
