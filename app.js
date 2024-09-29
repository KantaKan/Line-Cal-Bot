const express = require("express");
const line = require("@line/bot-sdk");
const mongoose = require("./config/database");
const lineController = require("./controllers/lineController");
require("dotenv").config();

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

app.post("/callback", line.middleware(config), (req, res) => {
  lineController.handleLineEvent(req, res, client);
});

app.listen(process.env.PORT || 3000, () => {
  console.log("App is running!");
});
