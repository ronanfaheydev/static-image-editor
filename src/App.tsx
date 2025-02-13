import { useState, useCallback, useRef, useEffect } from "react";
import {
  EditorObjectBase,
  ImageObject,
  TextObject,
  ShapeObject,
  FormatEditMode,
  BlendMode,
  GroupObject,
  EditorState,
} from "./types/editor";
import {
  DialogState,
  DialogKey,
  PositionProp,
  EditorObjectKey,
} from "./types/project";
import "./App.scss";
import { useHistory } from "./hooks/useHistory";
import { useHotkeys } from "react-hotkeys-hook";
import { LayerPanel } from "./components/LayerPanel";
import { PropertyPanel } from "./components/PropertyPanel";
import { Format, DEFAULT_FORMATS } from "./types/format";
import { Template } from "./types/template";
import { KonvaEventObject } from "konva/lib/Node";
import { Project } from "./types/project";
import { Toolbar } from "./components/toolbar/Toolbar";
import { Canvas } from "./components/Canvas";
import { useContainerSize } from "./hooks/useContainerSize";
import { ResizeHandle } from "./components/ResizeHandle";
import type Konva from "konva";
import { DialogManager } from "./components/toolbar/DialogManager";
import { MediaItem } from "./types/media";
import { useAnimation } from "./hooks/useAnimation";
import { TimelineComponent } from "./components/timeline/Timeline";

