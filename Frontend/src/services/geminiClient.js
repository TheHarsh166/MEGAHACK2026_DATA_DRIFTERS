import { GoogleGenerativeAI } from "@google/generative-ai";

// For development purposes, we use the key from .env if available, 
// but in a real web app, this should be handled via a secure proxy or narrow-scoped token.
// For security, use environment variables (e.g., import.meta.env.VITE_GEMINI_API_KEY)
// The key below is a placeholder. Please replace with your actual key or use VITE_ env vars.
const API_KEY = "YOUR_GEMINI_API_KEY"; 

const genAI = new GoogleGenerativeAI(API_KEY);
export const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export default genAI;
