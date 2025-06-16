const express = require("express");
const { fromZonedTime } = require("date-fns-tz");
const { parseISO } = require("date-fns");

const { DateTime } = require("luxon");
const { validations } = require("./utilities");

const router = express.Router();

module.exports = (datastore) => {
  router.get("/", async (req, res) => {
    res.send("routes separated!");
  });

  router.get("/get-all", async (req, res) => {
    try {
      const [shifts] = await datastore.runQuery(
        datastore.createQuery("shifts")
      );

      return res.json(shifts);
    } catch (error) {
      res.status(500).json({ error: error?.message });
    }
  });

  router.post("/create", express.json(), async (req, res) => {
    try {
      const { userId, timezone = "Asia/Manila", ...shiftData } = req.body;

      const isValidShiftTime = validations.isShiftTimeValid(
        shiftData.startTime,
        shiftData.endTime
      );
      if (!isValidShiftTime) {
        return res.status(400).json({
          error: "Invalid shift time. Start time must be before end time.",
        });
      }

      const shiftKey = datastore.key(["users", parseInt(userId, 10), "shifts"]);

      const startTime = DateTime.fromISO(shiftData.startTime, {
        zone: timezone,
      });

      const endTime = DateTime.fromISO(shiftData.endTime, {
        zone: timezone,
      });

      const startTimeJSDate = startTime.toJSDate();
      const endTimeJSDate = endTime.toJSDate();

      const exceedValidation = await validations.isShiftExceeded(
        datastore,
        datastore.key(["users", parseInt(userId, 10)]),
        startTimeJSDate,
        endTimeJSDate
      );

      // res.json(400, {
      //   error: "Temporarily unavailable",
      // });

      // return;

      if (!exceedValidation) {
        return res.status(400).json({
          error: "Shift exceeds the maximum allowed time for the day",
        });
      }

      const isShiftOverlapping = await validations.isShiftOverlapping(
        datastore,
        datastore.key(["users", parseInt(userId, 10)]),
        startTimeJSDate,
        endTimeJSDate
      );
      if (isShiftOverlapping) {
        return res.status(400).json({
          error: "Shift overlaps with an existing shift",
        });
      }

      shiftData.startTime = startTimeJSDate;
      shiftData.endTime = endTimeJSDate;

      const shiftEntity = {
        key: shiftKey,
        data: {
          ...shiftData,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      await datastore.insert(shiftEntity);
      res.status(201).json({
        id: shiftKey?.id ?? 0,
        ...shiftData,
        message: "Shift created successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error?.message });
    }
  });

  router.put("/update/:id", express.json(), async (req, res) => {
    try {
      const shiftId = parseInt(req.params.id, 10);

      const { userId, ...shiftData } = req.body;

      const shiftKey = datastore.key(["users", userId, "shifts", shiftId]);

      const [existingShift] = await datastore.get(shiftKey);
      if (!existingShift) {
        return res.status(404).json({ error: "Shift not found" });
      }

      shiftData.startTime = new Date(shiftData.startTime);
      shiftData.endTime = new Date(shiftData.endTime);

      const shiftEntity = {
        key: shiftKey,
        data: {
          ...shiftData,
          updatedAt: new Date(),
        },
      };

      await datastore.update(shiftEntity);
      res.status(200).json({
        message: "Shift updated successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error?.message });
    }
  });

  router.delete("/delete/:id/:userId", async (req, res) => {
    try {
      const shiftId = parseInt(req.params.id, 10);
      const userId = parseInt(req.params.userId, 10);

      const shiftKey = datastore.key(["users", userId, "shifts", shiftId]);

      await datastore.delete(shiftKey);
      res.status(200).json({
        message: "Shift deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error?.message });
    }
  });

  return router;
};
