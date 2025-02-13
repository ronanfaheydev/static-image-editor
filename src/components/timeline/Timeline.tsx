import React, { useCallback, useState } from "react";
import { Timeline, Keyframe } from "../../types/animation";
import { EditorObjectBase } from "../../types/editor";
import "./Timeline.scss";

interface TimelineProps {
  objects: EditorObjectBase[];
  timelines: Timeline[];
  currentTime: number;
  duration: number;
  onTimeChange: (time: number) => void;
  onKeyframeAdd: (
    objectId: string,
    time: number,
    properties: Keyframe["properties"]
  ) => void;
  onKeyframeUpdate: (
    timelineId: string,
    keyframeId: string,
    properties: Keyframe["properties"]
  ) => void;
  onKeyframeDelete: (timelineId: string, keyframeId: string) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onObjectSelect: (objectId: string) => void;
}

export const TimelineComponent: React.FC<TimelineProps> = ({
  objects,
  timelines,
  currentTime,
  duration,
  onTimeChange,
  onKeyframeAdd,
  onKeyframeUpdate,
  onKeyframeDelete,
  isPlaying,
  onPlayPause,
  onObjectSelect,
}) => {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * duration;
    onTimeChange(time);
  };

  const handleAddKeyframe = useCallback(() => {
    if (!selectedObjectId) return;

    const object = objects.find((obj) => obj.id === selectedObjectId);
    if (!object) return;

    onKeyframeAdd(selectedObjectId, currentTime, {
      position: object.position,
      size: object.size,
      rotation: object.rotation,
      opacity: object.opacity,
    });
  }, [selectedObjectId, currentTime, objects, onKeyframeAdd]);

  return (
    <div className="timeline">
      <div className="timeline-header">
        <div className="timeline-controls">
          <button onClick={onPlayPause}>{isPlaying ? "Pause" : "Play"}</button>
          <button onClick={handleAddKeyframe}>Add Keyframe</button>
        </div>

        <div className="timeline-ruler">
          {Array.from({ length: duration / 1000 }).map((_, i) => (
            <div key={i} className="timeline-marker">
              {i}s
            </div>
          ))}
        </div>
      </div>

      <div className="timeline-objects">
        {objects.map((obj) => {
          const timeline = timelines.find((t) => t.objectId === obj.id);

          return (
            <div
              key={obj.id}
              className={`timeline-row ${
                selectedObjectId === obj.id ? "selected" : ""
              }`}
              onClick={() => {
                setSelectedObjectId(obj.id);
                onObjectSelect(obj.id);
              }}
            >
              <div className="object-label">{obj.name}</div>
              <div className="timeline-track" onClick={handleTimelineClick}>
                {timeline?.keyframes.map((keyframe) => (
                  <div
                    key={keyframe.id}
                    className="keyframe"
                    style={{ left: `${(keyframe.time / duration) * 100}%` }}
                    onClick={() => {
                      onKeyframeDelete(timeline?.id, keyframe.id);
                    }}
                  />
                ))}
                <div
                  className="timeline-cursor"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
