const gym = require("../config/gym");
const { sendWhatsAppMessage } = require("./whatsapp.service");
const Lead = require("../models/lead.model");

const {
  getConversation,
  setConversation,
  clearConversation,
} = require("./conversation.service");

const menu = `Hi! Welcome to ${gym.name} 💪

How can we help you today?

1️⃣ Membership plans
2️⃣ Personal training
3️⃣ Gym timings
4️⃣ Gym location
5️⃣ Book a free trial

Reply with a number to continue.`;

const handleIncomingMessage = async (from, message) => {
  const input = message.trim();

  if (!input) {
    await sendWhatsAppMessage(from, "Please enter a message.");
    return;
  }

  const normalizedInput = input.toLowerCase();

  // Allow customers to return to the main menu anytime.
  if (["menu", "hi", "hello", "hey"].includes(normalizedInput)) {
    clearConversation(from);
    await sendWhatsAppMessage(from, menu);
    return;
  }

  // Check whether the customer is already in a conversation.
  const conversation = getConversation(from);

  if (conversation) {
    switch (conversation.step) {
      case "name":
        setConversation(from, {
          ...conversation,
          name: input,
          step: "date",
        });

        await sendWhatsAppMessage(
          from,
          `Nice to meet you, ${input}! 😊\n\nWhat date would you prefer for your free trial?`
        );
        return;

      case "date":
        setConversation(from, {
          ...conversation,
          trialDate: input,
          step: "time",
        });

        await sendWhatsAppMessage(
          from,
          "What time would you prefer for your free trial?"
        );
        return;

      case "time":
        try {
          const lead = await Lead.create({
            name: conversation.name,
            phone: from,
            trialDate: conversation.trialDate,
            trialTime: input,
          });

          clearConversation(from);

          await sendWhatsAppMessage(
            from,
            `🎉 Thank you, ${lead.name}!

Your free trial request has been received.

📅 Date: ${lead.trialDate}
⏰ Time: ${lead.trialTime}

Our team will contact you shortly!

Reply MENU to explore more services.`
          );
        } catch (error) {
          console.error("Lead creation failed:", error.message);

          await sendWhatsAppMessage(
            from,
            "Sorry, we couldn't save your booking right now. Please try again in a moment."
          );
        }

        return;
    }
  }

  let reply = "";

  switch (normalizedInput) {
    case "1":
      reply = `💪 Membership Plans

${gym.membership
  .map((plan) => `${plan.name}: ₹${plan.price}`)
  .join("\n")}

Reply MENU to go back.`;
      break;

    case "2":
      reply = `🏋️ Personal Training

Our services include:
${gym.services.join("\n")}

Contact us to know more!

Reply MENU to go back.`;
      break;

    case "3":
      reply = `⏰ Gym Timings

Monday - Saturday:
${gym.timings.weekdays}

Sunday:
${gym.timings.sunday}

Reply MENU to go back.`;
      break;

    case "4":
      reply = `📍 Our Location

${gym.location}

Contact: ${gym.contact}

Reply MENU to go back.`;
      break;

    case "5":
      setConversation(from, {
        step: "name",
      });

      reply = `🎉 Great choice!

We'd love to arrange a free trial session.

What is your name?`;
      break;

    default:
      reply = `Sorry, I didn't understand that.

Please reply with a number from 1 to 5, or type MENU.`;
  }

  await sendWhatsAppMessage(from, reply);
};

module.exports = { handleIncomingMessage };