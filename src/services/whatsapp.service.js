const axios = require("axios");

const getWhatsAppUrl = () =>
    `https://graph.facebook.com/${process.env.GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

// Centralized WhatsApp API request
const sendWhatsAppPayload = async (payload) => {
    try {
        const response = await axios.post(
            getWhatsAppUrl(),
            {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                ...payload,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json",
                },
                timeout: 15000,
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

// Send text message
const sendWhatsAppMessage = async (to, message) => {
    return sendWhatsAppPayload({
        to,
        type: "text",
        text: {
            body: message,
        },
    });
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
        throw new Error(
            "WhatsApp supports 1 to 3 reply buttons per message."
        );
    }

    return sendWhatsAppPayload({
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
    });
};

// Send interactive list
const sendWhatsAppList = async (
    to,
    bodyText,
    sections,
    buttonText = "View Options",
    headerText = "Gym Information",
    footerText = "Choose an option"
) => {
    return sendWhatsAppPayload({
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
    });
};

// Send gym carousel
const sendWhatsAppCarousel = async (to) => {
    const imageHandles = [
        process.env.WHATSAPP_MEMBERSHIP_IMAGE_ID,
        process.env.WHATSAPP_TRAINING_IMAGE_ID,
        process.env.WHATSAPP_TRIAL_IMAGE_ID,
    ];

    if (imageHandles.some((id) => !id)) {
        throw new Error(
            "Missing WhatsApp carousel media IDs."
        );
    }

    const buttonPayloads = [
        "MEMBERSHIP",
        "PERSONAL_TRAINING",
        "FREE_TRIAL",
    ];

    return sendWhatsAppPayload({
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

                    cards: imageHandles.map(
                        (handle, cardIndex) => ({
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
                                            payload:
                                                buttonPayloads[
                                                    cardIndex
                                                ],
                                        },
                                    ],
                                },
                            ],
                        })
                    ),
                },
            ],
        },
    });
};

// Send reusable WhatsApp template
const sendWhatsAppTemplate = async (
    to,
    templateName,
    parameters = [],
    language =
        process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US"
) => {
    if (!to || !templateName) {
        throw new Error(
            "Recipient and template name are required."
        );
    }

    if (!Array.isArray(parameters)) {
        throw new Error(
            "Template parameters must be an array."
        );
    }

    const template = {
        name: templateName,

        language: {
            code: language,
        },
    };

    if (parameters.length > 0) {
        template.components = [
            {
                type: "body",

                parameters: parameters.map((value) => ({
                    type: "text",
                    text: String(value),
                })),
            },
        ];
    }

    return sendWhatsAppPayload({
        to,
        type: "template",
        template,
    });
};

module.exports = {
    sendWhatsAppMessage,
    sendWhatsAppButtons,
    sendWhatsAppList,
    sendWhatsAppCarousel,
    sendWhatsAppTemplate,
};