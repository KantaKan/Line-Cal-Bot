const express = require("express");
const line = require("@line/bot-sdk");
const { GenerativeLanguageClient } = require("@google-ai/generativelanguage");
require("dotenv").config();

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

app.post("/callback", line.middleware(config), (req, res) => {
  console.log("Incoming request:", req.body);

  // Ensure events are available in the request body
  if (!req.body || !req.body.events) {
    console.error("Invalid request body:", req.body);
    return res.status(400).end();
  }

  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error("Error processing events:", err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  console.log("Handling event:", event);
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  const foodName = event.message.text;

  try {
    const calories = await getCaloriesFromGemini(foodName);
    console.log(`Calories for ${foodName}:`, calories);

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
  } catch (error) {
    console.error("Error handling event:", error);
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: `เกิดข้อผิดพลาดในการดึงข้อมูลแคลอรี่`,
    });
  }
}

async function getCaloriesFromGemini(foodName) {
  try {
    const client = new GenerativeLanguageClient({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await client.generateText({
      model: "models/gemini-pro",
      prompt: `What are the calories in ${foodName} (Thai: ${foodName})?`,
    });

    console.log("Gemini API response:", response);

    if (response && response.result) {
      const calories = extractCaloriesFromThaiResponse(response.result);
      return calories;
    } else {
      console.error("Invalid Gemini API response:", response);
      return null;
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
}

function extractCaloriesFromThaiResponse(geminiResponse) {
  const match = geminiResponse.match(/(\d+|[\u0E50-\u0E59]+)\s*แคลอรี่/);
  if (match) {
    return convertThaiNumeralsToArabic(match[1]);
  } else {
    console.error("Failed to extract calories from response:", geminiResponse);
    return null;
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
  console.log("App is running on port", process.env.PORT || 3000);
});
