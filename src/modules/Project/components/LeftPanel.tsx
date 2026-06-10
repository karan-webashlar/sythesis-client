/* eslint-disable prettier/prettier */
import styled, { keyframes } from "styled-components";
import ChatInput from "../../../components/ChatInput/ChatInput";
import { useEffect, useRef, useState } from "react";
import { chips, models } from "../data";
import { useParams } from "react-router-dom";
import { updateVideoProjectServer, getProjectSlideServer, lockVideoProjectServer } from "../../../redux/actions/projectAction";
import { useDispatch, useSelector } from "react-redux";
import { getDraftSlideData, getIsDraftSlide, getProject } from "../../../redux/reducers/projectReducer";
import CloseIcon from "../../../components/Icons/CloseIcon";
import { VideoThumbIcon } from "../../../components/Icons/VideoThumbIcon";
import { ExpandIcon } from "../../../components/Icons/ExpandIcon";
import { AiAvatarIcon } from "../../../components/Icons/AiAvatarIcon";
import PopupModel from "../../../components/PopupModel/PopupModel";

interface Paragraph {
  projectParagraphId: number;
  text: string;
  outputAudio: string;
  imagePaths?: string[];
  errorMessage?: string;
  outputVideo?: string;
}

const LeftPanelSide = () => {
  const { projectId } = useParams();
  const [prompt, setPrompt] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [isTyping, setIsTyping] = useState(false);
  const [videoSectionVisible, setVideoSectionVisible] = useState(true);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const [pendingVideo, setPendingVideo] = useState<any>(null);
  const dispatch = useDispatch();
  const projectData = useSelector(getProject);
  const [slideData, setSlideData] = useState<any>({});
  const isDraftSlide = useSelector(getIsDraftSlide);
  const draftSlideData = useSelector(getDraftSlideData);

  const paragraphs: Paragraph[] = slideData?.projectParagraphs;

  const handleSend = async () => {
    if (!prompt.trim()) return;
    setAttachedFiles([]);
    setPrompt("");
    setSelectedModel(models[0]);
    dispatch(
      updateVideoProjectServer({
        title: projectData?.title,
        projectId: Number(projectId),
        slides: [
          {
            slideId: slideData.slideId,
            order: slideData.order,
            slideBackgroundColor: slideData.slideBackgroundColor,
            projectParagraphs: [
              {
                projectParagraphId: 0,
                order: 1,
                actorId: 12270,
                text: prompt.trim(),
              },
            ],
          },
        ],
      })
    );
  };

  const videoParagraphs = paragraphs?.filter((p) => p.outputAudio != null);

  if (!slideData) return null;

  const handleConfirmLock = () => {
    if (!pendingVideo) return;
    dispatch(lockVideoProjectServer({
      projectId: Number(projectId),
      slideId: Number(slideData.slideId),
      ParagraphId: Number(pendingVideo?.paragraphId),
    }));
    dispatch(getProjectSlideServer(Number(projectId), Number(slideData.slideId)));
    setShowLockModal(false);
    setPendingVideo(null);
  };

  const handleCancelLock = () => {
    setShowLockModal(false);
    setPendingVideo(null);
  };

  useEffect(() => {
    if (isDraftSlide && draftSlideData?.slideId === 0) {
      setSlideData(draftSlideData);
      return;
    }
    if (projectData?.slides?.length) {
      setSlideData(projectData.slides[0]);
    }
  }, [projectData, draftSlideData, isDraftSlide]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [paragraphs, isTyping]);

  return (
    <LeftPanel>
      <LeftHeader>
        <HeaderTitle>{slideData.slideId}</HeaderTitle>

        <SlideStatusBadge
          $status={
            slideData.slideId === 0
              ? "draft"
              : slideData?.isActive
                ? "active"
                : "inactive"
          }
        >
          {slideData.slideId === 0
            ? "Draft"
            : slideData?.isActive
              ? "Active"
              : "Inactive"}
        </SlideStatusBadge>
      </LeftHeader>

      <PanelBody>
        <ChatSection>
          <ChatColumn>
            <PanelHeader>
              <SectionLabel>Conversation</SectionLabel>
            </PanelHeader>

            <ChatMessages>
              {paragraphs?.length === 0 ? (
                <EmptyState>No conversation yet. Type a prompt below to get started.</EmptyState>
              ) : (
                paragraphs?.map((para, idx) => (
                  <ConversationPair key={`${slideData.id}-${idx}`}>
                    {/* User bubble */}
                    {para.text || (para.imagePaths && para.imagePaths.length > 0) ? (
                      <MessageRow $role="user">
                        <MessageBubble $role="user">
                          {para.imagePaths && para.imagePaths.length > 0 && (
                            <ImageGrid $count={para.imagePaths.length}>
                              {para.imagePaths.map((src, imgIdx) => (
                                <ImageThumbWrapper key={imgIdx} onClick={() => setExpandedImage(src)}>
                                  <ImageThumb src={src} alt={`attachment-${imgIdx + 1}`} />
                                  <ImageOverlay>
                                    <ExpandIcon />
                                  </ImageOverlay>
                                </ImageThumbWrapper>
                              ))}
                            </ImageGrid>
                          )}
                          {para.text ? <BubbleText>{para.text}</BubbleText> : null}
                          <Timestamp>
                            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </Timestamp>
                        </MessageBubble>
                      </MessageRow>
                    ) : null}

                    {para.outputAudio ? (
                      <MessageRow $role="ai">
                        <MessageBubble $role="ai">
                          <VideoContainer $active={para?.projectParagraphId === slideData?.projectParagraphId}>
                            <video
                              src={`http://192.168.1.80:7132/${para.outputAudio}`}
                              controls
                              autoPlay={false}
                              preload="metadata"
                            />
                          </VideoContainer>
                          <Timestamp>
                            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </Timestamp>
                        </MessageBubble>
                      </MessageRow>
                    ) : (
                      <ErrorContainer>
                        <ErrorTitle>⚠️ AI Generation Failed</ErrorTitle>
                        <ErrorMessage>{para?.errorMessage}</ErrorMessage>
                      </ErrorContainer>
                    )}
                  </ConversationPair>
                ))
              )}

              {isTyping && (
                <MessageRow $role="ai">
                  <Avatar>
                    <AiAvatarIcon />
                  </Avatar>
                  <MessageBubble $role="ai">
                    <TypingDots>
                      <Dot $delay="0s" />
                      <Dot $delay="0.18s" />
                      <Dot $delay="0.36s" />
                    </TypingDots>
                  </MessageBubble>
                </MessageRow>
              )}

              <div ref={chatEndRef} />
            </ChatMessages>
          </ChatColumn>

          {/* ── Video Side Panel ── */}
          <VideoSection $visible={videoSectionVisible}>
            <PanelHeader>
              <SectionLabel>
                <VideoThumbIcon />
                Videos ({videoParagraphs?.length})
              </SectionLabel>
              <VideoHeaderActions>
                <ActionBtn title="Close Videos" onClick={() => setVideoSectionVisible(false)}>
                  <CloseIcon />
                </ActionBtn>
              </VideoHeaderActions>
            </PanelHeader>

            <VideoList>
              {videoParagraphs?.length === 0 ? (
                <EmptyState>No videos generated yet. Send a prompt to create videos.</EmptyState>
              ) : (
                videoParagraphs?.map((para, idx) => (
                  <VideoCard
                    key={`${slideData.id}-vid-${idx}`}
                    $active={para?.projectParagraphId === slideData?.projectParagraphId}
                    onClick={() => {
                      setPendingVideo({ paragraphId: para.projectParagraphId, path: para.outputAudio });
                      setShowLockModal(true);
                    }}
                  >
                    <VideoPreview
                      src={`http://192.168.1.80:7132/${para.outputAudio}`}
                      muted
                      preload="metadata"
                      playsInline
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                    />
                    <VideoOverlay>
                      <VideoCardTitle>Video {idx + 1}</VideoCardTitle>
                    </VideoOverlay>
                  </VideoCard>
                ))
              )}
            </VideoList>
          </VideoSection>

          <PopupModel
            open={showLockModal}
            title={
              Number(projectData?.status) === 2
                ? "Stop current generation?"
                : Number(projectData?.status) === 3
                  ? "Discard preview changes?"
                  : "Lock this video?"
            }
            description={
              Number(projectData?.status) === 2
                ? "A video generation process is currently running. Locking this video will stop the current generation process and attach this selected video to the slide. Do you want to continue?"
                : Number(projectData?.status) === 3
                  ? "The current preview changes will be discarded and this selected video will be attached to the slide. Do you want to continue?"
                  : "This video will be attached to the current slide and won't be replaced automatically."
            }
            confirmText={
              Number(projectData?.status) === 2
                ? "Stop & Lock Video"
                : Number(projectData?.status) === 3
                  ? "Discard & Lock Video"
                  : "Lock Video"
            }
            cancelText="Cancel"
            onClose={handleCancelLock}
            onConfirm={handleConfirmLock}
          />

          {/* Desktop: vertical tab when video panel is hidden */}
          {!videoSectionVisible && (
            <VideoToggleTabDesktop onClick={() => setVideoSectionVisible(true)} title="Show Videos">
              <VideoThumbIcon />
              <VideoToggleLabel>Videos</VideoToggleLabel>
            </VideoToggleTabDesktop>
          )}
        </ChatSection>

        {/* Mobile: floating button when video section is hidden */}
        {!videoSectionVisible && (
          <FloatingVideoButton onClick={() => setVideoSectionVisible(true)} title="Show Videos">
            <VideoThumbIcon />
            <span>Videos</span>
          </FloatingVideoButton>
        )}

        {/* ── Chat Input ── */}
        <InputArea>
          <ChatInput
            value={prompt}
            width="100%"
            minHeight="40px"
            maxHeight="140px"
            chips={chips}
            attachedFiles={attachedFiles}
            setAttachedFiles={setAttachedFiles}
            onChange={setPrompt}
            onSend={handleSend}
            onSelectModel={setSelectedModel}
            selectedModel={selectedModel}
            models={models}
            placeholder="Describe the video you want to create..."
          />
        </InputArea>
      </PanelBody>

      {/* ── Lightbox ── */}
      {expandedImage && (
        <Lightbox onClick={() => setExpandedImage(null)}>
          <LightboxImage src={expandedImage} alt="expanded" onClick={(e) => e.stopPropagation()} />
          <LightboxClose onClick={() => setExpandedImage(null)}>
            <CloseIcon />
          </LightboxClose>
        </Lightbox>
      )}
    </LeftPanel>
  );
};

