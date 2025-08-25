
import React, { useRef, useEffect } from 'react';
import { DetectedObject } from '../types';
import { DetectionsOverlay } from './Overlays';

interface CameraViewProps {
  onStreamReady: (stream: MediaStream) => void;
  onStreamError: (error: string) => void;
  isLiveAnalysisActive: boolean;
  detectedObjects: DetectedObject[];
}

const CameraView: React.FC<CameraViewProps> = ({
  onStreamReady,
  onStreamError,
  isLiveAnalysisActive,
  detectedObjects,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const enableStream = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        onStreamReady(stream);
      } catch (err) {
        console.error("Error accessing camera: ", err);
        onStreamError("Camera access denied. Please enable camera permissions in your browser settings.");
      }
    };

    enableStream();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent"></div>
      
      {isLiveAnalysisActive && <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">LIVE ANALYSIS</div>}

      <DetectionsOverlay objects={detectedObjects} />
    </div>
  );
};

export default CameraView;