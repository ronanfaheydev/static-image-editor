import { useState, useCallback, useRef, useEffect } from "react";
import { AnimationState, Timeline, Keyframe } from "../types/animation";
import { EditorObjectBase } from "../types/editor";

export const useAnimation = (
  objects: EditorObjectBase[],
  onChange: (id: string, changes: Partial<EditorObjectBase>) => void
) => {
  const [animationState, setAnimationState] = useState<AnimationState>({
    isPlaying: false,
    currentTime: 0,
    duration: 10000, // 10 seconds
    timelines: [],
  });

  const animationFrameRef = useRef<number>(0);

  const interpolateValue = (start: number, end: number, progress: number) => {
    return start + (end - start) * progress;
  };

  const hexToRGB = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const interpolateProperties = (
    startKeyframe: Keyframe,
    endKeyframe: Keyframe,
    currentTime: number
  ) => {
    const progress =
      (currentTime - startKeyframe.time) /
      (endKeyframe.time - startKeyframe.time);

    const properties: Keyframe["properties"] = {};

    // Position interpolation
    if (startKeyframe.properties.position && endKeyframe.properties.position) {
      properties.position = {
        x: interpolateValue(
          startKeyframe.properties.position.x,
          endKeyframe.properties.position.x,
          progress
        ),
        y: interpolateValue(
          startKeyframe.properties.position.y,
          endKeyframe.properties.position.y,
          progress
        ),
      };
    }

    // Fill (background) color interpolation
    if (
      typeof startKeyframe.properties.fill === "string" &&
      typeof endKeyframe.properties.fill === "string"
    ) {
      // Convert hex colors to RGB for interpolation
      const startRGB = hexToRGB(startKeyframe.properties.fill);
      const endRGB = hexToRGB(endKeyframe.properties.fill);

      if (startRGB && endRGB) {
        const r = Math.round(interpolateValue(startRGB.r, endRGB.r, progress));
        const g = Math.round(interpolateValue(startRGB.g, endRGB.g, progress));
        const b = Math.round(interpolateValue(startRGB.b, endRGB.b, progress));
        properties.fill = rgbToHex(r, g, b);
      }
    }

    // Stroke color interpolation
    if (
      typeof startKeyframe.properties.stroke === "string" &&
      typeof endKeyframe.properties.stroke === "string"
    ) {
      const startRGB = hexToRGB(startKeyframe.properties.stroke);
      const endRGB = hexToRGB(endKeyframe.properties.stroke);

      if (startRGB && endRGB) {
        const r = Math.round(interpolateValue(startRGB.r, endRGB.r, progress));
        const g = Math.round(interpolateValue(startRGB.g, endRGB.g, progress));
        const b = Math.round(interpolateValue(startRGB.b, endRGB.b, progress));
        properties.stroke = rgbToHex(r, g, b);
      }
    }

    // Stroke width interpolation
    if (
      typeof startKeyframe.properties.strokeWidth === "number" &&
      typeof endKeyframe.properties.strokeWidth === "number"
    ) {
      properties.strokeWidth = interpolateValue(
        startKeyframe.properties.strokeWidth,
        endKeyframe.properties.strokeWidth,
        progress
      );
    }

    // Size interpolation
    if (startKeyframe.properties.size && endKeyframe.properties.size) {
      properties.size = {
        width: interpolateValue(
          startKeyframe.properties.size.width,
          endKeyframe.properties.size.width,
          progress
        ),
        height: interpolateValue(
          startKeyframe.properties.size.height,
          endKeyframe.properties.size.height,
          progress
        ),
      };
    }

    // Rotation interpolation
    if (
      typeof startKeyframe.properties.rotation === "number" &&
      typeof endKeyframe.properties.rotation === "number"
    ) {
      properties.rotation = interpolateValue(
        startKeyframe.properties.rotation,
        endKeyframe.properties.rotation,
        progress
      );
    }

    // Opacity interpolation
    if (
      typeof startKeyframe.properties.opacity === "number" &&
      typeof endKeyframe.properties.opacity === "number"
    ) {
      properties.opacity = interpolateValue(
        startKeyframe.properties.opacity,
        endKeyframe.properties.opacity,
        progress
      );
    }

    // Scale interpolation
    if (startKeyframe.properties.scale && endKeyframe.properties.scale) {
      properties.scale = {
        x: interpolateValue(
          startKeyframe.properties.scale.x,
          endKeyframe.properties.scale.x,
          progress
        ),
        y: interpolateValue(
          startKeyframe.properties.scale.y,
          endKeyframe.properties.scale.y,
          progress
        ),
      };
    }

    return properties;
  };

  const updateAnimation = useCallback(
    (time: number) => {
      animationState.timelines.forEach((timeline) => {
        const object = objects.find((obj) => obj.id === timeline.objectId);
        if (!object) return;

        // Find the surrounding keyframes
        const keyframes = timeline.keyframes.sort((a, b) => a.time - b.time);
        const currentKeyframeIndex = keyframes.findIndex((k) => k.time > time);

        if (currentKeyframeIndex === -1) return;

        const startKeyframe = keyframes[currentKeyframeIndex - 1];
        const endKeyframe = keyframes[currentKeyframeIndex];

        if (!startKeyframe || !endKeyframe) return;

        const interpolatedProps = interpolateProperties(
          startKeyframe,
          endKeyframe,
          time
        );

        onChange(object.id, interpolatedProps);
      });
    },
    [objects, animationState.timelines, onChange]
  );

  const animate = useCallback(
    (timestamp: number) => {
      if (!animationState.isPlaying) return;

      const newTime =
        (animationState.currentTime + 16.67) % animationState.duration;
      setAnimationState((prev) => ({ ...prev, currentTime: newTime }));
      updateAnimation(newTime);

      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [
      animationState.isPlaying,
      animationState.currentTime,
      animationState.duration,
      updateAnimation,
    ]
  );

  useEffect(() => {
    if (animationState.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationState.isPlaying, animate]);

  const addKeyframe = useCallback(
    (objectId: string, time: number, properties: Keyframe["properties"]) => {
      setAnimationState((prev) => {
        const timeline = prev.timelines.find((t) => t.objectId === objectId);
        const keyframe: Keyframe = {
          id: `keyframe-${Date.now()}`,
          time,
          properties,
        };

        if (timeline) {
          // Add keyframe to existing timeline
          return {
            ...prev,
            timelines: prev.timelines.map((t) =>
              t.id === timeline.id
                ? { ...t, keyframes: [...t.keyframes, keyframe] }
                : t
            ),
          };
        } else {
          // Create new timeline for object
          const newTimeline: Timeline = {
            id: `timeline-${Date.now()}`,
            objectId,
            keyframes: [keyframe],
            duration: prev.duration,
          };
          return {
            ...prev,
            timelines: [...prev.timelines, newTimeline],
          };
        }
      });
    },
    []
  );

  const updateKeyframe = useCallback(
    (
      timelineId: string,
      keyframeId: string,
      properties: Keyframe["properties"]
    ) => {
      setAnimationState((prev) => ({
        ...prev,
        timelines: prev.timelines.map((timeline) =>
          timeline.id === timelineId
            ? {
                ...timeline,
                keyframes: timeline.keyframes.map((keyframe) =>
                  keyframe.id === keyframeId
                    ? { ...keyframe, properties }
                    : keyframe
                ),
              }
            : timeline
        ),
      }));
    },
    []
  );

  const deleteKeyframe = useCallback(
    (timelineId: string, keyframeId: string) => {
      setAnimationState((prev) => ({
        ...prev,
        timelines: prev.timelines.map((timeline) =>
          timeline.id === timelineId
            ? {
                ...timeline,
                keyframes: timeline.keyframes.filter(
                  (k) => k.id !== keyframeId
                ),
              }
            : timeline
        ),
      }));
    },
    []
  );

  const togglePlayback = useCallback(() => {
    setAnimationState((prev) => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  }, []);

  return {
    animationState,
    addKeyframe,
    updateKeyframe,
    deleteKeyframe,
    togglePlayback,
    setCurrentTime: (time: number) =>
      setAnimationState((prev) => ({ ...prev, currentTime: time })),
  };
};