// ─── Animations ───────────────────────────────────────────────────────────────

const bounce = keyframes`
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40%            { transform: translateY(-5px); opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.97); }
  to   { opacity: 1; transform: scale(1); }
`;

// ─── Layout ───────────────────────────────────────────────────────────────────

const LeftPanel = styled.div`
  flex: 0 0 40%;
  max-width: 40%;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background-color: ${({ theme }) => theme.primaryBackground};
  border-right: 1px solid ${({ theme }) => theme.chatTextfieldBorder};
  flex-shrink: 0;
  position: relative;

  /* ── Large tablet (769–1024px) ── */
  @media (max-width: 1024px) {
    flex: 0 0 45%;
    max-width: 45%;
    min-width: 280px;
  }

  /* ── Tablet / mobile (≤768px): full-width stacked panel ── */
  @media (max-width: 768px) {
    flex: none;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    /* Fixed height so it doesn't collapse; adjust to taste */
    height: 55vh;
    min-height: 320px;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.chatTextfieldBorder};
  }

  /* ── Small mobile (≤480px) ── */
  @media (max-width: 480px) {
    height: 60vh;
    min-height: 300px;
  }
`;

const LeftHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 13px;
  border-bottom: 1px solid ${({ theme }) => theme.chatTextfieldBorder};
  flex-shrink: 0;
  gap: 10px;

  @media (max-width: 480px) {
    padding: 10px 12px;
  }
