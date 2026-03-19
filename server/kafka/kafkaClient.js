// server/kafka/kafkaClient.js
import { Kafka } from "kafkajs";
import dotenv from "dotenv";

dotenv.config();

const KAFKA_ENV = (process.env.KAFKA_ENV || "local").toLowerCase();

// In Docker, your backend should use kafka:9092 by default
const broker = process.env.KAFKA_BROKER || "kafka:9092";

const config = {
  clientId: process.env.KAFKA_CLIENT_ID || "solar-app",
  brokers: [broker],
};

// Safety guard: prevents accidental Confluent usage in local mode
if (
  KAFKA_ENV === "local" &&
  (process.env.KAFKA_USERNAME || process.env.KAFKA_PASSWORD)
) {
  throw new Error(
    "🚨 Confluent credentials detected while KAFKA_ENV=local. Remove KAFKA_USERNAME/KAFKA_PASSWORD or set KAFKA_ENV=confluent."
  );
}

// Only enable SSL/SASL when explicitly using Confluent
if (KAFKA_ENV === "confluent") {
  if (!process.env.KAFKA_USERNAME || !process.env.KAFKA_PASSWORD) {
    throw new Error(
      "KAFKA_ENV=confluent but KAFKA_USERNAME/KAFKA_PASSWORD is missing."
    );
  }

  config.ssl = true;
  config.sasl = {
    mechanism: "plain",
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  };
}

export const kafka = new Kafka(config);
