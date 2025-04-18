import { GoogleGenerativeAI, Content } from "@google/generative-ai" // Ensure Content is imported
import fs from 'fs';

// Configure the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")

export async function POST(req: Request) {
  console.log("--- New Request to /api/chat ---");
  try {
    const { messages } = await req.json()
    console.log("Received messages:", JSON.stringify(messages, null, 2));

    // Validate API key
    if (!process.env.GOOGLE_API_KEY) {
      console.error("GOOGLE_API_KEY is not configured");
      return Response.json({ error: "GOOGLE_API_KEY is not configured" }, { status: 500 })
    }

    // Format messages for Gemini (User/Model roles)
    const formattedMessages: Content[] = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }))
    console.log("Formatted messages for Gemini:", JSON.stringify(formattedMessages, null, 2));

    // Get the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Read configuration from config.json
    let config: Partial<{ personality?: string; manners?: string[]; rules?: string[]; basicTraining?: string; }> = {};
    try {
      const configFile = fs.readFileSync('./config.json', 'utf-8');
      config = JSON.parse(configFile);
      console.log("Read config.json:", JSON.stringify(config, null, 2));
    } catch (error) {
      console.warn("Warning: Error reading or parsing config.json (continuing without config):", error instanceof Error ? error.message : String(error));
    }

    // Construct system instruction string from config
    let systemInstructionString = "";
    if (config.personality) systemInstructionString += `Personality: ${config.personality}. `;
    if (config.manners && config.manners.length) systemInstructionString += `Manners: ${config.manners.join(", ")}. `;
    if (config.rules && config.rules.length) systemInstructionString += `Rules: ${config.rules.join(", ")}. `;
    if (config.basicTraining) systemInstructionString += `Basic Training: ${config.basicTraining}. `;
    const finalSystemInstructionString = systemInstructionString.trim() || null;
    console.log("Using System Instruction String:", finalSystemInstructionString || "None");

    // Prepare history and last message
    const history = formattedMessages.slice(0, -1); // Original history (must start with user)
    const lastMessage = formattedMessages[formattedMessages.length - 1];

    if (!lastMessage || lastMessage.role !== 'user') {
        console.error("Last message is missing or not from user:", lastMessage);
        return Response.json({ error: "Invalid last message format" }, { status: 400 });
    }
    const lastMessageText = lastMessage.parts[0].text;
    console.log("Last user message text:", lastMessageText);
    console.log("History being sent:", JSON.stringify(history, null, 2));

    // *** MODIFICATION START ***
    // Format system instruction as Content object if it exists
    const systemInstructionContent: Content | undefined = finalSystemInstructionString
        ? { role: "system", parts: [{ text: finalSystemInstructionString }] } // Use 'system' role? Or stick to 'model'? Let's try 'system' first as it's semantically correct. The API might alias it. If this fails, try 'model'.
        : undefined;
    console.log("System Instruction Content Object:", JSON.stringify(systemInstructionContent, null, 2) || "None");
    // *** MODIFICATION END ***


    // Start a chat session
    console.log("Attempting to start chat session (model.startChat)...");
    const chat = model.startChat({
      history: history, // Use the original history
      generationConfig: {
        maxOutputTokens: 1000,
      },
      systemInstruction: systemInstructionContent, // Pass the Content object here
    }) ;
    console.log("Chat session started successfully.");


    // Send the message to Gemini and get the response
    console.log("Sending message to Gemini...");
    const result = await chat.sendMessage(lastMessageText);
    console.log("Received result from Gemini:", JSON.stringify(result, null, 2));

    const responseText = result.response.text();
    console.log("Extracted response text:", responseText);

    // Return the response
    console.log("Sending successful response to client.");
    return Response.json({
      id: Date.now().toString(),
      object: "chat.completion",
      created: Date.now(),
      model: "gemini-1.5-flash",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: responseText,
          },
          finish_reason: "stop",
        },
      ],
    }) ;
  } catch (error) {
    // Simplified Error Logging
    console.error("--- ERROR in /api/chat ---");
    console.error("Timestamp:", new Date().toISOString());
    if (error instanceof Error) {
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);
    } else {
        console.error("Caught non-Error object:", String(error));
    }

    // Return a detailed error response
    return Response.json({
      error: "Failed to process chat request",
      details: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : undefined,
    }, { status: 500 })
  }
}
