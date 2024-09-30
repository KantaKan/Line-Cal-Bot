const { GoogleGenerativeAI } = require("@google/generative-ai");
const calorieUtils = require("../utils/calorieUtils");
const fetch = require("node-fetch");

require("dotenv").config();

exports.getCaloriesAndImage = async (foodName) => {
  try {
    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = client.getGenerativeModel({ model: "gemini-1.5-pro" });

    const calorieResult = await model.generateContent(`ใน ${foodName} มีประมาณกี่แคล ประมาณมาได้เลยไม่ต้องห่วง`);
    const caloriesText = calorieResult.response.text();
    console.log("Calorie Information:", caloriesText);
    const calorieInfo = calorieUtils.extractCalorieInfo(caloriesText);

    const unsplashResponse = await fetch(`https://api.unsplash.com/search/photos?query=${foodName}&client_id=${process.env.UNSPLASH_API_KEY}`);
    const unsplashData = await unsplashResponse.json();

    let imageUrl = null;
    if (unsplashData.results && unsplashData.results.length > 0) {
      imageUrl = unsplashData.results[0].urls.regular;
    } else {
      console.log("No image found on Unsplash for", foodName);

      imageUrl = "https://img.freepik.com/free-photo/chicken-wings-barbecue-sweetly-sour-sauce-picnic-summer-menu-tasty-food-top-view-flat-lay_2829-6471.jpg";
    }

    return {
      calories: calorieInfo,
      imageUrl: imageUrl,
    };
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};
