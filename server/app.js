import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import jobsToCvsSentRouter from "./routes/jobsToCvsSent.js";
import unfilledAJobsRouter from "./routes/unfilledAJobs.js";
import candidateCallsRouter from "./routes/candidateCalls.js";
import candidatesAddedRouter from "./routes/candidatesAdded.js";
import jobsAddedRouter from "./routes/jobsAdded.js";
import dashboardLayoutRouter from "./routes/dashboardLayout.js";

import { initMetricProducer } from "./kafka/producers/metricProducer.js";
import { initMetricConsumer } from "./kafka/consumers/metricConsumer.js";

dotenv.config({ path: "../.env" });

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/jobs-to-cvs-sent", jobsToCvsSentRouter);
app.use("/api/unfilled-a-jobs", unfilledAJobsRouter);
app.use("/api/candidatecalls", candidateCallsRouter);
app.use("/api/candidatesadded", candidatesAddedRouter);
app.use("/api/jobsadded", jobsAddedRouter);
app.use("/api/dashboard-layout", dashboardLayoutRouter);

// Healthcheck
app.get("/", (req, res) => res.send("Backend running 🚀"));

// 🟢 Start Express FIRST
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // 🟣 Then init Kafka in the background
  try {
    await initMetricProducer();
    await initMetricConsumer();
    console.log("Kafka producer & consumer initialized successfully");
  } catch (err) {
    console.error("❌ Failed to initialize Kafka:", err);
  }
});
