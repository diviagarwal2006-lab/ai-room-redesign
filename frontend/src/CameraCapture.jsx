import { useEffect, useRef, useState } from 'react';

const MAX_SIDE = 1600; // shrink the picture to at most 1600 px

function describeError(error) {
  switch (error?.name) {
    case 'NotAllowedError':
      return 'Camera permission was denied. Allow the camera in your browser settings and try again.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No camera was found on this device.';
    case 'NotReadableError':
      return 'The camera is used by another app. Close it and try again.';
    default:
      return 'Could not start the camera. You can choose a photo instead.';
  }
}

// onCapture(file) is called with a JPEG file every time a photo is taken
export default function CameraCapture({ onCapture, disabled }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | starting | live
  const [facing, setFacing] = useState('environment'); // back camera on phones
  const [error, setError] = useState('');

  // Browsers only allow the live camera on https:// or localhost
  const available = window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  // Switch the camera off when this component disappears
  useEffect(() => stopCamera, []);

  async function startCamera(facingMode) {
    stopCamera();
    setError('');
    setStatus('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setFacing(facingMode);
      setStatus('live');
    } catch (err) {
      stopCamera();
      setStatus('idle');
      setError(describeError(err));
    }
  }

  function takePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const scale = Math.min(1, MAX_SIDE / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Could not take the photo. Please try again.');
          return;
        }
        onCapture(new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.9
    );
  }

  if (!available) {
    return <p className="hint">The live camera needs https or localhost. Use "Take a photo" instead.</p>;
  }

  return (
    <div style={{ marginTop: 8 }}>
      {/* The video must always be on the page, so we only hide it */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          display: status === 'idle' ? 'none' : 'block',
          width: '100%',
          maxHeight: 360,
          borderRadius: 8,
          background: '#000',
          marginBottom: 8,
        }}
      />

      <div className="buttons">
        {status === 'live' ? (
          <>
            <button type="button" className="button" disabled={disabled} onClick={takePhoto}>
              Take photo
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => startCamera(facing === 'environment' ? 'user' : 'environment')}
            >
              Switch camera
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                stopCamera();
                setStatus('idle');
              }}
            >
              Close camera
            </button>
          </>
        ) : (
          <button
            type="button"
            className="button secondary"
            disabled={status === 'starting'}
            onClick={() => startCamera(facing)}
          >
            {status === 'starting' ? 'Starting camera...' : 'Use live camera'}
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
}