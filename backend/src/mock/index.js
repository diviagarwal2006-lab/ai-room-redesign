import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Find the contracts folder, no matter where the server is started from
const here = path.dirname(fileURLToPath(import.meta.url));
const contractsDir = path.resolve(here, '../../../contracts');

function loadContract(fileName) {
  return JSON.parse(readFileSync(path.join(contractsDir, fileName), 'utf-8'));
}

const room = loadContract('room.sample.json');
const modifications = loadContract('modifications.sample.json');

const DEFAULT_INSTRUCTION =
  'Make it modern, change the walls to light blue, add warm lighting and some plants.';

export function mockAnalyzeRoom() {
  return {
    roomId: 'mock-room-1',
    photos: [
      { index: 0, url: 'https://placehold.co/800x600?text=Room+Photo+1' },
      { index: 1, url: 'https://placehold.co/800x600?text=Room+Photo+2' },
    ],
    room,
    mock: true,
  };
}

export function mockDesign({
  designId = 'mock-design-1',
  roomId = 'mock-room-1',
  instruction = DEFAULT_INSTRUCTION,
} = {}) {
  return {
    designId,
    status: 'done',
    roomId,
    instruction,
    modifications,
    originalImageUrl: 'https://placehold.co/800x600?text=Original+Room',
    resultImageUrl: 'https://placehold.co/800x600/add8e6/333333?text=Redesigned+Room',
    room,
    mock: true,
    createdAt: new Date().toISOString(),
  };
}