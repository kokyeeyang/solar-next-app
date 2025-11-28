import { kafka } from "../kafkaClient.js";

const producer = kafka.producer();

export async function initMetricProducer() {
  await producer.connect();
  console.log("🚀 Kafka metric producer connected");
}

export async function publishMetricEvent(event) {
  try {
    await producer.send({
      topic: "etl.daily_metrics",
      messages: [{ value: JSON.stringify(event) }]
    });
  } catch (err) {
    console.error("❌ Failed to publish Kafka metric event:", err);
  }
}
