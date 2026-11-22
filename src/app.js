
require("dotenv").config();

const connectDB = require("./config/database");

const express = require("express");
const { handleIncomingMessage } = require("./services/bot.service");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

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


async function processWebhook(body) {
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;

      for (const message of value.messages || []) {
        let customerMessage = "";

        if (message.type === "text") {
          customerMessage = message.text.body;
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
        } else if (
          message.type === "interactive" &&
          message.interactive?.type === "list_reply"
        ) {
          customerMessage = message.interactive.list_reply.id;
        }
        else {
          continue;
        }

        const customerNumber = message.from;

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


connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
});
