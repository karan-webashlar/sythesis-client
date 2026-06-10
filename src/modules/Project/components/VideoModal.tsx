import { useSelector } from "react-redux";
import React, { useRef } from "react";
import styled from "styled-components";
import { getProjectPreview } from "../../../redux/reducers/projectReducer";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoPath: string;
}

const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose, videoPath }) => {
  const projectVideos = useSelector(getProjectPreview);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!isOpen || !videoPath) return null;

  return (
    <Overlay onClick={onClose}>
      <Content onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose} aria-label="Close video">
          &times;
        </CloseButton>
        <Video ref={videoRef} controls autoPlay onEnded={onClose}>
          <source src={`http://192.168.1.80:7132/${videoPath}`} type="video/mp4" />
          Your browser does not support HTML5 video.
        </Video>
      </Content>
    </Overlay>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px; /* prevents Content from touching screen edges on mobile */
  box-sizing: border-box;
  backdrop-filter: blur(4px);
`;

const Content = styled.div`
  position: relative;
  width: 80%;
  max-width: 800px;
  background: #000;
  padding: 10px;
  border-radius: 12px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);

  /* ── Tablet ── */
  @media (max-width: 768px) {
    width: 100%; /* fills the padded overlay area */
    border-radius: 10px;
    padding: 8px;
  }

  /* ── Small mobile ── */
  @media (max-width: 480px) {
    border-radius: 8px;
    padding: 6px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: -36px; /* float above the card so it never overlaps the video */
  right: 0;
  width: 32px;
  height: 32px;
  font-size: 22px;
  line-height: 1;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, transform 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.22);
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.92);
  }

  /* Larger tap target on mobile */
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    font-size: 20px;
    top: -44px;
  }
`;

const Video = styled.video`
  width: 100%;
  height: auto;
  display: block;
  border-radius: 8px;
  background: #000;

  /* Ensure video never exceeds viewport height (minus header + padding) */
  max-height: calc(100dvh - 80px);
  object-fit: contain;

  @media (max-width: 768px) {
    border-radius: 6px;
    max-height: calc(100dvh - 100px);
  }
`;

export default VideoModal;
