const gym = require("../config/gym");
const {
    sendWhatsAppMessage,
    sendWhatsAppButtons,
} = require("./whatsapp.service");
const Lead = require("../models/lead.model");

const {
    getConversation,
    setConversation,
    clearConversation,
} = require("./conversation.service");



const sendMainMenu = async (from) => {
    await sendWhatsAppButtons(
        from,
        "Welcome to FitZone! 💪\n\nWhat would you like to explore?\n\nYou can also reply 3 for gym timings or 4 for location.",
        [
            { id: "MEMBERSHIP", title: "Membership Plans" },
            { id: "PERSONAL_TRAINING", title: "Personal Training" },
            { id: "FREE_TRIAL", title: "Book Free Trial" },
        ],
        "FitZone Fitness 💪",
        "Choose an option"
    );
};


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
        await sendMainMenu(from);
        return;
    }

    const buttonActions = [
        "membership",
        "personal_training",
        "free_trial",
    ];

    if (buttonActions.includes(normalizedInput)) {
        clearConversation(from);
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
                    // 1. Save booking in MongoDB
                    const lead = await Lead.create({
                        name: conversation.name,
                        phone: from,
                        trialDate: conversation.trialDate,
                        trialTime: input,
                    });

                    clearConversation(from);

                    // 2. Notify gym owner
                    const ownerNumber = process.env.GYM_OWNER_WHATSAPP;

                    if (ownerNumber) {
                        const ownerMessage = `🔔 New Free Trial Request!

🏋️ ${gym.name}

👤 Name: ${lead.name}
📱 Phone: ${lead.phone}
📅 Date: ${lead.trialDate}
⏰ Time: ${lead.trialTime}

Please contact the customer.`;

                        try {
                            await sendWhatsAppMessage(ownerNumber, ownerMessage);
                            console.log("Gym owner notified successfully");
                        } catch (notificationError) {
                            console.error(
                                "Owner notification failed:",
                                notificationError.message
                            );
                        }
                    } else {
                        console.warn("Gym owner WhatsApp number is not configured");
                    }

                    // 3. Confirm booking to customer
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
                        "Sorry, something went wrong. Please try again."
                    );
                }

                return;
        }
    }

    let reply = "";

    switch (normalizedInput) {
        case "membership":
            reply = `💪 Membership Plans

${gym.membership
                    .map((plan) => `${plan.name}: ₹${plan.price}`)
                    .join("\n")}

Reply MENU to go back.`;
            break;

        case "personal_training":
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

        case "free_trial":
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