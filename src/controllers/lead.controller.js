const leadService = require("../services/lead.service");
const {
    processBookingNotification,
} = require("../services/booking-notification.service");

const getLeads = async (req, res, next) => {
  try {
    const result = await leadService.getLeads(req.query);

    return res.status(200).json({
      success: true,
      data: result.leads,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lead = await leadService.getLeadById(id);

    return res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

const updateLeadStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // 1. Update booking and queue notification
        const lead = await leadService.updateLeadStatus(
            id,
            status
        );

        let notification;

        // 2. Process the persisted notification
        try {
            notification = await processBookingNotification(
                lead._id
            );
        } catch (error) {
            console.error(
                "Notification processing error:",
                lead._id,
                error.message
            );

            notification = {
                status: "unknown",
                message:
                    "Booking updated, but notification processing could not be verified.",
            };
        }

        // 3. Retrieve the latest booking document
        let updatedLead = lead;

        try {
            updatedLead = await leadService.getLeadById(id);
        } catch (error) {
            console.error(
                "Unable to retrieve updated notification:",
                error.message
            );
        }

        // 4. Return response
        return res.status(200).json({
            success: true,
            message:
                status === "confirmed"
                    ? "Booking confirmed successfully"
                    : "Booking cancelled successfully",
            data: updatedLead,
            notification,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
  getLeads,
  getLeadById,
  updateLeadStatus,
};