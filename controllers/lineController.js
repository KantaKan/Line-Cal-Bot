
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
        text: `Your daily calorie goal has been set to ${newGoal} calories`, // Updated text
      });
    } else {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "Invalid command format. Please use: set goal [number of calories]", // Updated text
      });
    }
  }

  const now = new Date();
  const lastUpdated = user.lastUpdated ? new Date(user.lastUpdated) : new Date(0);

  if (now.getDate() !== lastUpdated.getDate() || now.getMonth() !== lastUpdated.getMonth() || now.getFullYear() !== lastUpdated.getFullYear()) {
    user.caloriesConsumed = 0;
  }

  const result = await geminiService.getCaloriesAndImage(messageText);

  if (result) {
    user.caloriesConsumed += result.calories;
    user.lastUpdated = now;
    await user.save();

    const caloriesLeft = user.dailyCalorieGoal - user.caloriesConsumed;

    return client.replyMessage(event.replyToken, {
      type: "flex",
      altText: `${messageText} has approximately ${result.calories} calories\nRemaining calories for today: ${caloriesLeft} calories`,
      contents: {
        type: "bubble",
        hero: {
          type: "image",
          url: result.imageUrl,
          size: "full",
          aspectRatio: "20:13",
          aspectMode: "cover",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: `${messageText} has approximately ${result.calories} calories`, // Updated text
              weight: "bold",
              size: "xl",
            },
            {
              type: "box",
              layout: "vertical",
              margin: "lg",
              spacing: "sm",
              contents: [
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "Remaining calories for today", // Updated text
                      color: "#aaaaaa",
                      size: "sm",
                      flex: 1,
                    },
                    {
                      type: "text",
                      text: `${caloriesLeft} calories`, // Updated text
                      wrap: true,
                      color: "#666666",
                      size: "sm",
                      flex: 1,
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    });
  } else {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: `Sorry, I couldn't find calorie information for ${messageText}`, // Updated text
    });
  }
}
