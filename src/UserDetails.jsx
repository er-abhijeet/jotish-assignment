import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./UserDetails.css";

const UserDetails = () => {
  const { id } = useParams();

  const [stream, setStream] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [mergedImage, setMergedImage] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [preset, setPreset] = useState(false);

  const videoRef = useRef(null);
  const photoCanvasRef = useRef(null);
  const sigCanvasRef = useRef(null);

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 300;

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setStream(mediaStream);
      setPhoto(null);
      setMergedImage(null);
    } catch (err) {
      console.error("Camera access denied or unavailable.", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Load saved signature on mount
  useEffect(() => {
    const savedImage = localStorage.getItem(`user_signature_${id}`);
    if (savedImage) {
      setMergedImage(savedImage);
      setPreset(true);
    }
  }, [id]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    return () => stopCamera();
  }, [stream]);

  const capturePhoto = () => {
    if (!videoRef.current || !photoCanvasRef.current) return;

    const ctx = photoCanvasRef.current.getContext("2d");

    ctx.drawImage(videoRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const imageDataUrl = photoCanvasRef.current.toDataURL("image/png");

    setPhoto(imageDataUrl);
    stopCamera();
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (!sigCanvasRef.current) return;
    const ctx = sigCanvasRef.current.getContext("2d");
    ctx.beginPath();
  };

  const draw = (e) => {
    if (!isDrawing || !sigCanvasRef.current) return;

    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    if (!clientX || !clientY) return;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#10b981";

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearSignature = () => {
    if (!sigCanvasRef.current) return;
    const ctx = sigCanvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  };

  const handleMerge = () => {
    if (!photo || !sigCanvasRef.current) return;

    const mergeCanvas = document.createElement("canvas");
    mergeCanvas.width = CANVAS_WIDTH;
    mergeCanvas.height = CANVAS_HEIGHT;
    const ctx = mergeCanvas.getContext("2d");

    const img = new Image();
    img.src = photo;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.drawImage(sigCanvasRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const finalImage = mergeCanvas.toDataURL("image/png");
      setMergedImage(finalImage);
      localStorage.setItem(`user_signature_${id}`, finalImage);
    };
  };

  const handleDownload = () => {
    if (!mergedImage) return;

    const link = document.createElement("a");
    link.href = mergedImage;

    link.download = `verification_${id}_${Date.now()}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="details-container">
      <h2>Identity Verification</h2>
      <p
        className="emp-badge"
        style={{ display: "inline-block", marginBottom: "20px" }}
      >
        Employee ID: {id}
      </p>

      {!preset && !photo && !stream && (
        <button className="btn-primary" onClick={startCamera}>
          Start Camera
        </button>
      )}

      <canvas
        ref={photoCanvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ display: "none" }}
      />

      {stream && !photo && (
        <div className="media-wrapper">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="video-feed"
          />
          <button className="btn-action" onClick={capturePhoto}>
            Capture Photo
          </button>
        </div>
      )}

      {photo && !mergedImage && (
        <div className="media-wrapper">
          <div
            className="canvas-container"
            style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          >
            <img src={photo} alt="Captured" className="captured-photo" />
            <canvas
              ref={sigCanvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="signature-canvas"
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseMove={draw}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchEnd={stopDrawing}
              onTouchMove={draw}
            />
          </div>

          <div className="action-row">
            <button className="btn-secondary" onClick={startCamera}>
              Retake Photo
            </button>
            <button className="btn-secondary" onClick={clearSignature}>
              Clear Signature
            </button>
            <button className="btn-primary" onClick={handleMerge}>
              Verify & Merge
            </button>
          </div>
        </div>
      )}

      {mergedImage && (
        <div className="media-wrapper">
          <h3 style={{ color: "#10b981", margin: "0 0 10px 0" }}>
            Verification Complete
          </h3>
          <img src={mergedImage} alt="Merged Final" className="final-image" />
          <p className="base64-text">
            Image ready for database upload (Base64 length: {mergedImage.length}
            )
          </p>
          <div className="action-row">
            <button className="btn-primary" onClick={handleDownload}>
              Download File
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setMergedImage(null);
                localStorage.removeItem(`user_signature_${id}`);
              }}
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
