
const axios = require("axios");

const getWhatsAppUrl = () =>
    `https://graph.facebook.com/${process.env.GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

const sendWhatsAppMessage = async (to, message) => {
    try {
        const response = await axios.post(
            getWhatsAppUrl(),
            {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to,
                type: "text",
                text: {
                    body: message,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error(
            "WhatsApp API error:",
            error.response?.data || error.message
        );
        throw error;
    }
};

// Send interactive reply buttons
const sendWhatsAppButtons = async (
    to,
    bodyText,
    buttons,
    headerText = "",
    footerText = ""
) => {
    if (buttons.length < 1 || buttons.length > 3) {
        throw new Error("WhatsApp supports 1 to 3 reply buttons per message.");
    }

    const response = await axios.post(
        getWhatsAppUrl(),
        {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "interactive",
            interactive: {
                type: "button",
                ...(headerText && {
                    header: {
                        type: "text",
                        text: headerText,
                    },
                }),
                body: {
                    text: bodyText,
                },
                ...(footerText && {
                    footer: {
                        text: footerText,
                    },
                }),
                action: {
                    buttons: buttons.map((button) => ({
                        type: "reply",
                        reply: {
                            id: button.id,
                            title: button.title,
                        },
                    })),
                },
            },
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                "Content-Type": "application/json",
            },
        }
    );

    return response.data;
};



const sendWhatsAppList = async (
    to,
    bodyText,
    sections,
    buttonText = "View Options",
    headerText = "Gym Information",
    footerText = "Choose an option"
) => {
    const url = `https://graph.facebook.com/${process.env.GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const response = await axios.post(
        url,
        {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "interactive",
            interactive: {
                type: "list",
                header: {
                    type: "text",
                    text: headerText,
                },
                body: {
                    text: bodyText,
                },
                footer: {
                    text: footerText,
                },
                action: {
                    button: buttonText,
                    sections,
                },
            },
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                "Content-Type": "application/json",
            },
        }
    );

    return response.data;
};



const sendWhatsAppCarousel = async (to) => {
    const imageHandles = [
        process.env.WHATSAPP_MEMBERSHIP_IMAGE_ID,
        process.env.WHATSAPP_TRAINING_IMAGE_ID,
        process.env.WHATSAPP_TRIAL_IMAGE_ID,
    ];

    if (imageHandles.some((id) => !id)) {
        throw new Error("Missing WhatsApp carousel media IDs.");
    }

    if (!Array.isArray(imageHandles) || imageHandles.length !== 3) {
        throw new Error("Three carousel image handles are required.");
    }

    try {
        const response = await axios.post(
            getWhatsAppUrl(),
            {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to,
                type: "template",
                template: {
                    name: "fitzone_gym_carousel",
                    language: {
                        code: "en_US",
                    },
                    components: [
                        {
                            type: "carousel",
                            cards: imageHandles.map((handle, cardIndex) => ({
                                card_index: cardIndex,
                                components: [
                                    {
                                        type: "header",
                                        parameters: [
                                            {
                                                type: "image",
                                                image: {
                                                    id: handle,
                                                },
                                            },
                                        ],
                                    },
                                    {
                                        type: "button",
                                        sub_type: "quick_reply",
                                        index: "0",
                                        parameters: [
                                            {
                                                type: "payload",
                                                payload: [
                                                    "MEMBERSHIP",
                                                    "PERSONAL_TRAINING",
                                                    "FREE_TRIAL",
                                                ][cardIndex],
                                            },
                                        ],
                                    },
                                ],
                            })),
                        },
                    ],
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error(
            "WhatsApp carousel error:",
            error.response?.data || error.message
        );
        throw error;
    }
};


module.exports = {
    sendWhatsAppMessage,
    sendWhatsAppButtons,
    sendWhatsAppList,
    sendWhatsAppCarousel,
};
