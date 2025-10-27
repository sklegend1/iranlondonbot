import cors = require("cors");

import adRoutes from "./routes/adRoutes";
import express from "express";
import dotenv from "dotenv";


dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ads routes
app.use("/ads", adRoutes);
