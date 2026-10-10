import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { config } from '../src/config.js';

if (!config.geminiApiKey) {
  console.error('GEMINI_API_KEY is missing in backend/.env');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

// Which photo to use: first argument, or room1.jpg by default
const photoPath =
  process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '../test-files/room1.jpg';
const runImageTest = process.argv.includes('--image');

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};
const mimeType = MIME_TYPES[path.extname(photoPath).toLowerCase()];
if (!mimeType) {
  console.error('Use a .jpg, .png or .webp photo.');
  process.exit(1);
}
const imageBase64 = fs.readFileSync(photoPath).toString('base64');

// Test 1: can we talk to the AI at all?
async function testText() {
  console.log(`\nTest 1: text (${config.geminiTextModel})`);
  const response = await ai.models.generateContent({
    model: config.geminiTextModel,
    contents: 'Reply with exactly these words: AI connection works',
  });
  console.log('Reply:', response.text);
}

// Test 2: can the AI look at a photo and answer in JSON?
async function testVision() {
  console.log(`\nTest 2: look at a photo, answer in JSON (${config.geminiTextModel})`);
  const response = await ai.models.generateContent({
    model: config.geminiTextModel,
    contents: [
      { inlineData: { mimeType, data: imageBase64 } },
      {
        text: 'Look at this room photo. Return JSON with: roomType (string), wallColor (string), furniture (array of strings).',
      },
    ],
    config: { responseMimeType: 'application/json' },
  });
  console.log('Raw reply:', response.text);
  const parsed = JSON.parse(response.text);
  console.log('Parsed OK. roomType =', parsed.roomType);
}

// Test 3: can the AI edit the photo? (needs billing)
async function testImageEdit() {
  console.log(`\nTest 3: edit the photo (${config.geminiImageModel})`);
  const response = await ai.models.generateContent({
    model: config.geminiImageModel,
    contents: [
      { inlineData: { mimeType, data: imageBase64 } },
      {
        text: 'Edit this room photo: paint the walls light blue. Keep the furniture, layout, windows and camera angle exactly the same.',
      },
    ],
    config: { responseModalities: ['TEXT', 'IMAGE'] },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData?.data);
  if (!imagePart) {
    const text = parts.filter((part) => part.text).map((part) => part.text).join(' ');
    console.log('No image came back. Text reply was:', text || '(empty)');
    return;
  }
  const outPath = '../test-files/edited.png';
  fs.writeFileSync(outPath, Buffer.from(imagePart.inlineData.data, 'base64'));
  console.log('Saved the edited image to', outPath);
}

try {
  await testText();
  await testVision();
  if (runImageTest) {
    await testImageEdit();
  } else {
    console.log('\nSkipping Test 3 (image edit). Run with --image once billing is set up.');
  }
  console.log('\nAll requested tests finished.');
} catch (error) {
  console.error('\nTest failed:', error.message);
  process.exit(1);
}