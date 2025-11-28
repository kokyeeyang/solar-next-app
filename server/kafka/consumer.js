// server/kafka/consumers/metricConsumer.js
import { Kafka } from "kafkajs";
import { reportingDB } from "../../db/connection.js";

const kafka = new Kafka({
  clientId: "etl-mysql-writer",
  brokers: [process.env.KAFKA_BROKER],
  ssl: true,
  sasl: {
    mechanism: "plain",
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  },
});

const consumer = kafka.consumer({ groupId: "etl-mysql-writer-group" });

export async function initMetricConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topic: "etl.daily_metrics",
    fromBeginning: false,
  });

  console.log("📥 Kafka → MySQL Consumer running...");

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const event = JSON.parse(message.value.toString());

        // Expected event shape:
        // {
        //   metric_name: "candidatecalls",
        //   metric_date: "2025-11-28",
        //   metric_value: 12,
        //   target_value: 15,
        //   currency: "MYR"
        // }

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
