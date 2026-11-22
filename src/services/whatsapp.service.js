
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

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppButtons,
};
