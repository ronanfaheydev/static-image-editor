import { useState, useCallback, useRef, useEffect } from "react";
import { AnimationState, Timeline, Keyframe } from "../types/animation";
import { EditorObjectBase } from "../types/editor";
import Konva from "konva";

export const useAnimation = (
  objects: EditorObjectBase[],
  onChange: (id: string, changes: Partial<EditorObjectBase>) => void,
  stageRef: React.RefObject<Konva.Stage>
) => {
  // Keep state for UI updates
  const [uiState, setUiState] = useState<{
    isPlaying: boolean;
    currentTime: number;
  }>({
    isPlaying: false,
    currentTime: 0,
  });

  // Use ref for animation state to avoid re-renders
  const animationStateRef = useRef<AnimationState>({
    isPlaying: false,
    currentTime: 0,
    duration: 10000, // 10 seconds
    timelines: [],
  });

  const animationRef = useRef<Konva.Animation | null>(null);
  const lastFrameTime = useRef<number>(0);

  //  interpolation functions
  const interpolateProperties = (
    startKeyframe: Keyframe,
    endKeyframe: Keyframe,
    time: number
  ) => {
    return {
      position: {
        x:
          startKeyframe.properties.position.x +
          (endKeyframe.properties.position.x -
            startKeyframe.properties.position.x) *
            (time / (endKeyframe.time - startKeyframe.time)),
        y:
          startKeyframe.properties.position.y +
          (endKeyframe.properties.position.y -
            startKeyframe.properties.position.y) *
            (time / (endKeyframe.time - startKeyframe.time)),
      },
      size: {
        width:
          startKeyframe.properties.size.width +
          (endKeyframe.properties.size.width -
            startKeyframe.properties.size.width) *
            (time / (endKeyframe.time - startKeyframe.time)),
        height:
          startKeyframe.properties.size.height +
          (endKeyframe.properties.size.height -
            startKeyframe.properties.size.height) *
            (time / (endKeyframe.time - startKeyframe.time)),
      },
      rotation:
        startKeyframe.properties.rotation +
        (endKeyframe.properties.rotation - startKeyframe.properties.rotation) *
          (time / (endKeyframe.time - startKeyframe.time)),
      opacity:
        startKeyframe.properties.opacity +
        (endKeyframe.properties.opacity - startKeyframe.properties.opacity) *
          (time / (endKeyframe.time - startKeyframe.time)),
      fill: startKeyframe.properties.fill,
      stroke: startKeyframe.properties.stroke,
    };
  };

  const updateAnimation = useCallback(
    (frame: Konva.Frame) => {
      if (!animationStateRef.current.isPlaying) return;

      // Calculate new time based on frame.timeDiff
      const newTime =
        (animationStateRef.current.currentTime + frame.timeDiff) %
        animationStateRef.current.duration;

      // Update ref
      animationStateRef.current.currentTime = newTime;

      // Update UI state less frequently (e.g., every 30ms)
      if (frame.time - lastFrameTime.current > 30) {
        setUiState((prev) => ({
          ...prev,
          currentTime: newTime,
        }));
        lastFrameTime.current = frame.time;
      }

      // Update each object with interpolated properties
      animationStateRef.current.timelines.forEach((timeline) => {
        const object = objects.find((obj) => obj.id === timeline.objectId);
        if (!object) return;

        const keyframes = timeline.keyframes.sort((a, b) => a.time - b.time);
        const currentKeyframeIndex = keyframes.findIndex(
          (k) => k.time > newTime
        );

        if (currentKeyframeIndex === -1) return;

        const startKeyframe = keyframes[currentKeyframeIndex - 1];
        const endKeyframe = keyframes[currentKeyframeIndex];

        if (!startKeyframe || !endKeyframe) return;

        const interpolatedProps = interpolateProperties(
          startKeyframe,
          endKeyframe,
          newTime
        );

        console.log(interpolatedProps);

        onChange(object.id, interpolatedProps);
      });

      return true;
    },
    [objects, onChange]
  );

  const togglePlayback = useCallback(() => {
    const newIsPlaying = !animationStateRef.current.isPlaying;

    if (newIsPlaying && stageRef.current) {
      animationRef.current = new Konva.Animation(
        updateAnimation,
        stageRef.current.getLayers()
      );

      animationRef.current.start();
    } else if (animationRef.current) {
      animationRef.current.stop();
    }

    // Update both ref and UI state
    animationStateRef.current.isPlaying = newIsPlaying;
    setUiState((prev) => ({ ...prev, isPlaying: newIsPlaying }));
  }, [stageRef, updateAnimation]);

  const addKeyframe = useCallback(
    (objectId: string, time: number, properties: Keyframe["properties"]) => {
      const timeline = animationStateRef.current.timelines.find(
        (t) => t.objectId === objectId
      );

      const keyframe: Keyframe = {
        id: `keyframe-${Date.now()}`,
        time,
        properties,
      };

      if (timeline) {
        timeline.keyframes.push(keyframe);
      } else {
        animationStateRef.current.timelines.push({
          id: `timeline-${Date.now()}`,
          objectId,
          keyframes: [keyframe],
          duration: animationStateRef.current.duration,
        });
      }

      // Force UI update
      setUiState((prev) => ({ ...prev }));
    },
    []
  );

  const updateKeyframe = useCallback(
    (
      timelineId: string,
      keyframeId: string,
      properties: Keyframe["properties"]
    ) => {
      animationStateRef.current.timelines.forEach((timeline) => {
        if (timeline.id === timelineId) {
          timeline.keyframes.forEach((kf) => {
            if (kf.id === keyframeId) {
              kf.properties = properties;
            }
          });
        }
      });
      setUiState((prev) => ({ ...prev }));
    },
    []
  );

  const deleteKeyframe = useCallback(
    (timelineId: string, keyframeId: string) => {
      animationStateRef.current.timelines.forEach((timeline) => {
        if (timeline.id === timelineId) {
          timeline.keyframes = timeline.keyframes.filter(
            (kf) => kf.id !== keyframeId
          );
        }
      });
      setUiState((prev) => ({ ...prev }));
    },
    []
  );

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  return {
    // Return UI state for components
    animationState: animationStateRef.current,
    isPlaying: uiState.isPlaying,
    currentTime: uiState.currentTime,
    duration: animationStateRef.current.duration,
    timelines: animationStateRef.current.timelines,

    // Return handlers
    addKeyframe,
    updateKeyframe,
    deleteKeyframe,
    togglePlayback,
    setCurrentTime: (time: number) => {
      animationStateRef.current.currentTime = time;
      setUiState((prev) => ({ ...prev, currentTime: time }));
      // Update objects immediately
      updateAnimation({ timeDiff: 0, time, lastTime: 0, frameRate: 0 });
    },
  };
};
