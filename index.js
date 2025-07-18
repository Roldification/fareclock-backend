const express = require("express");
require("dotenv").config();
const { Datastore } = require("@google-cloud/datastore");
const cors = require("cors");
const datastore = new Datastore({
  projectId: "fc-itw-calio",
  databaseId: "fareclock",
});

const app = express();

app.use(cors());
app.use(require("./routes")(datastore)); // for timezone setting
app.use("/user", require("./user-routes")(datastore)); // CRUD for users
app.use("/shift", require("./shift-routes")(datastore)); // CRUD for shifts

module.exports = app;
