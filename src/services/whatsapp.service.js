
const axios = require("axios");

const sendWhatsAppMessage = async (to, message) => {
    const url = `https://graph.facebook.com/${process.env.GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

    try {
        const response = await axios.post(
            url,
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

module.exports = { sendWhatsAppMessage };
