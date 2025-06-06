const express = require("express");
const { fromZonedTime } = require("date-fns-tz");
const { parseISO } = require("date-fns");

const { DateTime } = require("luxon");

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

      const shiftKey = datastore.key(["users", parseInt(userId, 10), "shifts"]);

      const startTime = DateTime.fromISO(shiftData.startTime, {
        zone: timezone,
      });
      const endTime = DateTime.fromISO(shiftData.endTime, {
        zone: timezone,
      });

      shiftData.startTime = startTime.toJSDate();
      shiftData.endTime = endTime.toJSDate();

      //   shiftData.startTime = parseISO(
      //     fromZonedTime(new Date(shiftData.startTime), timezone).toISOString()
      //   ).getTime();
      //   shiftData.endTime = parseISO(
      //     fromZonedTime(new Date(shiftData.endTime), timezone).toISOString()
      //   ).getTime();

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
