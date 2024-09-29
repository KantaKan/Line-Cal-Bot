const User = require("../models/user");
const geminiService = require("../services/geminiService");

exports.handleLineEvent = async (req, res, client) => {
  try {
    const events = req.body.events;
    const results = await Promise.all(events.map((event) => handleEvent(event, client)));
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
};

async function handleEvent(event, client) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  const messageText = event.message.text;

  let user = await User.findOne({ userId });

  if (!user) {
    user = new User({ userId });
  }

  if (messageText.toLowerCase().startsWith("set goal")) {
    const parts = messageText.split(" ");
    if (parts.length === 3 && !isNaN(parts[2])) {
      const newGoal = parseInt(parts[2]);
      user.dailyCalorieGoal = newGoal;
      await user.save();

      return client.replyMessage(event.replyToken, {
        type: "text",
        text: `เป้าหมายแคลอรี่ต่อวันของคุณถูกตั้งค่าเป็น ${newGoal} แคลอรี่แล้ว`,
      });
    } else {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "รูปแบบคำสั่งไม่ถูกต้อง กรุณาใช้คำสั่ง: set goal [จำนวนแคลอรี่]",
      });
    }
  }

  const now = new Date();
  const lastUpdated = new Date(user.lastUpdated);
  if (now.getDate() !== lastUpdated.getDate() || now.getMonth() !== lastUpdated.getMonth() || now.getFullYear() !== lastUpdated.getFullYear()) {
    user.caloriesConsumed = 0;
  }

  const calories = await geminiService.getCaloriesFromGemini(messageText);

  if (calories) {
    user.caloriesConsumed += calories;
    user.lastUpdated = new Date();
    await user.save();

    const caloriesLeft = user.dailyCalorieGoal - user.caloriesConsumed;

    return client.replyMessage(event.replyToken, {
      type: "text",
      text: `${messageText} มีประมาณ ${calories} แคลอรี่\nแคลอรี่ที่เหลือสำหรับวันนี้: ${caloriesLeft} แคลอรี่`,
    });
  } else {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: `ขออภัย ฉันไม่พบข้อมูลแคลอรี่สำหรับ ${messageText}`,
    });
  }
}
