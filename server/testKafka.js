import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import { Kafka } from "kafkajs";

async function testProducer() {
  const kafka = new Kafka({
    clientId: "test-producer",
    brokers: [process.env.KAFKA_BROKER],
    ssl: true,
    sasl: {
      mechanism: "plain",
      username: process.env.KAFKA_USERNAME,
      password: process.env.KAFKA_PASSWORD,
    },
  });

  const producer = kafka.producer();

  try {
    console.log("🔌 Connecting to Kafka...");
    await producer.connect();

    console.log("🚀 Sending test message...");
    await producer.send({
      topic: "etl.daily_metrics",
      messages: [
        { value: JSON.stringify({ test: "hello-world", ts: Date.now() }) },
      ],
    });

    console.log("🎉 Test message sent successfully!");
    await producer.disconnect();
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

testProducer();
