// server/kafka/producer.js
import { kafka } from "./kafkaClient.js";

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
