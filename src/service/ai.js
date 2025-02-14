"use server";
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

import fs from "fs";
import path from "path";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

/**
 * Uploads the given file to Gemini.
 *
 * See https://ai.google.dev/gemini-api/docs/prompting_with_media
 */
async function uploadToGemini(file) {
    if (!file) {
      throw new Error("No file provided for upload");
    }
  
    console.log("Uploading file to Gemini:", file.name);
  
    try {
      // Save file in "public/files/"
      const filePath = await saveFileLocally(file);
      console.log("File saved at:", filePath);
  
      // Upload the file using the saved file path
      const uploadResult = await fileManager.uploadFile(filePath, {
        mimeType: file.type,
        displayName: file.displayName,
      });

  
      return uploadResult.file;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
}

async function saveFileLocally(file) {
  return new Promise((resolve, reject) => {
    try {
      // Ensure the directory exists
      const dirPath = path.join(process.cwd(), "public/files");
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // Create file path
      const filePath = path.join(dirPath, file.name);

      // Handle File object from browser
      if (file instanceof File) {
        file.arrayBuffer()
          .then(buffer => {
            fs.writeFile(filePath, Buffer.from(buffer), (err) => {
              if (err) reject(err);
              else resolve(filePath);
            });
          })
          .catch(reject);
      }
      // Handle Buffer or other binary data
      else if (Buffer.isBuffer(file) || ArrayBuffer.isView(file)) {
        fs.writeFile(filePath, file, (err) => {
          if (err) reject(err);
          else resolve(filePath);
        });
      }
      else {
        reject(new Error('Unsupported file type'));
      }
    } catch (error) {
      reject(error);
    }
  });
}


const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  systemInstruction:
    'User Input: A photo of an environmental disaster or concern.\n\nOutput:\n\n{ Subject: Urgent Environmental Concern: Immediate Action Required, \nBody:\nDear [Government Official’s Name],\n\nI am writing to bring your attention to an environmental issue that requires urgent action. Attached is a photo depicting [brief description of the issue, e.g., "illegal dumping in a public park" or "severe air pollution in an urban area"]. This situation poses significant risks to public health and the local ecosystem.\n\nTo address this concern, I recommend the following actions:\n\n[Proposed solution 1, e.g., "Conduct an on-site inspection to assess the severity."]\n[Proposed solution 2, e.g., "Implement stricter regulations or fines to prevent recurrence."]\n[Proposed solution 3, e.g., "Engage with local communities to promote environmental awareness."]\nI appreciate your prompt attention to this matter. Please let me know how I can assist in ensuring a swift resolution.\n\nBest regards,\n[Your Name]\n[Your Contact Information]\n\n}',
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  responseSchema: {
    type: "object",
    properties: {
      subject: {
        type: "string",
      },
      body: {
        type: "string",
      },
    },
    required: ["subject", "body"],
  },
};

export async function run(file) {
  if (!file) {
    console.error("No file provided to run function!");
    return;
  }

  console.log("Submitting file to AI model...", file);

  try {
    const files = [
        await uploadToGemini(file),
      ];
    
      const chatSession = model.startChat({
        generationConfig,
        history: [
          {
            role: "user",
            parts: [
              {
                fileData: {
                  mimeType: files[0].mimeType,
                  fileUri: files[0].uri,
                },
              },
            ],
          },
        ],
      });
    
      const result = await chatSession.sendMessage("Use System Instruction");
      return result.response.text();
  } catch (error) {
    console.error("Error in run function:", error);
  }
}
