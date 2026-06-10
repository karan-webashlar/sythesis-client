/* eslint-disable prettier/prettier */
import withPrivateRoute from "../../hocs/withPrivateRoute";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import LeftPanelSide from "./components/LeftPanel";
import RightPanelSide from "./components/RightPanel";
import HeaderActions from "./components/HeaderActions";
import LeftSideProfileSection from "./components/LeftSideProfileSection";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getProject, getProjectLoading } from "../../redux/reducers/projectReducer";
import { getVideoByProjectIdServer } from "../../redux/actions/projectAction";
import CircularProgress from "../../components/Icons/CircularProgress";

const Project = () => {
  const dispatch = useDispatch();
  const { projectId } = useParams();

  const projectData = useSelector(getProject);
  const [slides, setSlides] = useState<any[]>([]);
  const [selectedSlide, setSelectedSlide] = useState<any>(null);
  const isLoading = useSelector(getProjectLoading);

  useEffect(() => {
    if (projectId) {
      dispatch(getVideoByProjectIdServer(Number(projectId)));
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectData) return;

    const projectSlides: any[] = projectData?.slides || [];
    setSlides(projectSlides);

    setSelectedSlide((prev: any) => {
      if (prev?.slideId) {
        const updatedCurrentSlide = projectSlides.find(
          (slide: any) => slide.slideId === prev.slideId
        );
        return updatedCurrentSlide || projectSlides[projectSlides.length - 1] || projectSlides[0] || null;
      }
      return projectSlides[projectSlides.length - 1] || projectSlides[0] || null;
    });
  }, [projectData]);

  return (
    <Wrapper>
      {isLoading ? (
        <LoaderWrapper>
          <CircularProgress />
        </LoaderWrapper>
      ) : (
        <>
          <HeaderActions />
          <PageLayout>
            <LeftSideProfileSection />
            <LeftPanelSide />
            <RightPanelSide />
          </PageLayout>
        </>
      )}
    </Wrapper>
  );
};

export default withPrivateRoute(Project);

// ─── Styles ───────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${({ theme }) => theme.primaryBackground};

  /* ── Tablet (≤768px): let content scroll naturally ── */
  @media (max-width: 768px) {
    height: 100dvh;          /* use dvh so mobile browser chrome is accounted for */
    overflow: hidden;        /* keep hidden — PageLayout handles its own scroll */
  }

  /* ── Small mobile ── */
  @media (max-width: 480px) {
    height: 100dvh;
  }
`;

const PageLayout = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;

  /* ── Tablet (≤768px): stack sidebar + panels vertically, full scroll ── */
  @media (max-width: 768px) {
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: auto;
    /* Smooth momentum scrolling on iOS */
    -webkit-overflow-scrolling: touch;

    /* Custom scrollbar — thin, unobtrusive */
    scrollbar-width: thin;
    scrollbar-color: rgba(128, 128, 128, 0.25) transparent;
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(128, 128, 128, 0.25);
      border-radius: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }
`;

const LoaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  /* Center in the full viewport, not just the positioned parent */
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: ${({ theme }) => theme.primaryBackground};
  opacity: 0.85;
`;
