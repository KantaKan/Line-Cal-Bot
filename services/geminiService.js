const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = require("node-fetch");
require("dotenv").config(); 

const geminiService = {
  getCaloriesAndImage: async (foodName) => {
    try {
      const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = client.getGenerativeModel({ model: "gemini-1.5-pro" });

      const prompt = `${foodName} has how many calories? Answer with this JSON format: { "calories": , "translatedName": } answer only number in calories and dont answer outside json format`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      console.log("Gemini Response:", responseText);

      const data = JSON.parse(responseText);

      const calories = data.calories;
      const imageSearchKeyword = data.translatedName; 

      const unsplashResponse = await fetch(
        `https://api.unsplash.com/search/photos?query=${imageSearchKeyword}&client_id=${process.env.UNSPLASH_API_KEY}`
      );
      const unsplashData = await unsplashResponse.json();

      let imageUrl = null;
      if (unsplashData.results && unsplashData.results.length > 0) {
        imageUrl = unsplashData.results[0].urls.regular;
      } else {
        console.log("No image found on Unsplash for", imageSearchKeyword);
        imageUrl =
          "https://res.cloudinary.com/dgtdr85d8/image/upload/v1727696615/unnamed_ehkjkw.png"; 
      }

      return {
        calories: calories,
        imageUrl: imageUrl,
      };
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  },
};

module.exports = geminiService;