`;

const HeaderTitle = styled.span`
  font-family: "Montserrat", sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: ${({ theme }) => theme.primaryText};
  flex: 1;
  letter-spacing: -0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const VideoHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
`;

const ActionBtn = styled.button`
  all: unset;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  color: ${({ theme }) => theme.primaryText};
  opacity: 0.55;
  transition: opacity 0.15s, background 0.15s;
  &:hover {
    opacity: 1;
    background: rgba(128, 128, 128, 0.1);
  }
`;

// ─── Body ─────────────────────────────────────────────────────────────────────

const PanelBody = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const ChatSection = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;

  /* ── Mobile: stack chat above video strip ── */
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ChatColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  min-height: 50px;
  max-height: 50px;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid ${({ theme }) => theme.chatTextfieldBorder};
  flex-shrink: 0;
  background: ${({ theme }) => theme.primaryBackground};

  @media (max-width: 480px) {
    min-height: 42px;
    max-height: 42px;
    padding: 8px 12px;
  }
`;

const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: "Montserrat", sans-serif;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.editorFileUpload};
`;

// ─── Chat messages ─────────────────────────────────────────────────────────────

const ChatMessages = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 14px 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-behavior: smooth;

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.chatTextfieldBorder};
    border-radius: 20px;
  }

  @media (max-width: 480px) {
    padding: 10px 10px 6px;
    gap: 10px;
  }
`;

