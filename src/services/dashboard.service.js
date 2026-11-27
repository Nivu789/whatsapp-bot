const Lead = require("../models/lead.model");

const getDashboardStats = async () => {
  const result = await Lead.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = {
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
  };

  for (const item of result) {
    stats.totalBookings += item.count;

    switch (item._id) {
      case "pending":
        stats.pendingBookings = item.count;
        break;

      case "confirmed":
        stats.confirmedBookings = item.count;
        break;

      case "cancelled":
        stats.cancelledBookings = item.count;
        break;
    }
  }

  return stats;
};

module.exports = {
  getDashboardStats,
};