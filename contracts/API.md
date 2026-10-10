# API Contract v1

Base URL (local): http://localhost:5000

## Response shape (ALL endpoints)
Success: { "ok": true,  "data": { ... } }
Failure: { "ok": false, "error": { "code": "...", "message": "..." } }
data.mock = true means the data is FAKE.

## Endpoints
GET  /api/health          -> { status, aiMode }
POST /api/analyze-room    -> multipart field "photos" (2-4 images, max 5 MB each)
                             returns { roomId, photos[{index,url}], room, mock }
                             photos[] also has name, mimeType, sizeBytes (extra info, safe to ignore)
POST /api/generate-design -> JSON { roomId, instruction (max 500 chars), photoIndex? }
                             returns { designId, status, roomId, instruction, modifications,
                                       originalImageUrl, resultImageUrl, room, mock, createdAt }
                            roomId must come from /api/analyze-room; photoIndex picks the original photo (default 0)
GET  /api/design/:id      -> same data as generate-design

## Error codes
400 TOO_FEW_PHOTOS, TOO_MANY_PHOTOS, INVALID_FILE_TYPE, ROOM_ID_MISSING,
    INSTRUCTION_MISSING, INSTRUCTION_TOO_LONG, INVALID_JSON, INVALID_FIELD, UPLOAD_ERROR,INVALID_PHOTO_INDEX,
404 ROOM_NOT_FOUND, DESIGN_NOT_FOUND, NOT_FOUND
413 FILE_TOO_LARGE
422 INSTRUCTION_UNCLEAR
429 RATE_LIMITED
500 SERVER_ERROR
502 AI_FAILED
504 AI_TIMEOUT

## Shared types
Room and modifications shapes: see room.sample.json and modifications.sample.json
Furniture types: bed, sofa, chair, table, desk, wardrobe, shelf, tv, lamp, plant, rug, curtain, other
Walls: north | south | east | west
position.x / position.z: 0 to 1 across the room, (0,0) = north-west corner

## Rule
Changing anything in this folder needs all 3 people to agree.