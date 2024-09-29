const express = require("express");
const line = require("@line/bot-sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

app.post("/callback", line.middleware(config), (req, res) => {
  console.log("Incoming request:", req.body);
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  const foodName = event.message.text;
  const calories = await getCaloriesFromGemini(foodName);

  if (calories) {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: `${foodName} มีประมาณ ${calories} แคลอรี่`,
    });
  } else {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: `ขออภัย ฉันไม่พบข้อมูลแคลอรี่สำหรับ ${foodName}`,
    });
  }
}

async function getCaloriesFromGemini(foodName) {
  try {
    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = client.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent(`ใน ${foodName} มีประมาณกี่แคล ประมาณมาได้เลยไม่ต้องห่วง`);

    const caloriesText = result.response.text();
    console.log(caloriesText);
    const calories = extractCalorieInfo(caloriesText);

    return calories;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
}

function extractCalorieInfo(text) {
  // ... (rest of your code)

  // Match the specific pattern you're looking for
  const match = text.match(/ประมาณ\s*\*\*(\d+(?:-\d+)?)\s*แคลอรี่\*\*/);

  if (match) {
    return match[1]; // Return the captured calorie range
  } else {
    return null; // Or handle the case where the pattern is not found
  }
}

app.listen(process.env.PORT || 3000, () => {
  console.log("App is running!");
});
