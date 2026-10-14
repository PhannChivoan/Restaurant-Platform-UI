import { useEffect, useRef, useState } from "react";
import { Alert, Button, Modal, Space } from "antd";
import { Camera, RotateCcw, Upload } from "lucide-react";

// Takes the hand-over photo with the device camera (phone or laptop webcam; needs https or localhost),
// with a file / system-camera fallback. Calls onConfirm(file) after the driver checks the preview.
const DriverCamera = ({ open, title, onClose, onConfirm, confirming }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [problem, setProblem] = useState("");
  const [shot, setShot] = useState(null); // { file, url }

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (!open || shot) return;
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setProblem("This browser can't open the camera here (it needs https or localhost). Use the button below instead.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setReady(true);
      } catch {
        setProblem("Camera access was blocked or no camera was found. Allow camera access, or use the button below.");
      }
    })();
    return () => {
      cancelled = true;
      stop();
      setReady(false);
    };
  }, [open, shot]);

  const reset = () => {
    if (shot?.url) URL.revokeObjectURL(shot.url);
    setShot(null);
    setProblem("");
  };

  const close = () => {
    stop();
    reset();
    onClose();
  };

  const take = (file) => setShot({ file, url: URL.createObjectURL(file) });

  const snap = () => {
    const v = videoRef.current;
    if (!v?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d").drawImage(v, 0, 0);
    canvas.toBlob((blob) => blob && take(new File([blob], `delivery-${Date.now()}.jpg`, { type: "image/jpeg" })), "image/jpeg", 0.85);
  };

  return (
    <Modal open={open} title={title} onCancel={close} footer={null} destroyOnHidden width={520} centered>
      {shot ? (
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <img src={shot.url} alt="Delivery proof preview" style={{ width: "100%", maxHeight: "60vh", objectFit: "contain", background: "#000", borderRadius: 4 }} />
          <Button type="primary" block size="large" loading={confirming} onClick={() => onConfirm(shot.file)}>
            Confirm &amp; mark delivered
          </Button>
          <Button block icon={<RotateCcw size={14} />} onClick={reset} disabled={confirming}>
            Retake photo
          </Button>
        </Space>
      ) : (
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <div style={{ background: "#000", aspectRatio: "4 / 3", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, overflow: "hidden" }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: ready ? "block" : "none" }} />
            {!ready && <span style={{ color: "#fff", padding: 16, textAlign: "center" }}>{problem || "Starting camera…"}</span>}
          </div>
          <Button type="primary" block size="large" icon={<Camera size={16} />} disabled={!ready} onClick={snap}>
            Take photo
          </Button>
          <Button block icon={<Upload size={14} />} onClick={() => document.getElementById("driver-photo-input")?.click()}>
            Use camera app / choose a file
          </Button>
          <input
            id="driver-photo-input"
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={(e) => e.target.files?.[0] && take(e.target.files[0])}
          />
          {problem && <Alert type="info" showIcon title="Tip" description="Photos help prove the order reached the customer." />}
        </Space>
      )}
    </Modal>
  );
};

export default DriverCamera;