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
    const client = new GoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const model = client.generativeModel("models/gemini-1.5-flash"); // Get the model

    const response = await model.generateContent({
      // Use generateContent
      prompt: `What are the calories in ${foodName} (Thai: ${foodName})?`,
    });

    console.log("Gemini API response:", response);

    const calories = extractCaloriesFromThaiResponse(response.result);
    return calories;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
}

function extractCaloriesFromThaiResponse(responseText) {
  // Example using a regular expression (this might need adjustments)
  const calorieMatch = responseText.match(/(\d+)\s*calories?/i);
  if (calorieMatch) {
    return parseInt(calorieMatch[1], 10);
  } else {
    return null; // Or handle the case where calories aren't found
  }
}

function convertThaiNumeralsToArabic(thaiNumerals) {
  const thaiDigits = "๐๑๒๓๔๕๖๗๘๙";
  let arabicNumerals = "";
  for (let i = 0; i < thaiNumerals.length; i++) {
    const digit = thaiDigits.indexOf(thaiNumerals[i]);
    if (digit !== -1) {
      arabicNumerals += digit;
    } else {
      arabicNumerals += thaiNumerals[i];
    }
  }
  return arabicNumerals;
}

app.listen(process.env.PORT || 3000, () => {
  console.log("App is running!");
});
