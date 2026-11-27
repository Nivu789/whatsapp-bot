const mongoose = require("mongoose");


const notificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "not_required",
        "pending",
        "processing",
        "accepted",
        "sent",
        "delivered",
        "read",
        "failed",
        "unknown",
      ],
      default: "not_required",
    },

    templateName: {
      type: String,
      default: null,
    },

    messageId: {
      type: String,
      default: null,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastAttemptAt: {
      type: Date,
      default: null,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    readAt: {
      type: Date,
      default: null,
    },

    failedAt: {
      type: Date,
      default: null,
    },

    lastError: {
      type: String,
      default: null,
    },
  },
  {
    _id: false,
  }
);


const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
    },

    trialDate: {
      type: String,
      required: true,
    },

    trialTime: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    notification: {
      type: notificationSchema,
      default: () => ({}),
    },
  },

  {
    timestamps: true,
  }
);


leadSchema.index({
    "notification.messageId": 1,
});

leadSchema.index({
    "notification.status": 1,
    "notification.lastAttemptAt": 1,
});


module.exports = mongoose.model("Lead", leadSchema);