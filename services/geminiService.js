const { GoogleGenerativeAI } = require("@google/generative-ai");
const calorieUtils = require("../utils/calorieUtils");
require("dotenv").config();

exports.getCaloriesFromGemini = async (foodName) => {
  try {
    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = client.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent(`ใน ${foodName} มีประมาณกี่แคล ประมาณมาได้เลยไม่ต้องห่วง`);

    const caloriesText = result.response.text();
    console.log(caloriesText);
    return calorieUtils.extractCalorieInfo(caloriesText);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
};