const ConversationPair = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: ${fadeIn} 0.22s ease;
`;

const EmptyState = styled.p`
  font-family: "Montserrat", sans-serif;
  font-size: 10px;
  color: ${({ theme }) => theme.editorFileUpload};
  opacity: 0.6;
  text-align: center;
  padding: 20px 12px;
  line-height: 1.5;
`;

const MessageRow = styled.div<{ $role: "user" | "ai" }>`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex-direction: ${({ $role }) => ($role === "user" ? "row-reverse" : "row")};
`;

const Avatar = styled.div`
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  margin-bottom: 2px;
`;

const MessageBubble = styled.div<{ $role: "user" | "ai" }>`
  max-width: 75%;
  padding: 9px 12px 6px;
  border-radius: ${({ $role }) => ($role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px")};
  background: ${({ theme }) => theme.messageBackground};
  display: flex;
  flex-direction: column;
  gap: 6px;

  /* On mobile give a bit more room */
  @media (max-width: 480px) {
    max-width: 85%;
    padding: 8px 10px 5px;
  }
`;

const VideoContainer = styled.div<{ $active: boolean }>`
  width: 100%;
  max-width: 320px;
  border-radius: 12px;
  overflow: hidden;
  background: ${({ theme }) =>
    theme.primaryBackground === "#F0F0F3" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.25)"};

  video {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 12px;
  }

  /* Ensure video doesn't overflow on small screens */
  @media (max-width: 480px) {
    max-width: 240px;
  }
`;

const BubbleText = styled.p`
  margin: 0;
  font-family: "Montserrat", sans-serif;
  font-size: 12px;
  line-height: 1.55;
  color: ${({ theme }) => theme.chatText};
  word-break: break-word;
`;

const Timestamp = styled.span`
  font-family: "Montserrat", sans-serif;
  font-size: 9px;
  color: ${({ theme }) => theme.primaryText};
  opacity: 0.35;
  align-self: flex-end;
`;

// ─── Image attachments ─────────────────────────────────────────────────────────

const ImageGrid = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: ${({ $count }) =>
    $count === 1 ? "1fr" : $count === 2 ? "1fr 1fr" : "1fr 1fr 1fr"};
  gap: 4px;
  border-radius: 8px;
  overflow: hidden;
  max-width: 220px;

  @media (max-width: 480px) {
    max-width: 180px;
  }
`;

const ImageThumbWrapper = styled.div`
  position: relative;
  cursor: pointer;
  border-radius: 6px;
  overflow: hidden;
  aspect-ratio: 1;

  &:hover > div { opacity: 1; }
`;

const ImageThumb = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.2s ease;
  ${ImageThumbWrapper}:hover & { transform: scale(1.04); }
`;

const ImageOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.18s;
  border-radius: 6px;
`;

// ─── Lightbox ─────────────────────────────────────────────────────────────────

const Lightbox = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 0.18s ease;
`;

const LightboxImage = styled.img`
  max-width: 90%;
  max-height: 90%;
  border-radius: 10px;
  object-fit: contain;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
`;

const LightboxClose = styled.button`
  all: unset;
  cursor: pointer;
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: background 0.15s;
  &:hover { background: rgba(255, 255, 255, 0.22); }
`;

// ─── Typing indicator ─────────────────────────────────────────────────────────

const TypingDots = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 2px;
`;

const Dot = styled.span<{ $delay: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.activeMenu};
  animation: ${bounce} 1.2s ease infinite;
  animation-delay: ${({ $delay }) => $delay};
`;

// ─── Input area ───────────────────────────────────────────────────────────────

const InputArea = styled.div`
  padding: 10px 12px 12px;
  flex-shrink: 0;
  border-top: 1px solid ${({ theme }) => theme.chatTextfieldBorder};

  @media (max-width: 480px) {
    padding: 8px 10px 10px;
  }
`;

// ─── Video side panel ─────────────────────────────────────────────────────────

const VideoSection = styled.div<{ $visible: boolean }>`
  flex: 0 0 ${({ $visible }) => ($visible ? "32%" : "0%")};
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border-left: ${({ $visible, theme }) => ($visible ? `1px solid ${theme.chatTextfieldBorder}` : "none")};
  min-width: ${({ $visible }) => ($visible ? "180px" : "0")};
  transition: flex 0.22s ease, min-width 0.22s ease;

  /* ── Tablet: horizontal strip below chat ── */
  @media (max-width: 768px) {
    flex: none;
    width: 100%;
    min-width: 0;
    /* Fixed height strip; collapses when hidden */
    height: ${({ $visible }) => ($visible ? "200px" : "0")};
    border-left: none;
    border-top: ${({ $visible, theme }) => ($visible ? `1px solid ${theme.chatTextfieldBorder}` : "none")};
    transition: height 0.22s ease;
    overflow: ${({ $visible }) => ($visible ? "hidden" : "hidden")};
  }

  /* ── Small mobile ── */
  @media (max-width: 480px) {
    height: ${({ $visible }) => ($visible ? "180px" : "0")};
  }
`;

const VideoList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 10px 12px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.chatTextfieldBorder};
    border-radius: 4px;
  }

  /* On mobile, lay cards out in a horizontal row for the strip */
  @media (max-width: 768px) {
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 8px 10px;
    gap: 8px;
  }
`;

const VideoCard = styled.button<{ $active: boolean }>`
  all: unset;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100%;
  min-height: 110px;
  border-radius: 14px;
  border: 2px solid ${({ $active, theme }) => ($active ? theme.activeMenu : "transparent")};
  background: #000;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover { transform: translateY(-2px); }

  /* On mobile: fixed-width cards in horizontal scroll */
  @media (max-width: 768px) {
    width: 140px;
    min-height: 90px;
    border-radius: 10px;
  }

  @media (max-width: 480px) {
    width: 120px;
    min-height: 80px;
  }
`;

const VideoPreview = styled.video`
  width: 100%;
  height: 110px;
  object-fit: cover;
  display: block;
  background: #000;

  @media (max-width: 768px) {
    height: 90px;
  }

  @media (max-width: 480px) {
    height: 80px;
  }
`;

const VideoOverlay = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0));
  display: flex;
  align-items: flex-end;

  @media (max-width: 768px) {
    padding: 8px;
  }
