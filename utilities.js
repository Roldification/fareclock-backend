const { PropertyFilter } = require("@google-cloud/datastore");
const { parseISO, parse } = require("date-fns");
const { format } = require("date-fns-tz");
const { DateTime } = require("luxon");

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

const validations = {
  isShiftTimeValid: (startTime, endTime) => {
    if (!startTime || !endTime) {
      return false;
    }
    const start = parseISO(startTime);
    const end = parseISO(endTime);
    return start < end;
  },
  isShiftExceeded: async (datastore, timezone, userKey, startDate, endDate) => {
    try {
      startDate = DateTime.fromISO(startDate, { zone: timezone });
      endDate = DateTime.fromISO(endDate, { zone: timezone });

      const dayStart = startDate.startOf("day");

      const dayEnd = startDate.endOf("day");

      console.log("day start 1:", startDate, dayStart.toJSDate());
      console.log("day end 1:", startDate, dayEnd.toJSDate());

      const query = datastore
        .createQuery("shifts")
        .hasAncestor(userKey)
        .filter(new PropertyFilter("startTime", ">=", dayStart.toJSDate()))
        .filter(new PropertyFilter("startTime", "<=", dayEnd.toJSDate()));

      const [shifts] = await datastore.runQuery(query);

      let totalTimeInHours = 0;

      for (const shift of shifts) {
        const start = DateTime.fromJSDate(shift.startTime);
        const end = DateTime.fromJSDate(shift.endTime);

        const diffInMinutes = end.diff(start, "minutes").minutes;

        totalTimeInHours += diffInMinutes / 60;
      }

      const start = startDate;
      const end = endDate;
      const diffInMinutes2 = end.diff(start, "minutes").minutes;

      totalTimeInHours += diffInMinutes2 / 60;

      console.log(`Total time in hours for user: ${totalTimeInHours}`);

      if (Number(totalTimeInHours) > 12) return false;

      return true;
    } catch (error) {
      console.error("Error checking shift exceedance:", error);
      return false;
    }
  },
  isShiftOverlapping: async (datastore, userKey, startDate, endDate) => {
    try {
      const query = datastore
        .createQuery("shifts")
        .hasAncestor(userKey)
        .filter(new PropertyFilter("startTime", "<=", endDate))
        .filter(new PropertyFilter("endTime", ">=", startDate));

      const [shifts] = await datastore.runQuery(query);

      return shifts.length > 0;
    } catch (error) {
      console.error("Error checking shift overlap:", error);
      return false;
    }
  },
  isValidTimezone: (timezone) => {
    const validTimezones = timezones().map((tz) => tz.value);
    return validTimezones.includes(timezone);
  },
};

module.exports = {
  timezones,
  formatDatetime,
  validations,
};