function App() {
  const mainContentRef = useRef<HTMLDivElement | null>(null);
  const { width: containerWidth, height: containerHeight } =
    useContainerSize(mainContentRef);

  // Editor state
  const [editorState, setEditorState] = useState<EditorState>({
    selectedIds: [],
    tool: "select",
    zoom: 0.8,
    formatEditMode: "single",
    backgroundColor: "#ffffff",
    backgroundOpacity: 1,
  });

  // Add format state
  const [currentFormat, setCurrentFormat] = useState<Format>(
    DEFAULT_FORMATS[0]
  );
  const [customFormats, setCustomFormats] = useState<Format[]>([]);

  // Replace objects state with history
  const {
    state: objects,
    setState: setObjects,
    undo,
    redo,
    canUndo,
    canRedo,
    lastModified,
  } = useHistory<EditorObjectBase[]>([
    {
      id: "canvas-background",
      type: "root",
      name: "Canvas",
      visible: true,
      zIndex: 0,
      parentId: null,
      children: [],
      isExpanded: true,
      isRoot: true,
      position: {
        x: Math.max(10, (containerWidth - currentFormat.width) / 2),
        y: Math.max(10, (containerHeight - currentFormat.height) / 2) + 20, // 20 for the title text
      },
      size: currentFormat,
      rotation: 0,
      opacity: editorState.backgroundOpacity,
      blendMode: "normal",
      fill: editorState.backgroundColor,
      stroke: "transparent",
      strokeWidth: 0,
    },
  ]);

  // Add this function before the return statement
  const closeDialogByKey = useCallback((key: DialogKey) => {
    setDialogs((prev) => ({
      ...prev,
      [key]: {
        isOpen: false,
        props: prev[key].props, // Preserve props
      },
    }));
  }, []);

  // Add keyboard shortcuts
  useHotkeys("ctrl+z, cmd+z", (e) => {
    e.preventDefault();
    undo();
  });

  useHotkeys("ctrl+shift+z, cmd+shift+z", (e) => {
    e.preventDefault();
    redo();
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setCurrentFormat(DEFAULT_FORMATS[0]);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle object selection
  const handleSelect = useCallback((objectId: string | null) => {
    setEditorState((prev) => ({
      ...prev,
      selectedIds: objectId ? [objectId] : [],
    }));
  }, []);

  // Handle object changes
  const handleObjectChange = useCallback(
    (id: string, newProps: Partial<EditorObjectBase>) => {
      console.log("handleObjectChange", id, newProps);
      if (editorState.formatEditMode === "single") {
        setObjects((prev) =>
          prev.map((obj) => (obj.id === id ? { ...obj, ...newProps } : obj))
        );
      } else {
        const positionProps: PositionProp[] = ["position", "size", "rotation"];
        const nonPositionProps = Object.keys(newProps).filter(
          (key): key is EditorObjectKey =>
            !positionProps.includes(key as PositionProp)
        );

        if (nonPositionProps.length > 0) {
          const positionChanges = positionProps.reduce<
            Partial<EditorObjectBase>
          >((acc, prop) => {
            if (prop in newProps) {
              acc[prop] = newProps[prop] as any;
            }
            return acc;
          }, {});

          const styleChanges = nonPositionProps.reduce<
            Partial<EditorObjectBase>
          >((acc, prop) => {
            acc[prop] = newProps[prop] as any;
            return acc;
          }, {});

          setObjects((prev) =>
            prev.map((obj) => {
              if (obj.id === id) {
                return { ...obj, ...newProps };
              }
              if (obj.type === objects.find((o) => o.id === id)?.type) {
                return {
                  ...obj,
                  ...styleChanges,
                  ...positionChanges,
                };
              }
              return obj;
            })
          );
        } else {
          setObjects((prev) =>
            prev.map((obj) => (obj.id === id ? { ...obj, ...newProps } : obj))
          );
        }
      }
    },
    [editorState.formatEditMode, objects, setObjects]
  );

  // Handle image upload
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          // Get the canvas center position
          const centerX =
            (containerWidth - currentFormat.width) / 2 +
            currentFormat.width / 2;
          const centerY =
            (containerHeight - currentFormat.height) / 2 +
            currentFormat.height / 2;

          const newImage: ImageObject = {
            id: `image-${Date.now()}`,
            type: "image",
            src: event.target?.result as string,
            position: { x: centerX - 100, y: centerY - 100 }, // Center the image
            size: { width: 200, height: 200 },
            rotation: 0,
            opacity: 1,
            visible: true,
            name: file.name,
            zIndex: objects.length,
            blendMode: "normal",
            parentId: null,
            children: [],
            isExpanded: true,
            isRoot: false,
          };

          setObjects((prev) => [...prev, newImage]);

          // Select the new image immediately
          setEditorState((prev) => ({
            ...prev,
            selectedIds: [newImage.id],
          }));

          // Close the media library dialog
          closeDialogByKey("mediaLibrary");
        };
        reader.readAsDataURL(file);
      }
    },
    [
      containerWidth,
      containerHeight,
      currentFormat,
      objects.length,
      setObjects,
      setEditorState,
      closeDialogByKey,
    ]
  );

  // Handle adding text
  const handleAddText = useCallback(() => {
    const centerX =
      (containerWidth - currentFormat.width) / 2 + currentFormat.width / 2;
    const centerY =
      (containerHeight - currentFormat.height) / 2 + currentFormat.height / 2;

    const newText: TextObject = {
      id: `text-${Date.now()}`,
      type: "text",
      text: "Double click to edit",
      position: { x: centerX - 100, y: centerY - 15 }, // Center the text
      size: { width: 200, height: 30 },
      fontSize: 20,
      fontFamily: "Arial",
      fill: "#000000",
      rotation: 0,
      opacity: 1,
      visible: true,
      name: "New Text",
      zIndex: objects.length,
      blendMode: "normal" as BlendMode,
      parentId: null,
      children: [],
      isExpanded: true,
      isRoot: false,
    };
    setObjects((prev) => [...prev, newText]);
  }, [
    containerWidth,
    containerHeight,
    currentFormat,
    objects.length,
    setObjects,
  ]);

  // Wrap getSelectedObject
  const getSelectedObject = useCallback(() => {
    if (editorState.selectedIds.length === 0) return null;
    return objects.find((obj) => obj.id === editorState.selectedIds[0]) || null;
  }, [editorState.selectedIds, objects]);

  // Wrap createObjectDefaults
  const createObjectDefaults = useCallback(
    (id: string, type: string, index: number) => ({
      id,
      type: "shape",
      visible: true,
      name: `${type || "Object"} ${index}`,
      zIndex: objects.length,
      blendMode: "normal" as BlendMode,
    }),
    [objects.length]
  );

  // Handle adding shape
  const handleAddShape = useCallback(
    (shapeType: ShapeObject["shapeType"]) => {
      const centerX =
        (containerWidth - currentFormat.width) / 2 + currentFormat.width / 2;
      const centerY =
        (containerHeight - currentFormat.height) / 2 + currentFormat.height / 2;

      const id = `shape-${Date.now()}`;
      const newShape: ShapeObject = {
        ...createObjectDefaults(id, shapeType, objects.length),
        id,
        type: "shape",
        shapeType,
        position: { x: centerX - 50, y: centerY - 50 }, // Center the shape
        size: { width: 100, height: 100 },
        fill: "#cccccc",
        stroke: "#000000",
        strokeWidth: 2,
        rotation: 0,
        opacity: 1,
        blendMode: "normal" as BlendMode,
        parentId: null,
        children: [],
        isExpanded: true,
        isRoot: false,
      };
      setObjects((prev) => [...prev, newShape]);
    },
    [
      createObjectDefaults,
      currentFormat,
      containerHeight,
      containerWidth,
      objects.length,
      setObjects,
    ]
  );

  // Handle visibility change
  const handleVisibilityChange = useCallback(
    (id: string, visible: boolean) => {
      setObjects((prev) => {
        // First, recursively get all child IDs
        const getAllChildIds = (objId: string): string[] => {
          const children = prev.filter((obj) => obj.parentId === objId);
          return [
            objId,
            ...children.flatMap((child) => getAllChildIds(child.id)),
          ];
        };

        const idsToUpdate = getAllChildIds(id);

        return prev.map((obj) =>
          idsToUpdate.includes(obj.id) ? { ...obj, visible } : obj
        );
      });
    },
    [setObjects]
  );

  // Handle name change
  const handleNameChange = useCallback(
    (id: string, name: string) => {
      setObjects((prev) =>
        prev.map((obj) => (obj.id === id ? { ...obj, name } : obj))
      );
    },
    [setObjects]
  );

  const stageRef = useRef<Konva.Stage>(null);

  // Handle format edit mode change
  const handleFormatEditModeChange = useCallback((mode: FormatEditMode) => {
    setEditorState((prev) => ({ ...prev, formatEditMode: mode }));
  }, []);

  // Update handleLoadProject to use it
  const handleLoadProject = useCallback(
    (project: Project) => {
      setObjects(project.objects);
      setCurrentFormat(project.currentFormat);
      setCustomFormats(project.customFormats);
      closeDialogByKey("load");
    },
    [setObjects, closeDialogByKey]
  );

  // Update handleTemplateSelect similarly
  const handleTemplateSelect = useCallback(
    (template: Template) => {
      setObjects(template.objects);
      setCurrentFormat(template.format);
      closeDialogByKey("templateBrowser");
    },
    [setObjects, closeDialogByKey]
  );

  // Handle template saved
  const handleTemplateSaved = useCallback(() => {
    alert("Template saved successfully!");
  }, []);

  // Add state for canvas position
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [, setIsDragging] = useState(false);

  // Wrap handleWheel
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = editorState.zoom;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
      const zoom = Math.min(Math.max(newScale, 0.1), 5);

      setEditorState((prev) => ({ ...prev, zoom }));
      setStagePosition({
        x: pointer.x - mousePointTo.x * zoom,
        y: pointer.y - mousePointTo.y * zoom,
      });
    },
    [editorState.zoom]
  );

  // Update drag handlers to check if we're dragging the stage
  const handleDragStart = useCallback((e: KonvaEventObject<DragEvent>) => {
    if (e.target === e.target.getStage()) {
      setIsDragging(true);
    }
  }, []);

  const handleDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    if (e.target === e.target.getStage()) {
      setIsDragging(false);
    }
  }, []);

  const handleDragMove = useCallback((e: KonvaEventObject<DragEvent>) => {
    if (e.target === e.target.getStage()) {
      setStagePosition({
        x: e.target.x(),
        y: e.target.y(),
      });
    }
  }, []);

  const handleMediaLibrarySelect = useCallback(
    (mediaItem: MediaItem) => {
      const centerX =
        (containerWidth - currentFormat.width) / 2 + currentFormat.width / 2;
      const centerY =
        (containerHeight - currentFormat.height) / 2 + currentFormat.height / 2;

      const scaleSize = (format: Format, width: number, height: number) => {
        const w = Math.max(width, format.width);
        const h = w * (height / width);
        return {
          width: w,
          height: h,
        };
      };

      const newImage: ImageObject = {
        id: `image-${Date.now()}`,
        type: "image",
        src: mediaItem.url,
        position: { x: centerX + 100, y: centerY + 100 },
        size: scaleSize(currentFormat, mediaItem.width, mediaItem.height),
        rotation: 0,
        opacity: 1,
        visible: true,
        name: mediaItem.name,
        zIndex: objects.length,
        blendMode: "normal",
        parentId: null,
        children: [],
        isExpanded: false,
        isRoot: false,
      };

      setObjects((prev) => [...prev, newImage]);
      closeDialogByKey("mediaLibrary");
    },
    [
      containerWidth,
      containerHeight,
      currentFormat,
      objects.length,
      closeDialogByKey,
      setObjects,
    ]
  );

  // Add state for dialogs
  const [dialogs, setDialogs] = useState<DialogState>({
    preview: { isOpen: false, props: {} },
    export: {
      isOpen: false,
      props: {
        stage: stageRef.current,
        currentFormat,
        objects,
      },
    },
    save: {
      isOpen: false,
      props: {
        stage: stageRef.current,
        currentFormat,
        customFormats,
        objects,
      },
    },
    load: {
      isOpen: false,
      props: {
        onLoad: handleLoadProject,
      },
    },
    exportJSON: {
      isOpen: false,
      props: {
        project: {
          id: Date.now().toString(),
          name: "Export",
          objects,
          currentFormat,
          customFormats,
          lastModified: new Date(),
        } as Project,
      },
    },
    templateBrowser: {
      isOpen: false,
      props: {
        onSelect: handleTemplateSelect,
      },
    },
    saveTemplate: {
      isOpen: false,
      props: {
        objects,
        currentFormat,
        onSaved: handleTemplateSaved,
      },
    },
    mediaLibrary: {
      isOpen: false,
      props: {
        onSelect: handleMediaLibrarySelect,
      },
    },
  });

  // Update the openDialog function to include props
  const openDialog = useCallback(
    (dialogName: string) => {
      setDialogs((prev) => ({
        ...prev,
        [dialogName]: {
          isOpen: true,
          props: {
            ...prev[dialogName as DialogKey].props,
            stage: stageRef.current,
            currentFormat,
            customFormats,
            objects,
          },
        },
      }));
    },
    [currentFormat, customFormats, objects]
  );

  // Add this function to calculate the zoom level
  const calculateFitZoom = useCallback(
    (format: Format) => {
      if (!containerWidth || !containerHeight) return 0.8; // default zoom

      const minPadding = 20; // 10px on each side
      const horizontalZoom = (containerWidth - minPadding) / format.width;
      const verticalZoom = (containerHeight - minPadding) / format.height;

      return Math.min(horizontalZoom, verticalZoom, 2); // cap at 2x zoom
    },
    [containerWidth, containerHeight]
  );

  // Handle format change
  const handleFormatChange = useCallback(
    (format: Format) => {
      setCurrentFormat(format);
      setEditorState((prev) => ({
        ...prev,
        zoom: calculateFitZoom(format),
      }));

      // Calculate the centered position with minimum padding
      const centerX = Math.max(10, (containerWidth - format.width) / 2);
      const centerY = Math.max(10, (containerHeight - format.height) / 2) + 20; // 20 for the title text

      // Update root group and background layer positions
      setObjects((prev) =>
        prev.map((obj) => {
          if (obj.id === "canvas-background") {
            return {
              ...obj,
              size: format,
              position: { x: centerX, y: centerY },
            };
          }
          return obj;
        })
      );
    },
    [calculateFitZoom, setObjects, containerWidth, containerHeight]
  );

  // Handle custom format add
  const handleCustomFormatAdd = useCallback(
    (format: Format) => {
      setCustomFormats((prev) => [...prev, format]);
      handleFormatChange(format);
    },
    [handleFormatChange]
  );

  // Initialize zoom when container size changes
  useEffect(() => {
    setEditorState((prev) => ({
      ...prev,
      zoom: calculateFitZoom(currentFormat),
    }));
  }, [containerWidth, containerHeight, currentFormat, calculateFitZoom]);

  // Add state for panel widths
  const [leftPanelWidth, setLeftPanelWidth] = useState(250);
  const [rightPanelWidth, setRightPanelWidth] = useState(250);

  const handleLeftPanelResize = useCallback((delta: number) => {
    setLeftPanelWidth((prev) => Math.min(Math.max(prev + delta, 200), 500));
  }, []);

  const handleRightPanelResize = useCallback((delta: number) => {
    setRightPanelWidth((prev) => Math.min(Math.max(prev + delta, 200), 500));
  }, []);

  // Add group creation handler
  const handleAddGroup = useCallback(() => {
    const newGroup: GroupObject = {
      id: `group-${Date.now()}`,
      type: "group",
      name: "New Group",
      visible: true,
      zIndex: objects.length,
      children: [],
      isExpanded: true,
      position: { x: 0, y: 0 },
      size: { width: 0, height: 0 },
      rotation: 0,
      opacity: 1,
      blendMode: "normal",
      parentId: null,
    };
    setObjects((prev) => [...prev, newGroup]);
  }, [objects.length, setObjects]);

  // Update canvas background when editor state changes
  useEffect(() => {
    setObjects((prev) =>
      prev.map((obj) =>
        obj.id === "canvas-background"
          ? {
              ...obj,
              opacity: editorState.backgroundOpacity,
              fill: editorState.backgroundColor,
            }
          : obj
      )
    );
  }, [editorState.backgroundOpacity, editorState.backgroundColor, setObjects]);

  const handleDeleteObject = useCallback(
    (id: string) => {
      setObjects((prev) => {
        // First, recursively get all child IDs
        const getAllChildIds = (objId: string): string[] => {
          const children = prev.filter((obj) => obj.parentId === objId);
          return [
            objId,
            ...children.flatMap((child) => getAllChildIds(child.id)),
          ];
        };

        const idsToRemove = getAllChildIds(id);
        return prev.filter((obj) => !idsToRemove.includes(obj.id));
      });
    },
    [setObjects]
  );

  // Add to the Canvas component props
  const handleAddObject = useCallback(
    (object: EditorObjectBase) => {
      setObjects((prev) => [...prev, object]);
      setEditorState((prev) => ({
        ...prev,
        selectedIds: [object.id],
      }));
    },
    [setObjects, setEditorState]
  );

  // Add the event listener in the Canvas component
  useEffect(() => {
    if (stageRef.current) {
      const stage = stageRef.current;
      stage.on("addObject", (e) => {
        handleAddObject(e.object);
      });
      return () => {
        stage.off("addObject");
      };
    }
  }, [stageRef, handleAddObject]);

  const {
    animationState,
    addKeyframe,
    updateKeyframe,
    deleteKeyframe,
    togglePlayback,
    setCurrentTime,
  } = useAnimation(objects, handleObjectChange);

  const handleKeyframeAdd = useCallback(
    (objectId: string, time: number, properties: Keyframe["properties"]) => {
      addKeyframe(objectId, time, properties);
    },
    [addKeyframe]
  );

  return (
    <div
      className="editor-container"
      style={{
        gridTemplateColumns: `${leftPanelWidth}px 1fr ${rightPanelWidth}px`,
      }}
    >
      <Toolbar
        editorState={editorState}
        setEditorState={setEditorState}
        handleAddText={handleAddText}
        handleAddShape={handleAddShape}
        handleImageUpload={handleImageUpload}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        currentFormat={currentFormat}
        handleFormatChange={handleFormatChange}
        handleCustomFormatAdd={handleCustomFormatAdd}
        handleFormatEditModeChange={handleFormatEditModeChange}
        openDialog={openDialog}
        lastModified={lastModified}
      />

      <div className="panel left-panel" style={{ width: leftPanelWidth }}>
        <LayerPanel
          objects={objects}
          selectedIds={editorState.selectedIds}
          onSelect={handleSelect}
          onVisibilityChange={handleVisibilityChange}
          onNameChange={handleNameChange}
          currentFormat={currentFormat}
          handleFormatChange={handleFormatChange}
          handleCustomFormatAdd={handleCustomFormatAdd}
          handleFormatEditModeChange={handleFormatEditModeChange}
          openDialog={openDialog}
          formatEditMode={editorState.formatEditMode}
          zoom={editorState.zoom}
          onZoomChange={(zoom) => setEditorState((prev) => ({ ...prev, zoom }))}
          onAddGroup={handleAddGroup}
          setObjects={setObjects}
          onDelete={handleDeleteObject}
        />
        <ResizeHandle side="right" onResize={handleLeftPanelResize} />
      </div>

      <div className="main-content" ref={mainContentRef}>
        <Canvas
          editorState={editorState}
          stageRef={stageRef}
          objects={objects}
          stagePosition={stagePosition}
          currentFormat={currentFormat}
          handleSelect={handleSelect}
          handleObjectChange={handleObjectChange}
          handleWheel={handleWheel}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          handleDragMove={handleDragMove}
          handleAddObject={handleAddObject}
        />
      </div>

      <div className="panel right-panel" style={{ width: rightPanelWidth }}>
        <PropertyPanel
          selectedObject={getSelectedObject()}
          onChange={handleObjectChange}
          editorState={editorState}
          setEditorState={useCallback((newState: EditorState) => {
            setEditorState(newState);
          }, [])}
          getCanvasSize={() => ({
            width: containerWidth,
            height: containerHeight,
          })}
          objects={objects}
        />
        <ResizeHandle side="left" onResize={handleRightPanelResize} />
      </div>

      <div className="timeline-panel">
        <TimelineComponent
          objects={objects}
          timelines={animationState.timelines}
          currentTime={animationState.currentTime}
          duration={animationState.duration}
          onTimeChange={setCurrentTime}
          onKeyframeAdd={handleKeyframeAdd}
          onKeyframeUpdate={updateKeyframe}
          onKeyframeDelete={deleteKeyframe}
          isPlaying={animationState.isPlaying}
          onPlayPause={togglePlayback}
          onObjectSelect={(objectId) => {
            setEditorState((prev) => ({
              ...prev,
              selectedIds: [objectId],
            }));
          }}
        />
      </div>

      <DialogManager
        dialogs={dialogs}
        closeDialog={closeDialogByKey}
        openDialog={openDialog}
        stage={stageRef.current}
      />
    </div>
  );
}

export default App;
