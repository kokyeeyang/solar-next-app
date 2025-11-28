import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import { Kafka } from "kafkajs";

async function run() {
  const kafka = new Kafka({
    clientId: "test-consumer",
    brokers: [process.env.KAFKA_BROKER],
    ssl: true,
    sasl: {
      mechanism: "plain",
      username: process.env.KAFKA_USERNAME,
      password: process.env.KAFKA_PASSWORD
    }
  });

  const consumer = kafka.consumer({ groupId: "test-group-1" });

  await consumer.connect();
  await consumer.subscribe({ topic: "etl.daily_metrics", fromBeginning: true });

  console.log("Listening for messages...");
  
  await consumer.run({
    eachMessage: async ({ message }) => {
      console.log("Received:", message.value.toString());
    }
  });
}

run().catch(console.error);
