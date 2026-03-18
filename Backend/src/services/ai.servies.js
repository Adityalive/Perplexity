import { ChatGoogle } from "@langchain/google";
const model = new ChatGoogle({
  model: "gemini-2.5-flash",
  apiKey: process.env.GOOGLE_API_KEY,
});

 export const getAIResponse = async (req, res) => {
    const response =await model.invoke("captial of india").then((response) => {
        console.log(response.text);
      });
 }