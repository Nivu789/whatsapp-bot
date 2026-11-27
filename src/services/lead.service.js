const mongoose = require("mongoose");
const Lead = require("../models/lead.model");

const VALID_STATUSES = ["pending", "confirmed", "cancelled"];

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getLeads = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    status,
    search,
  } = query;

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);

  const limitNumber = Math.min(
    100,
    Math.max(1, parseInt(limit, 10) || 10)
  );

  const skip = (pageNumber - 1) * limitNumber;

  const filter = {};

  // Filter by booking status
  if (status && status !== "all") {
    if (!VALID_STATUSES.includes(status)) {
      throw createError("Invalid booking status", 400);
    }

    filter.status = status;
  }

  // Search by customer name or phone number
  if (typeof search === "string" && search.trim()) {
    const escapedSearch = search
      .trim()
      .slice(0, 100)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filter.$or = [
      {
        name: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        phone: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];
  }

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean(),

    Lead.countDocuments(filter),
  ]);

  return {
    leads,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
};

const getLeadById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid lead ID", 400);
  }

  const lead = await Lead.findById(id).lean();

  if (!lead) {
    throw createError("Lead not found", 404);
  }

  return lead;
};

const updateLeadStatus = async (id, status) => {
  if (!mongoose.isValidObjectId(id)) {
    throw createError("Invalid lead ID", 400);
  }

  if (!["confirmed", "cancelled"].includes(status)) {
    throw createError("Invalid booking status", 400);
  }

const lead = await Lead.findOneAndUpdate(
    {
        _id: id,
        status: "pending",
    },
    {
        $set: {
            status,

            "notification.status": "pending",

            "notification.templateName":
                status === "confirmed"
                    ? process.env.WHATSAPP_TRIAL_CONFIRMED_TEMPLATE
                    : process.env.WHATSAPP_TRIAL_CANCELLED_TEMPLATE,

            "notification.attempts": 0,
            "notification.lastError": null,
        },
    },
    {
        new: true,
        runValidators: true,
    }
);

  if (!lead) {
    const existingLead = await Lead.findById(id);

    if (!existingLead) {
      throw createError("Lead not found", 404);
    }

    throw createError(
      "Only pending bookings can be updated",
      409
    );
  }

  return lead;
};

module.exports = {
  getLeads,
  getLeadById,
  updateLeadStatus,
};