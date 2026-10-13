import { useState } from 'react';
import { analyzeRoom, generateDesign } from './api.js';
import CameraCapture from './CameraCapture.jsx';
const MIN_PHOTOS = 2;
const MAX_PHOTOS = 4;
const ACCEPT = 'image/jpeg,image/png,image/webp';

export default function App() {
  const [photos, setPhotos] = useState([]); // each: { file, preview }
  const [analysis, setAnalysis] = useState(null); // reply from /api/analyze-room
  const [instruction, setInstruction] = useState('');
  const [design, setDesign] = useState(null); // reply from /api/generate-design
  const [loading, setLoading] = useState(''); // '' | 'analyzing' | 'designing'
  const [error, setError] = useState('');

  function addFiles(event) {
    const chosen = Array.from(event.target.files);
    event.target.value = ''; // lets the same file be picked again
    const added = chosen.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPhotos((current) => [...current, ...added].slice(0, MAX_PHOTOS));
  }

  function removePhoto(index) {
    setPhotos((current) => current.filter((_, i) => i !== index));
  }
    function addPhoto(file) {
    const photo = { file, preview: URL.createObjectURL(file) };
    setPhotos((current) => [...current, photo].slice(0, MAX_PHOTOS));
  }
  async function handleAnalyze() {
    setError('');
    setLoading('analyzing');
    try {
      setAnalysis(await analyzeRoom(photos.map((photo) => photo.file)));
      setDesign(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading('');
    }
  }

  async function handleDesign() {
    setError('');
    setLoading('designing');
    try {
      setDesign(await generateDesign(analysis.roomId, instruction));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading('');
    }
  }

  function startOver() {
    setPhotos([]);
    setAnalysis(null);
    setDesign(null);
    setInstruction('');
    setError('');
  }

  const room = analysis?.room;

  return (
    <main className="page">
      <h1>AI Room Redesign</h1>
      <p className="subtitle">Upload photos of your room, say what you want changed, and see the result.</p>

      {/* STEP 1: photos */}
      <section className="card">
        <h2>1. Your room photos</h2>
        <div className="buttons">
          <label className="button">
            Choose photos
            <input type="file" accept={ACCEPT} multiple hidden onChange={addFiles} />
          </label>
          <label className="button secondary">
            Take a photo
            <input type="file" accept={ACCEPT} capture="environment" hidden onChange={addFiles} />
          </label>
        </div>
        <p className="hint">Add {MIN_PHOTOS} to {MAX_PHOTOS} photos (JPG, PNG or WebP).</p>
       <CameraCapture onCapture={addPhoto} disabled={photos.length >= MAX_PHOTOS} />
        <div className="thumbs">
          {photos.map((photo, index) => (
            <div className="thumb" key={photo.preview}>
              <img src={photo.preview} alt={`Room photo ${index + 1}`} />
              <button type="button" onClick={() => removePhoto(index)}>Remove</button>
            </div>
          ))}
        </div>

        <button
          className="button"
          disabled={photos.length < MIN_PHOTOS || loading !== ''}
          onClick={handleAnalyze}
        >
          {loading === 'analyzing' ? 'Analyzing... (up to a minute)' : 'Analyze my room'}
        </button>
      </section>

      {/* STEP 2: what the AI found, and the request */}
      {room && (
        <section className="card">
          <h2>2. What I found</h2>
          {analysis.mock && <p className="badge">Sample data (mock mode)</p>}
          <p>
            This looks like a <b>{room.roomType}</b> with {room.walls.colorName} walls and a{' '}
            {room.floor.material} floor.
          </p>
          <p>Furniture: {room.furniture.map((item) => item.type).join(', ') || 'none found'}</p>
          {room.uncertainties.length > 0 && (
            <ul className="notes">
              {room.uncertainties.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}

          <h2>3. What would you like to change?</h2>
          <textarea
            rows={3}
            maxLength={500}
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder="Example: Make it modern, change the walls to light blue, add warm lighting and some plants"
          />
          <button
            className="button"
            disabled={!instruction.trim() || loading !== ''}
            onClick={handleDesign}
          >
            {loading === 'designing' ? 'Designing...' : 'Redesign my room'}
          </button>
        </section>
      )}

      {/* STEP 3: result */}
      {design && (
        <section className="card">
          <h2>Result</h2>
          <div className="compare">
            <figure>
              <img src={design.originalImageUrl} alt="Original room" />
              <figcaption>Before</figcaption>
            </figure>
            <figure>
              <img src={design.resultImageUrl} alt="Redesigned room" />
              <figcaption>After (demo preview)</figcaption>
            </figure>
          </div>
          <p>
            <b>What I understood:</b> {design.modifications.summary}
          </p>
          <h2>3D view</h2>
          <RoomViewer room={design.room} modifications={design.modifications} />
          <button className="button secondary" onClick={startOver}>Start over</button>
        </section>
      )}

      {error && <p className="error">{error}</p>}
    </main>
  );
}