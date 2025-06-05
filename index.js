const express = require("express");
require("dotenv").config();
const { Datastore } = require("@google-cloud/datastore");

const datastore = new Datastore({
  projectId: "hardy-position-301615",
  databaseId: "fareclock1",
});

const app = express();

app.get("/", async (req, res) => {
  res.send("okay! :D");
});

app.get("/cloud", async (req, res) => {
  const query = datastore.createQuery("users");
  try {
    const [users] = await datastore.runQuery(query);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error?.message });
  }
});

module.exports = app;
