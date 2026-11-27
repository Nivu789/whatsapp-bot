require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/database");
const { handleIncomingMessage } = require("./services/bot.service");

const authRoutes = require("./routes/auth.routes");
const leadRoutes = require("./routes/lead.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const {
  errorHandler,
  notFound,
} = require("./middlewares/error.middleware");

const app = express();

const PORT = process.env.PORT || 5000;

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// CSRF protection for dashboard APIs
app.use("/api", (req, res, next) => {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];

  if (safeMethods.includes(req.method)) {
    return next();
  }

  if (
    !process.env.FRONTEND_URL ||
    req.get("origin") !== process.env.FRONTEND_URL
  ) {
    return res.status(403).json({
      success: false,
      message: "Invalid request origin",
    });
  }

  next();
});

// Dashboard API routes
app.use("/api/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 1. Meta webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    console.log("Webhook verified!");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// 2. Receive incoming WhatsApp events
app.post("/webhook", (req, res) => {
  res.sendStatus(200);

  processWebhook(req.body).catch((error) => {
    console.error("Webhook processing error:", error);
  });
});

// 3. Process incoming WhatsApp messages
async function processWebhook(body) {
  for (const entry of body?.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;

      for (const message of value?.messages || []) {
        let customerMessage = "";

        if (message.type === "text") {
          customerMessage = message.text?.body;
        } else if (
          message.type === "interactive" &&
          message.interactive?.type === "button_reply"
        ) {
          customerMessage = message.interactive.button_reply.id;
        } else if (
          message.type === "interactive" &&
          message.interactive?.type === "list_reply"
        ) {
          customerMessage = message.interactive.list_reply.id;
        } else if (message.type === "button") {
          customerMessage =
            message.button?.payload || message.button?.text;
        } else {
          continue;
        }

        const customerNumber = message.from;

        if (!customerNumber || !customerMessage) {
          continue;
        }

        console.log("Incoming WhatsApp message:", {
          from: customerNumber,
          type: message.type,
        });

        await handleIncomingMessage(
          customerNumber,
          customerMessage
        );
      }
    }
  }
}

// Handle undefined routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
connectDB()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });