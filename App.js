const express = require("express");
const app = express();

require("dotenv").config();

app.get("/", (req, res) => {
  res.send("Node is Running on Backend at 8000 port");
});

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log("Backend is up and running on port ${port}");
});
