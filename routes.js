const { formatISO } = require("date-fns");
const { toZonedTime, format } = require("date-fns-tz");
const express = require("express");

const router = express.Router();

module.exports = (datastore) => {
  router.get("/", async (req, res) => {
    res.send("latest!");
  });

  router.get("/cloud", async (req, res) => {
    const query = datastore.createQuery("users");
    try {
      const [users] = await datastore.runQuery(query);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error?.message });
    }
  });

  router.post("/users", express.json(), async (req, res) => {
    try {
      // Create a key with the kind 'users'
      const key = datastore.key({
        namespace: "default",
        path: ["users"],
      });

      // Create the entity object with data from request
      const entity = {
        key: key,
        data: {
          name: "ordelyn calio",
          birthday: "1994-10-06",
        }, // assuming req.body contains user properties
      };

      // Save the entity
      await datastore.save(entity);
      console.log("success?");

      res.status(201).json({
        id: entity.key.id,
        message: "User created successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/user-inheritance", async (req, res) => {
    try {
      const key = datastore.key(["users", 5642368648740864, "Task", "task2"]);

      const taskEntity = {
        key: key,
        data: {
          description: "complete project report 2",
          priority: "high",
          dueDate: new Date("2025-06-30"),
          completed: false,
        },
      };

      await datastore.save(taskEntity);
      res.status(201).json({
        id: key?.id ?? 0,
        message: "Task created successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/user-inheritance", async (req, res) => {
    try {
      const userKey = datastore.key(["users", 5642368648740864]);

      const [user] = await datastore.get(userKey);

      const query = datastore.createQuery("Task").hasAncestor(userKey);

      const [tasks] = await datastore.runQuery(query);
      res.json({
        ...user,
        tasks: tasks,
      });
    } catch (error) {
      res.status(500).json({ error: error?.message });
    }
  });

  router.post("/set-timezone", express.json(), async (req, res) => {
    try {
      const query = datastore.createQuery("timezone");
      const [timezoneEntities] = await datastore.runQuery(query);
      let key = datastore.key(["timezone"]);

      const selectedTimezone = req.body?.timezone || "Asia/Manila";
      const timezones = require("./utilities").timezones();

      let currentTimezone = {};

      if (timezoneEntities.length > 0) {
        key = datastore.key([
          "timezone",
          parseInt(timezoneEntities[0][datastore.KEY].id, 10),
        ]);

        const [theTimezone] = await datastore.get(key);

        currentTimezone = theTimezone || {};
      }

      const timezoneEntity = {
        key: key,
        data: {
          ...currentTimezone,
          timezone: selectedTimezone,
          updatedAt: new Date(),
        },
      };

      await datastore.save(timezoneEntity);
      res.status(200).json({
        message: "Timezone set successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/get-timezones", async (req, res) => {
    res.json(require("./utilities").timezones());
  });

  router.get("/get-timezone", async (req, res) => {
    try {
      const query = datastore.createQuery("timezone");
      const [timezoneEntities] = await datastore.runQuery(query);

      if (timezoneEntities.length > 0) {
        const timezone = timezoneEntities[0].timezone || "Asia/Manila";
        return res.json(timezone);
      }

      return res.status(404).json({ error: "Timezone not set" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
