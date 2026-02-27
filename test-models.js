import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.argv[2];
if (!apiKey) {
    console.error("Please provide an API key");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// We can't list models easily with the SDK in node without full auth sometimes, 
// but let's try a simple generation with a known stable model 'gemini-pro' or 'gemini-1.5-pro'
// to see if it works, or we can use the REST API to list models.
// actually, let's just try to generate with 'gemini-2.0-flash' or 'gemini-1.5-pro-latest'

async function test() {
    try {
        console.log("Testing gemini-1.5-flash...");
        const m1 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        await m1.generateContent("test");
        console.log("gemini-1.5-flash works!");
    } catch (e) {
        console.log("gemini-1.5-flash failed:", e.message.split('[')[0]);
    }

    try {
        console.log("Testing gemini-pro...");
        const m2 = genAI.getGenerativeModel({ model: "gemini-pro" });
        await m2.generateContent("test");
        console.log("gemini-pro works!");
    } catch (e) {
        console.log("gemini-pro failed:", e.message.split('[')[0]);
    }
}

test();
