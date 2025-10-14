import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jobsToCvsSentRouter from "./routes/jobsToCvsSent.js";
import unfilledAJobsRouter from "./routes/unfilledAJobs.js";
import { connectDB } from "./db/connection.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Test database connection at startup
await connectDB();

// API routes
app.use("/api/jobs-to-cvs-sent", jobsToCvsSentRouter);
app.use("/api/unfilled-a-jobs", unfilledAJobsRouter);

// Healthcheck
app.get("/", (req, res) => res.send("Backend running 🚀"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
