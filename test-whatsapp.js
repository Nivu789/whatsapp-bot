
require("dotenv").config();
const axios = require("axios");

async function testWhatsApp() {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/${process.env.GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: "919778385740",
        type: "template",
        template: {
          name: "hello_world",
          language: {
            code: "en_US",
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

    console.log("Message sent successfully!");
    console.log(response.data);
  } catch (error) {
    console.error(
      "WhatsApp API Error:",
      error.response?.data || error.message
    );
  }
}

testWhatsApp();
