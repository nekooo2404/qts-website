package vn.qts.events.infra;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.springframework.dao.DataAccessException;
import org.springframework.data.domain.Range;
import org.springframework.data.redis.RedisSystemException;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.PendingMessage;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.connection.stream.StreamReadOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import vn.qts.events.application.EventStream;
import vn.qts.events.domain.StreamMessage;

@Component
@SuppressWarnings("unchecked")
public class RedisEventStream implements EventStream {
    private final StringRedisTemplate redis;

    public RedisEventStream(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    public String add(String stream, String envelope) {
        MapRecord<String, String, String> record = MapRecord.create(stream, Map.of("envelope", envelope));
        RecordId id = redis.opsForStream().add(record);
        if (id == null) {
            throw new IllegalStateException("Redis did not return a stream record id");
        }
        return id.getValue();
    }

    @Override
    public long length(String stream) {
        Long size = redis.opsForStream().size(stream);
        return size == null ? 0 : size;
    }

    @Override
    public void ensureGroup(String stream, String group) {
        try {
            redis.opsForStream().createGroup(stream, ReadOffset.from("0-0"), group);
        } catch (RedisSystemException error) {
            if (!String.valueOf(error.getMessage()).contains("BUSYGROUP")) {
                throw error;
            }
        } catch (DataAccessException error) {
            String message = String.valueOf(error.getMessage());
            if (!message.contains("BUSYGROUP")) {
                throw error;
            }
        }
    }

    @Override
    public List<StreamMessage> read(String stream, String group, String consumer, int count, Duration block) {
        List<MapRecord<String, Object, Object>> records = redis.opsForStream().read(
                Consumer.from(group, consumer),
                StreamReadOptions.empty().count(count).block(block),
                StreamOffset.create(stream, ReadOffset.lastConsumed())
        );
        if (records == null) {
            return List.of();
        }
        return records.stream().map(this::toMessage).toList();
    }

    @Override
    public List<StreamMessage> reclaim(String stream, String group, String consumer, int count, Duration minIdle) {
        var pending = redis.opsForStream().pending(stream, group, Range.unbounded(), count);
        if (pending == null || pending.isEmpty()) {
            return List.of();
        }
        RecordId[] ids = pending.stream()
                .filter(message -> message.getElapsedTimeSinceLastDelivery().compareTo(minIdle) >= 0)
                .map(PendingMessage::getId)
                .toArray(RecordId[]::new);
        if (ids.length == 0) {
            return List.of();
        }
        List<MapRecord<String, Object, Object>> claimed =
                redis.opsForStream().claim(stream, group, consumer, minIdle, ids);
        return claimed.stream().map(this::toMessage).toList();
    }

    @Override
    public void acknowledge(String stream, String group, String messageId) {
        redis.opsForStream().acknowledge(stream, group, RecordId.of(messageId));
    }

    private StreamMessage toMessage(MapRecord<String, Object, Object> record) {
        Object envelope = record.getValue().get("envelope");
        return new StreamMessage(record.getId().getValue(), envelope == null ? "{}" : envelope.toString());
    }
}
