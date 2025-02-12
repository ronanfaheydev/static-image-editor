import { useState, useCallback, useRef, useEffect } from "react";
import {
  EditorObject,
  ImageObject,
  TextObject,
  ShapeObject,
  FormatEditMode,
  BlendMode,
} from "./types/editor";
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
import { DialogManager } from "./components/toolbar/DialogManager";

// Add these constants back
const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 1200;

// Types
interface EditorState {
  selectedIds: string[];
  tool: "select" | "image" | "text" | "shape";
  zoom: number;
  formatEditMode: FormatEditMode;
  backgroundColor: string;
  backgroundOpacity: number;
}

// Add these type definitions at the top with other interfaces
type PositionProp = "position" | "size" | "rotation";
type EditorObjectKey = keyof EditorObject;

// Add at the top with other interfaces
interface DialogState {
  preview: { isOpen: boolean; props: Record<string, unknown> };
  export: {
    isOpen: boolean;
    props: {
      stage: Konva.Stage | null;
      currentFormat: Format;
      objects: EditorObject[];
    };
  };
  save: {
    isOpen: boolean;
    props: {
      stage: Konva.Stage | null;
      currentFormat: Format;
      customFormats: Format[];
      objects: EditorObject[];
    };
  };
  load: {
    isOpen: boolean;
    props: { onLoad?: (project: Project) => void };
  };
  exportJSON: {
    isOpen: boolean;
    props: { project?: Project };
  };
  templateBrowser: {
    isOpen: boolean;
    props: { onSelect?: (template: Template) => void };
  };
  saveTemplate: {
    isOpen: boolean;
    props: {
      objects?: EditorObject[];
      currentFormat?: Format;
      onSaved?: () => void;
    };
  };
}

// Add this type near other interfaces
type DialogKey = keyof DialogState;

function App() {
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
  } = useHistory<EditorObject[]>([]);

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
    (id: string, newProps: Partial<EditorObject>) => {
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
          const positionChanges = positionProps.reduce<Partial<EditorObject>>(
            (acc, prop) => {
              if (prop in newProps) {
                acc[prop] = newProps[prop];
              }
              return acc;
            },
            {}
          );

          const styleChanges = nonPositionProps.reduce<Partial<EditorObject>>(
            (acc, prop) => {
              acc[prop] = newProps[prop];
              return acc;
            },
            {}
          );

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
          const newImage: ImageObject = {
            id: `image-${Date.now()}`,
            type: "image",
            src: event.target?.result as string,
            position: { x: 100, y: 100 },
            size: { width: 200, height: 200 },
            rotation: 0,
            opacity: 1,
            visible: true,
            name: "New Image",
            zIndex: objects.length,
            blendMode: "normal" as BlendMode,
          };
          setObjects((prev) => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      }
    },
    [objects.length, setObjects]
  );

  // Handle adding text
  const handleAddText = useCallback(() => {
    const centerX =
      (CANVAS_WIDTH - currentFormat.width) / 2 + currentFormat.width / 2;
    const centerY =
      (CANVAS_HEIGHT - currentFormat.height) / 2 + currentFormat.height / 2;

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
    };
    setObjects((prev) => [...prev, newText]);
  }, [objects.length, setObjects, currentFormat]);

  // Wrap getSelectedObject
  const getSelectedObject = useCallback(() => {
    if (editorState.selectedIds.length === 0) return null;
    return objects.find((obj) => obj.id === editorState.selectedIds[0]) || null;
  }, [editorState.selectedIds, objects]);

  // Wrap createObjectDefaults
  const createObjectDefaults = useCallback(
    (id: string) => ({
      visible: true,
      name: `Object ${id}`,
      zIndex: objects.length,
      blendMode: "normal" as BlendMode,
    }),
    [objects.length]
  );

  // Handle adding shape
  const handleAddShape = useCallback(
    (shapeType: ShapeObject["shapeType"]) => {
      const centerX =
        (CANVAS_WIDTH - currentFormat.width) / 2 + currentFormat.width / 2;
      const centerY =
        (CANVAS_HEIGHT - currentFormat.height) / 2 + currentFormat.height / 2;

      const id = `shape-${Date.now()}`;
      const newShape: ShapeObject = {
        ...createObjectDefaults(id),
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
      };
      setObjects((prev) => [...prev, newShape]);
    },
    [setObjects, createObjectDefaults, currentFormat]
  );

  // Handle reordering layers
  const handleReorderLayers = useCallback(
    (startIndex: number, endIndex: number) => {
      // Get sorted objects first
      const sortedObjects = [...objects].sort((a, b) => b.zIndex - a.zIndex);

      // Reorder the sorted array
      const [removed] = sortedObjects.splice(startIndex, 1);
      sortedObjects.splice(endIndex, 0, removed);

      // Update zIndices based on new order
      const updatedObjects = sortedObjects.map((obj, index) => ({
        ...obj,
        zIndex: sortedObjects.length - index - 1,
      }));

      setObjects(updatedObjects);
    },
    [objects, setObjects]
  );

  // Handle visibility change
  const handleVisibilityChange = useCallback(
    (id: string, visible: boolean) => {
      setObjects((prev) =>
        prev.map((obj) => (obj.id === id ? { ...obj, visible } : obj))
      );
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

  // Handle format change
  const handleFormatChange = useCallback((format: Format) => {
    setCurrentFormat(format);
  }, []);

  // Handle custom format add
  const handleCustomFormatAdd = useCallback(
    (format: Format) => {
      setCustomFormats((prev) => [...prev, format]);
      handleFormatChange(format);
    },
    [handleFormatChange]
  );

  const stageRef = useRef<Konva.Stage>(null);

  // Handle format edit mode change
  const handleFormatEditModeChange = useCallback((mode: FormatEditMode) => {
    setEditorState((prev) => ({ ...prev, formatEditMode: mode }));
  }, []);

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
  const [isDragging, setIsDragging] = useState(false);

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
        },
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
  });

  // Update the openDialog function to include props
  const openDialog = useCallback(
    (dialogName: string) => {
      setDialogs((prev) => ({
        ...prev,
        [dialogName]: {
          isOpen: true,
          props: {
            ...prev[dialogName].props,
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

  return (
    <div className="editor-container">
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
      />
      <LayerPanel
        objects={objects}
        selectedIds={editorState.selectedIds}
        onSelect={handleSelect}
        onReorder={handleReorderLayers}
        onVisibilityChange={handleVisibilityChange}
        onNameChange={handleNameChange}
      />
      <div className="main-content">
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
        />
      </div>
      <PropertyPanel
        selectedObject={getSelectedObject()}
        onChange={handleObjectChange}
        editorState={editorState}
        setEditorState={useCallback((newState: EditorState) => {
          console.log("Setting editor state to:", newState);
          setEditorState(newState);
        }, [])}
      />
      <DialogManager dialogs={dialogs} closeDialog={closeDialogByKey} />
    </div>
  );
}

export default App;
