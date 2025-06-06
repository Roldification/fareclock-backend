const { parseISO, parse } = require("date-fns");
const { format } = require("date-fns-tz");

function timezones() {
  return [
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "America/New_York" },
    { value: "Europe/London", label: "Europe/London" },
    { value: "Asia/Tokyo", label: "Asia/Tokyo" },
    { value: "Australia/Sydney", label: "Australia/Sydney" },
    { value: "Asia/Manila", label: "Asia/Manila" },
    { value: "Europe/Berlin", label: "Europe/Berlin" },
    { value: "America/Los_Angeles", label: "America/Los_Angeles" },
    { value: "America/Chicago", label: "America/Chicago" },
    { value: "Asia/Kolkata", label: "Asia/Kolkata" },
    { value: "Pacific/Auckland", label: "Pacific/Auckland" },
    { value: "Europe/Moscow", label: "Europe/Moscow" },
    { value: "Africa/Johannesburg", label: "Africa/Johannesburg" },
    { value: "America/Sao_Paulo", label: "America/Sao_Paulo" },
    { value: "Asia/Dubai", label: "Asia/Dubai" },
    // Add more timezones as needed
  ];
}

function formatDatetime(date, timezone = "Asia/Tokyo") {
  return format(date, "yyyy-MM-dd HH:mm:ss zzz", {
    timeZone: timezone,
  });
}

module.exports = {
  timezones,
  formatDatetime,
};
