const gym = require("../config/gym");
const {
    sendWhatsAppMessage,
    sendWhatsAppButtons,
    sendWhatsAppList,
    sendWhatsAppCarousel,
} = require("./whatsapp.service");
const Lead = require("../models/lead.model");

const {
    getConversation,
    setConversation,
    clearConversation,
} = require("./conversation.service");

const { validateTrialDate, validateTrialTime, } = require("./validation.service");



const sendMainMenu = async (from) => {
    await sendWhatsAppButtons(
        from,
        "Welcome to FitZone! 💪\n\nWhat would you like to explore?\n\n✨ Type EXPLORE to view our interactive fitness carousel.\n📋 Type MORE for gym information.",
        [
            { id: "MEMBERSHIP", title: "Membership Plans" },
            { id: "PERSONAL_TRAINING", title: "Personal Training" },
            { id: "FREE_TRIAL", title: "Book Free Trial" },
        ],
        "FitZone Fitness 💪",
        "Choose an option"
    );
};


const sendInformationList = async (from) => {
    await sendWhatsAppList(
        from,
        "What information would you like to know about FitZone?",
        [
            {
                title: "Gym Information",
                rows: [
                    {
                        id: "GYM_TIMINGS",
                        title: "Gym Timings",
                        description: "Check our opening hours",
                    },
                    {
                        id: "GYM_LOCATION",
                        title: "Gym Location",
                        description: "Find where we are located",
                    },
                    {
                        id: "GYM_CONTACT",
                        title: "Contact Details",
                        description: "Get our contact number",
                    },
                    {
                        id: "GYM_FAQ",
                        title: "Common Questions",
                        description: "Get answers to gym FAQs",
                    },
                ],
            },
        ],
        "View Information",
        "FitZone Fitness 💪",
        "We're happy to help!"
    );
};



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

    if (["more", "more info", "information"].includes(normalizedInput)) {
        clearConversation(from);
        await sendInformationList(from);
        return;
    }

    if (["explore", "carousel"].includes(normalizedInput)) {
        clearConversation(from);

        await sendWhatsAppCarousel(from);
        return;
    }

    // if (["explore", "carousel"].includes(normalizedInput)) {
    //     await sendWhatsAppMessage(
    //         from,
    //         "🚧 Our interactive fitness carousel is coming soon! Type MENU to explore our services."
    //     );
    //     return;
    // }

    const buttonActions = [
        "membership",
        "personal_training",
        "free_trial",
        "gym_timings",
        "gym_location",
        "gym_contact",
        "gym_faq",
    ];

    if (buttonActions.includes(normalizedInput)) {
        clearConversation(from);
    }

    // Check whether the customer is already in a conversation.
    const conversation = getConversation(from);

    if (conversation) {
        switch (conversation.step) {
            case "name":
                if (
                    input.length < 2 ||
                    input.length > 60 ||
                    !/^[\p{L}\p{M} .'-]+$/u.test(input)
                ) {
                    await sendWhatsAppMessage(
                        from,
                        "Please enter a valid name (2–60 characters, using letters)."
                    );
                    return;
                }
                setConversation(from, {
                    ...conversation,
                    name: input,
                    step: "date",
                });

                await sendWhatsAppMessage(
                    from,
                    `Nice to meet you, ${input}! 😊\n\nWhat date would you prefer for your free trial?\n\nPlease enter YYYY-MM-DD.\nExample: 2026-11-25`
                );
                return;


            case "date": {
                const validation = validateTrialDate(input);

                if (!validation.valid) {
                    await sendWhatsAppMessage(from, validation.message);
                    return;
                }

                setConversation(from, {
                    ...conversation,
                    trialDate: validation.value,
                    step: "time",
                });

                await sendWhatsAppMessage(
                    from,
                    "Great! ⏰ What time would you prefer?\n\nPlease enter the time in HH:MM format (24-hour clock).\nExample: 17:30"
                );

                return;
            }


            case "time": {
                const validation = validateTrialTime(
                    input,
                    conversation.trialDate
                );

                if (!validation.valid) {
                    await sendWhatsAppMessage(from, validation.message);
                    return;
                }

                try {
                    // 1. Save booking in MongoDB
                    const lead = await Lead.create({
                        name: conversation.name,
                        phone: from,
                        trialDate: conversation.trialDate,
                        trialTime: validation.value,
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
    }

    let reply = "";

    switch (normalizedInput) {
        case "membership":
        case "1":
            reply = `💪 Membership Plans

${gym.membership
                    .map((plan) => `${plan.name}: ₹${plan.price}`)
                    .join("\n")}

Reply MENU to go back.`;
            break;

        case "personal_training":
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

        case "free_trial":
        case "5":
            setConversation(from, {
                step: "name",
            });

            reply = `🎉 Great choice!

We'd love to arrange a free trial session.

What is your name?`;
            break;

        case "gym_timings":
            reply = `⏰ Gym Timings

Monday - Saturday:
${gym.timings.weekdays}

Sunday:
${gym.timings.sunday}`;
            break;

        case "gym_location":
            reply = `📍 Our Location

${gym.location}`;
            break;

        case "gym_contact":
            reply = `📞 Contact FitZone

${gym.contact}`;
            break;

        case "gym_faq":
            reply = `❓ Frequently Asked Questions

1. What are your gym timings?
${gym.timings.weekdays}

2. Do you offer personal training?
Yes! We offer personal training.

3. Can I book a free trial?
Yes! Type MENU to book one.`;
            break;

        default:
            reply = `Sorry, I didn't understand that.

Type MENU to see the main options or MORE to explore additional information.`;
    }

    await sendWhatsAppMessage(from, reply);
};

module.exports = { handleIncomingMessage };