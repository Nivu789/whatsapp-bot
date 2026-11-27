const {
    sendWhatsAppTemplate,
} = require("./whatsapp.service");

const Lead = require("../models/lead.model");

const formatTrialDate = (date) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        throw new Error("Invalid trial date.");
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
    }).format(parsedDate);
};

const formatTrialTime = (time) => {
    if (typeof time !== "string") {
        throw new Error("Invalid trial time.");
    }

    const value = time.trim().toUpperCase();

    const match = value.match(
        /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/
    );

    if (!match) {
        throw new Error(`Invalid trial time: ${value}`);
    }

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3];

    if (minutes < 0 || minutes > 59) {
        throw new Error("Invalid trial minutes.");
    }

    // Convert 12-hour format to 24-hour format
    if (period) {
        if (hours < 1 || hours > 12) {
            throw new Error("Invalid trial hours.");
        }

        hours = hours % 12;

        if (period === "PM") {
            hours += 12;
        }
    } else if (hours < 0 || hours > 23) {
        throw new Error("Invalid trial hours.");
    }

    // Convert to display format
    const formattedPeriod = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;

    return `${formattedHours}:${String(minutes).padStart(2, "0")} ${formattedPeriod}`;
};

const getTemplateName = (status) => {
    switch (status) {
        case "confirmed":
            return process.env.WHATSAPP_TRIAL_CONFIRMED_TEMPLATE;

        case "cancelled":
            return process.env.WHATSAPP_TRIAL_CANCELLED_TEMPLATE;

        default:
            throw new Error(
                `Unsupported booking status: ${status}`
            );
    }
};

const sendBookingStatusNotification = async (lead) => {
    if (!lead?.phone || !lead?.name) {
        throw new Error("Invalid booking details.");
    }

    const templateName = getTemplateName(lead.status);

    if (!templateName) {
        throw new Error(
            `WhatsApp template is not configured for ${lead.status}.`
        );
    }

    const parameters = [
        lead.name,
        formatTrialDate(lead.trialDate),
        formatTrialTime(lead.trialTime),
    ];

    const response = await sendWhatsAppTemplate(
        lead.phone.replace(/^\+/, ""),
        templateName,
        parameters
    );

    return {
        success: true,
        templateName,
        messageId: response.messages?.[0]?.id,
    };
};


const processBookingNotification = async (leadId) => {
    // 1. Atomically claim the notification
    const lead = await Lead.findOneAndUpdate(
        {
            _id: leadId,
            status: {
                $in: ["confirmed", "cancelled"],
            },
            "notification.status": "pending",
        },
        {
            $set: {
                "notification.status": "processing",
                "notification.lastAttemptAt": new Date(),
                "notification.lastError": null,
            },
            $inc: {
                "notification.attempts": 1,
            },
        },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!lead) {
        return {
            status: "skipped",
            message: "No pending notification found.",
        };
    }

    let result;

    // 2. Submit the WhatsApp notification
    try {
        result = await sendBookingStatusNotification(lead);
    } catch (error) {
        const httpStatus = error.response?.status;

        // Network failures and server errors may have
        // an uncertain sending outcome.
        const isDefiniteFailure =
            httpStatus >= 400 &&
            httpStatus < 500 &&
            httpStatus !== 408;

        const notificationStatus = isDefiniteFailure
            ? "failed"
            : "unknown";

        const errorMessage =
            error.response?.data?.error?.message ||
            error.message ||
            "Unknown notification error.";

        await Lead.updateOne(
            {
                _id: leadId,
                "notification.status": "processing",
            },
            {
                $set: {
                    "notification.status": notificationStatus,
                    "notification.failedAt": isDefiniteFailure
                        ? new Date()
                        : null,
                    "notification.lastError": errorMessage,
                },
            }
        );

        console.error(
            `Booking notification ${notificationStatus}:`,
            leadId,
            errorMessage
        );

        return {
            status: notificationStatus,
            message: "WhatsApp notification was not confirmed.",
        };
    }

    // 3. Verify that Meta returned a message ID
    if (!result.messageId) {
        await Lead.updateOne(
            {
                _id: leadId,
                "notification.status": "processing",
            },
            {
                $set: {
                    "notification.status": "unknown",
                    "notification.lastError":
                        "Meta did not return a message ID.",
                },
            }
        );

        return {
            status: "unknown",
            message: "Notification outcome could not be verified.",
        };
    }

    // 4. Persist the successful API response
    await Lead.updateOne(
        {
            _id: leadId,
            "notification.status": "processing",
        },
        {
            $set: {
                "notification.status": "accepted",
                "notification.templateName": result.templateName,
                "notification.messageId": result.messageId,
                "notification.acceptedAt": new Date(),
                "notification.lastError": null,
            },
        }
    );

    return {
        status: "accepted",
        messageId: result.messageId,
    };
};


module.exports = {
    sendBookingStatusNotification,
    processBookingNotification,
};