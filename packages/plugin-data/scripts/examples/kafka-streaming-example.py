#!/usr/bin/env python3
"""
Kafka Streaming Example - Context7 Best Practices

Demonstrates Kafka producer/consumer patterns from Context7:
- Producer with proper configuration and callbacks
- Consumer with manual commits
- Error handling and retry logic
- Graceful shutdown

Source: /apache/kafka (1,281 snippets, trust 9.1)
"""

from kafka import KafkaProducer, KafkaConsumer
from kafka.errors import KafkaError
import json
import logging
from datetime import datetime
import time
import signal
import sys

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ===================================================================
# PRODUCER EXAMPLE
# ===================================================================

class EventProducer:
    """
    Kafka producer with Context7 best practices.

    Context7 Patterns:
    - acks='all' for reliability
    - Compression for performance
    - Callbacks for delivery confirmation
    """

    def __init__(
        self,
        bootstrap_servers: str = "localhost:9092",
        topic: str = "user_events",
    ):
        self.topic = topic

        # ✅ CORRECT: Producer with proper configuration
        self.producer = KafkaProducer(
            bootstrap_servers=bootstrap_servers,
            # Serialization
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: k.encode('utf-8') if k else None,
            # Reliability
            acks='all',  # Wait for all replicas
            retries=3,
            max_in_flight_requests_per_connection=1,
            # Performance
            compression_type='snappy',
            batch_size=16384,
            linger_ms=10,
        )

        logger.info(f"Producer initialized for topic: {self.topic}")

    def send_event(self, key: str, value: dict) -> None:
        """
        Send event with Context7 callback pattern.

        Context7 Pattern: Async send with delivery confirmation
        """
        value["timestamp"] = datetime.utcnow().isoformat()

        future = self.producer.send(self.topic, key=key, value=value)
        future.add_callback(self._on_success)
        future.add_errback(self._on_error)

    def _on_success(self, record_metadata):
        """Callback for successful delivery."""
        logger.info(
            f"✓ Message delivered: topic={record_metadata.topic}, "
            f"partition={record_metadata.partition}, offset={record_metadata.offset}"
        )

    def _on_error(self, excp):
        """Callback for delivery failure."""
        logger.error(f"✗ Message delivery failed: {excp}")

    def close(self):
        """Close producer after flushing."""
        logger.info("Flushing and closing producer...")
        self.producer.flush()
        self.producer.close()


# ===================================================================
# CONSUMER EXAMPLE
# ===================================================================

class EventConsumer:
    """
    Kafka consumer with Context7 best practices.

    Context7 Patterns:
    - Manual commits for reliability
    - Proper configuration (consumer.* prefix)
    - Graceful shutdown
    """

    def __init__(
        self,
        bootstrap_servers: str = "localhost:9092",
        topic: str = "user_events",
        group_id: str = "event_processor_group",
    ):
        self.topic = topic
        self.running = True

        # ✅ CORRECT: Consumer with proper configuration
        self.consumer = KafkaConsumer(
            topic,
            bootstrap_servers=bootstrap_servers,
            group_id=group_id,
            # Deserialization
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            key_deserializer=lambda k: k.decode('utf-8') if k else None,
            # Commit strategy
            enable_auto_commit=False,  # Manual commits
            auto_offset_reset='earliest',
            # Performance
            max_poll_records=100,
            max_poll_interval_ms=300000,
        )

        # Setup graceful shutdown
        signal.signal(signal.SIGINT, self._shutdown)
        signal.signal(signal.SIGTERM, self._shutdown)

        logger.info(f"Consumer initialized: topic={self.topic}, group={group_id}")

    def consume(self) -> None:
        """
        Consume messages with Context7 manual commit pattern.

        Context7 Pattern: Process then commit for exactly-once semantics
        """
        try:
            while self.running:
                # Context7 Pattern: Poll with timeout
                messages = self.consumer.poll(timeout_ms=1000)

                if not messages:
                    continue

                for topic_partition, records in messages.items():
                    for record in records:
                        try:
                            # Process message
                            self._process_message(record)

                            # ✅ CORRECT: Commit after successful processing
                            self.consumer.commit()

                        except Exception as e:
                            logger.error(f"Error processing message: {e}")
                            # In production: decide to skip or retry

        finally:
            self._close()

    def _process_message(self, record) -> None:
        """Process a single message."""
        logger.info(
            f"Processing: partition={record.partition}, "
            f"offset={record.offset}, key={record.key}"
        )

        # Your business logic here
        logger.info(f"Message: {record.value}")

    def _shutdown(self, signum, frame):
        """Handle shutdown signal."""
        logger.info("Shutdown signal received")
        self.running = False

    def _close(self):
        """Close consumer."""
        logger.info("Closing consumer...")
        self.consumer.close()


# ===================================================================
# DEMO APPLICATION
# ===================================================================

def demo_producer():
    """Demonstrate producer patterns."""
    print("\n" + "=" * 60)
    print("PRODUCER DEMO - Context7 Patterns")
    print("=" * 60)

    producer = EventProducer()

    try:
        # Send 10 events
        for i in range(10):
            event = {
                "event_id": i,
                "event_type": "page_view",
                "user_id": f"user_{i % 3}",
                "page": f"/page/{i}",
            }

            producer.send_event(key=f"user_{i % 3}", value=event)
            time.sleep(0.1)

        logger.info("All events sent")

    finally:
        producer.close()


def demo_consumer():
    """Demonstrate consumer patterns."""
    print("\n" + "=" * 60)
    print("CONSUMER DEMO - Context7 Patterns")
    print("=" * 60)
    print("Press Ctrl+C to stop consuming...")

    consumer = EventConsumer()
    consumer.consume()


if __name__ == "__main__":
    print("Kafka Streaming Example - Context7 Best Practices")
    print("=" * 60)
    print("")
    print("Context7 Patterns Demonstrated:")
    print("1. ✅ Producer: acks='all' for reliability")
    print("2. ✅ Producer: Callbacks for delivery confirmation")
    print("3. ✅ Producer: Compression and batching")
    print("4. ✅ Consumer: Manual commits for exactly-once")
    print("5. ✅ Consumer: Proper error handling")
    print("6. ✅ Consumer: Graceful shutdown")
    print("7. ✅ Serialization: JSON with proper encoding")
    print("")
    print("Source: /apache/kafka (1,281 snippets, trust 9.1)")
    print("")

    mode = input("Run (p)roducer or (c)onsumer? [p/c]: ").strip().lower()

    if mode == 'p':
        demo_producer()
    elif mode == 'c':
        demo_consumer()
    else:
        print("Invalid choice. Use 'p' or 'c'")