`;

const VideoCardTitle = styled.p`
  margin: 0;
  font-family: "Montserrat", sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);

  @media (max-width: 480px) {
    font-size: 10px;
  }
`;

// ─── Video toggle tab (desktop only) ─────────────────────────────────────────

const VideoToggleTabDesktop = styled.button`
  all: unset;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 28px;
  flex-shrink: 0;
  border-left: 1px solid ${({ theme }) => theme.chatTextfieldBorder};
  background: transparent;
  color: ${({ theme }) => theme.editorFileUpload};
  opacity: 0.7;
  transition: opacity 0.15s, background 0.15s;
  padding: 12px 0;

  &:hover {
    opacity: 1;
    background: rgba(128, 128, 128, 0.06);
  }

  /* Hide on mobile — FloatingVideoButton is used instead */
  @media (max-width: 768px) {
    display: none;
  }
`;

const VideoToggleLabel = styled.span`
  font-family: "Montserrat", sans-serif;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
`;

// ─── Floating button (mobile only) ───────────────────────────────────────────

const FloatingVideoButton = styled.button`
  display: none;

  @media (max-width: 768px) {
    all: unset;
    position: fixed;
    right: 14px;
    bottom: 90px;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 999px;
    cursor: pointer;
    background: ${({ theme }) =>
    theme.primaryBackground === "#F0F0F3" ? "rgba(255,255,255,0.95)" : "rgba(24,24,28,0.95)"};
    border: 1px solid ${({ theme }) => theme.chatTextfieldBorder};
    color: ${({ theme }) => theme.primaryText};
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
    backdrop-filter: blur(10px);
    font-family: "Montserrat", sans-serif;
    font-size: 12px;
    font-weight: 600;
  }
