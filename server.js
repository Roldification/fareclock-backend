const app = require("./index");

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Example app running in port: ${port}`);
});
