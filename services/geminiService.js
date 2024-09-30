const { GoogleGenerativeAI } = require("@google/generative-ai");
const calorieUtils = require("../utils/calorieUtils");
require("dotenv").config();

exports.getCaloriesAndImageFromGemini = async (foodName) => {
  try {
    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = client.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Generate calorie information
    const calorieResult = await model.generateContent(`ใน ${foodName} มีประมาณกี่แคล ประมาณมาได้เลยไม่ต้องห่วง`);
    const caloriesText = calorieResult.response.text();
    console.log("Calorie Information:", caloriesText);
    const calorieInfo = calorieUtils.extractCalorieInfo(caloriesText);

    // Generate image
    const imageResult = await model.generateImage({
      prompt: `รูปภาพของ ${foodName}`,
    });
    const imageUrl = imageResult.response.imageUrl;
    console.log("Generated Image URL:", imageUrl);

    return {
      calories: calorieInfo,
      imageUrl: imageUrl,
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
};
