// server/kafka/producer.js
import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "etl-service",
  brokers: [process.env.KAFKA_BROKER],
  ssl: true,
  sasl: {
    mechanism: "plain",
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD
  }
});

const producer = kafka.producer();
let connected = false;

export async function publishEvent(topic, payload) {
  if (!connected) {
    await producer.connect();
    connected = true;
  }

  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(payload) }],
  });

  console.log(`Kafka → Topic: ${topic} [Event Published]`);
}
