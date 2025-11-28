// server/kafka/consumers/metricConsumer.js
import { Kafka } from "kafkajs";
import { reportingDB } from "../../db/connection.js";

const kafka = new Kafka({
  clientId: "etl-consumer",
  brokers: [process.env.KAFKA_BROKER],
  ssl: true,
  sasl: {
    mechanism: "plain",
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD
  }
});

const consumer = kafka.consumer({ groupId: "etl-mysql-writer" });

export async function initMetricConsumer() {
  console.log("🚀 Starting Kafka consumer...");

  await consumer.connect();
  await consumer.subscribe({
    topic: "etl.daily_metrics",   // ← Your new unified topic
    fromBeginning: false
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value.toString());

        await reportingDB.query(
          `
          INSERT INTO streaming_metrics (metric_name, metric_date, metric_value, target_value, currency)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            metric_value = VALUES(metric_value),
            target_value = VALUES(target_value)
        `,
          [
            event.metric_name,
            event.metric_date,
            event.metric_value,
            event.target_value,
            event.currency || "MYR"
          ]
        );

        console.log("💾 Saved metric:", event.metric_name, event.metric_date);
      } catch (err) {
        console.error("❌ Kafka consumer failed to write to DB:", err);
      }
    }
  });

  console.log("📡 Kafka consumer is running.");
}
