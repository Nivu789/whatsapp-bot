
const validateTrialDate = (input) => {
  // Expected format: YYYY-MM-DD
  const dateFormat = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateFormat.test(input)) {
    return {
      valid: false,
      message: "Please enter a date in YYYY-MM-DD format.\nExample: 2026-11-25",
    };
  }

  const [year, month, day] = input.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  // Reject impossible dates such as February 30
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return {
      valid: false,
      message: "That date doesn't exist. Please enter a valid date.",
    };
  }

  // Compare calendar dates in the gym's local timezone (India)
  const todayInIndia = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const [todayYear, todayMonth, todayDay] =
    todayInIndia.split("-").map(Number);

  const today = Date.UTC(todayYear, todayMonth - 1, todayDay);
  const selectedDate = Date.UTC(year, month - 1, day);

  if (selectedDate < today) {
    return {
      valid: false,
      message: "You cannot book a trial for a past date. Please choose a future date or today.",
    };
  }

  return {
    valid: true,
    value: input,
  };
};



const validateTrialTime = (input, trialDate) => {
  // Expected format: HH:MM (24-hour)
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input)) {
    return {
      valid: false,
      message:
        "Please enter a valid time in HH:MM format.\nExample: 17:30",
    };
  }

  const [year, month, day] = trialDate.split("-").map(Number);
  const [hour, minute] = input.split(":").map(Number);

  const selectedDate = new Date(Date.UTC(year, month - 1, day));
  const isSunday = selectedDate.getUTCDay() === 0;

  // Gym opening hours
  const openingMinutes = isSunday ? 6 * 60 : 5 * 60;
  const closingMinutes = isSunday ? 12 * 60 : 22 * 60;

  const selectedMinutes = hour * 60 + minute;

  if (
    selectedMinutes < openingMinutes ||
    selectedMinutes >= closingMinutes
  ) {
    return {
      valid: false,
      message: isSunday
        ? "On Sundays, trials must be between 06:00 and 12:00."
        : "Monday to Saturday, trials must be between 05:00 and 22:00.",
    };
  }

  // Compare against current time in India
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const getPart = (type) =>
    Number(parts.find((part) => part.type === type).value);

  const currentDate = [
    getPart("year"),
    String(getPart("month")).padStart(2, "0"),
    String(getPart("day")).padStart(2, "0"),
  ].join("-");

  const currentMinutes =
    getPart("hour") * 60 + getPart("minute");

  if (
    trialDate < currentDate ||
    (trialDate === currentDate &&
      selectedMinutes <= currentMinutes)
  ) {
    return {
      valid: false,
      message:
        "That time has already passed. Please select a future time.",
    };
  }

  return {
    valid: true,
    value: input,
  };
};



module.exports = { validateTrialDate, validateTrialTime, };
