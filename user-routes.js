const { formatISO } = require("date-fns");
const { toZonedTime, format } = require("date-fns-tz");
const express = require("express");
const { formatDatetime } = require("./utilities");

const router = express.Router();

module.exports = (datastore) => {
  router.get("/", async (req, res) => {
    res.send("routes separated!");
  });

  router.get("/get-all", async (req, res) => {
    try {
      const [users] = await datastore.runQuery(datastore.createQuery("users"));
      const usersWithTasks = await Promise.allSettled(
        users.map(async (user) => {
          const userKey = datastore.key([
            "users",
            parseInt(user[datastore.KEY].id, 10),
          ]);
          const query = datastore.createQuery("shifts").hasAncestor(userKey);
          const [shifts] = await datastore.runQuery(query);

          const shiftWithIds = shifts.map((shift) => ({
            ...shift,
            id: Number(shift[datastore.KEY].id),
          }));

          return {
            ...user,
            id: Number(user[datastore.KEY].id),
            shifts: shiftWithIds,
          };
        })
      );

      const result = usersWithTasks
        .map((userResult) => {
          if (userResult.status === "fulfilled") {
            return userResult.value;
          } else {
            console.error("Error fetching tasks for user:", userResult.reason);
            return null; // or handle the error as needed
          }
        })
        .filter((user) => user !== null);

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error?.message });
    }
  });

  router.post("/create", express.json(), async (req, res) => {
    try {
      const userData = req.body;
      const key = datastore.key("users");

      const userEntity = {
        key: key,
        data: {
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
      await datastore.insert(userEntity);
      res.status(201).json({
        id: key?.id ?? 0,
        message: "User created successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put("/update/:id", express.json(), async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const userData = req.body;
      const userKey = datastore.key(["users", userId]);
      const [user] = await datastore.get(userKey);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const updatedUser = {
        ...user,
        ...userData,
        updatedAt: formatISO(toZonedTime(new Date(), "UTC")),
      };
      await datastore.update({
        key: userKey,
        data: updatedUser,
      });
      res.json({ message: "User updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete("/delete/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const userKey = datastore.key(["users", userId]);

      const query = datastore.createQuery("shifts").hasAncestor(userKey);
      const [shifts] = await datastore.runQuery(query);

      const shiftKeys = shifts.map((shift) => shift[datastore.KEY]);
      if (shiftKeys.length > 0) {
        await datastore.delete(shiftKeys);
      }

      await datastore.delete(userKey);
      res.json({
        message: "User along with their shifts deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
