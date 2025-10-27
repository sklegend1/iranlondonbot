"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors = require("cors");
const adRoutes_1 = __importDefault(require("./routes/adRoutes"));
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middlewares
app.use(cors());
app.use(express_1.default.json());
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
app.use("/ads", adRoutes_1.default);
