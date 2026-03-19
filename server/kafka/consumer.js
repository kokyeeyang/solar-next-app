// server/kafka/consumers/metricConsumer.js
import { kafka } from "../kafkaClient.js";
import { reportingDB } from "../../db/connection.js";

const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID || "etl-mysql-writer-group",
});

export async function initMetricConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topic: process.env.KAFKA_METRICS_TOPIC || "etl.daily_metrics",
    fromBeginning: false,
  });

  console.log("📥 Kafka → MySQL Consumer running...");

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value.toString());

        await reportingDB.query(
          `
          INSERT INTO daily_metrics (
            metric_name,
            metric_date,
            metric_value,
            target_value,
            currency
          )
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            metric_value = VALUES(metric_value),
            target_value = VALUES(target_value),
            currency     = VALUES(currency)
        `,
          [
            event.metric_name,
            event.metric_date,
            event.metric_value,
            event.target_value,
            event.currency,
          ]
        );

        console.log(
          `🟢 Upserted → ${event.metric_name} @ ${event.metric_date} = ${event.metric_value}`
        );
      } catch (err) {
        console.error("❌ Failed to write metric to MySQL:", err);
      }
    },
  });
}
