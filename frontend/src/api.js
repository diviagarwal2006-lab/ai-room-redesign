const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Calls the backend. Returns the "data" part, or throws an Error with a friendly message.
async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  let json;
  try {
    json = await response.json();
  } catch {
    throw new Error('The server sent an unexpected reply.');
  }

  if (!json.ok) throw new Error(json.error?.message || 'Something went wrong.');
  return json.data;
}

export function analyzeRoom(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append('photos', file));
  return request('/api/analyze-room', { method: 'POST', body: formData });
}

export function generateDesign(roomId, instruction) {
  return request('/api/generate-design', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, instruction }),
  });
}