`;

// ─── Status badge ─────────────────────────────────────────────────────────────

const SlideStatusBadge = styled.div<{
  $status: "draft" | "active" | "inactive";
}>`
  padding: 4px 10px;
  border-radius: 999px;
  font-family: "Montserrat", sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
  flex-shrink: 0;

  background: ${({ $status }) => {
    switch ($status) {
      case "draft":
        return "rgba(255, 159, 67, 0.12)";
      case "active":
        return "rgba(52, 199, 89, 0.12)";
      case "inactive":
        return "rgba(255, 77, 79, 0.12)";
    }
  }};

  color: ${({ $status }) => {
    switch ($status) {
      case "draft":
        return "#FF9F43";
      case "active":
        return "#34C759";
      case "inactive":
        return "#FF4D4F";
    }
  }};

  border: 1px solid
    ${({ $status }) => {
    switch ($status) {
      case "draft":
        return "rgba(255, 159, 67, 0.3)";
      case "active":
        return "rgba(52, 199, 89, 0.3)";
      case "inactive":
        return "rgba(255, 77, 79, 0.3)";
    }
  }};

  @media (max-width: 480px) {
    padding: 3px 8px;
    font-size: 10px;
  }
`;

// ─── Error display ─────────────────────────────────────────────────────────────

const ErrorContainer = styled.div`
  padding: 12px;
  border-radius: 12px;
  background: #2a1f1f;
  border: 1px solid #ff4d4f;
  color: #ff6b6b;
  min-width: 220px;
  max-width: 85%;

  @media (max-width: 480px) {
    min-width: 160px;
    padding: 10px;
  }
`;

const ErrorTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

const ErrorMessage = styled.div`
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.8;
  line-height: 1.5;

  @media (max-width: 480px) {
    font-size: 11px;
  }
`;

// ─── Unused modal stubs (kept for reference, removed from render) ──────────────

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ModalCard = styled.div`
  width: 360px;
  max-width: calc(100vw - 32px);
  padding: 20px;
  border-radius: 16px;
  background: ${({ theme }) => theme.primaryBackground};
  border: 1px solid ${({ theme }) => theme.chatTextfieldBorder};
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
`;

const ModalTitle = styled.h3`
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.primaryText};
  font-family: "Montserrat", sans-serif;
`;

const ModalText = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: ${({ theme }) => theme.editorFileUpload};
  font-family: "Montserrat", sans-serif;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
`;

const ModalButton = styled.button`
  border: none;
  outline: none;
  cursor: pointer;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  font-family: "Montserrat", sans-serif;
  transition: all 0.18s ease;
  &:active { transform: scale(0.96); }
`;

const CancelBtn = styled(ModalButton)`
  background: ${({ theme }) => theme.editorDropDownContent};
  color: ${({ theme }) => theme.primaryText};
  &:hover { opacity: 0.9; }
`;

const ConfirmBtn = styled(ModalButton)`
  background: ${({ theme }) => theme.activeMenu};
  color: white;
  &:hover { transform: translateY(-1px); }
`;

export default LeftPanelSide;
