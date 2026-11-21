
const gym = require("../config/gym");
const { sendWhatsAppMessage } = require("./whatsapp.service");

const menu = `Hi! Welcome to ${gym.name} 💪

How can we help you today?

1️⃣ Membership plans
2️⃣ Personal training
3️⃣ Gym timings
4️⃣ Gym location
5️⃣ Book a free trial

Reply with a number to continue.`;

const handleIncomingMessage = async (from, message) => {
  const input = message.trim().toLowerCase();

  let reply = "";

  switch (input) {
    case "hi":
    case "hello":
    case "hey":
    case "menu":
      reply = menu;
      break;

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
      reply = `🎉 Great choice!

We'd love to arrange a free trial session.

Please reply with your name to get started.`;
      break;

    default:
      reply = `Sorry, I didn't understand that.

Please reply with a number from 1 to 5, or type MENU.`;
  }

  await sendWhatsAppMessage(from, reply);
};

module.exports = { handleIncomingMessage };
