import { useState, useCallback, useRef, useEffect } from "react";
import {
  EditorObjectBase,
  ImageObject,
  FormatEditMode,
  GroupObject,
  EditorState,
  TreeNodeType,
  RootObject,
} from "./types/editor";
import { DialogKey } from "./types/project";
import "./App.scss";
import { useHistory } from "./hooks/useHistory";
import { LayerPanel } from "./components/layerPanel/LayerPanel";
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
import {
  findNodeById,
  removeNodeFromParent,
  updateNodeInTree,
  insertNode,
  moveNodeToFront,
  moveNodeToBack,
  moveNodeForward,
  moveNodeBackward,
} from "./utils/treeUtils";
import { useEditorHotkeys } from "./hooks/useEditorHotkeys";
import { useDialogs } from "./hooks/useDialogs";
import { ROOT_ID } from "./constants";

const INITIAL_PADDING = 50; // 50px on each side

// eslint-disable-next-line
const debounce = (fn: Function, ms = 100) => {
  let timeoutId: number;
  // eslint-disable-next-line
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn.apply(this, args), ms);
  };
};

function App() {
  const mainContentRef = useRef<HTMLDivElement | null>(null);
  const containerSize = useContainerSize(mainContentRef);
  const { width: containerWidth, height: containerHeight } = containerSize;

  // Add format state
  const [currentFormat, setCurrentFormat] = useState<Format>(
    DEFAULT_FORMATS[0]
  );

  const [customFormats, setCustomFormats] = useState<Format[]>([]);

  // Editor state
  const [editorState, setEditorState] = useState<EditorState>({
    selectedIds: [],
    tool: "select",
    zoom: 1, //getInitialZoom(containerSize, currentFormat),
    formatEditMode: "single",
    backgroundColor: "#ffffff",
    backgroundOpacity: 1,
    selectedLayerId: null,
    isDrawing: false,
    drawStartPosition: null,
    drawPreview: null,
  });

  // need to use a ref here
  const closeDialogRef = useRef<(key?: DialogKey) => void>(() => {});

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
      id: ROOT_ID,
      type: "root",
      name: "Canvas",
      visible: true,
      children: [],
      isExpanded: true,
      position: { x: 0, y: 0 }, //getInitialPosition(containerSize, currentFormat),
      size: currentFormat,
      rotation: 0,
      opacity: editorState.backgroundOpacity,
      blendMode: "normal",
      fill: editorState.backgroundColor,
      stroke: "transparent",
      strokeWidth: 0,
      zIndex: 0,
      parentId: null,
      backgroundColor: "#ffffff",
      backgroundOpacity: 1,
    } as RootObject,
  ]);

  // Add this function to calculate the zoom level
  const calculateFitZoom = useCallback(
    (format: Format) => {
      if (!containerWidth || !containerHeight) return 0.8; // default zoom

      const horizontalZoom = (containerWidth - INITIAL_PADDING) / format.width;
      const verticalZoom = (containerHeight - INITIAL_PADDING) / format.height;

      return Math.min(horizontalZoom, verticalZoom, 2); // cap at 2x zoom
    },
    [containerWidth, containerHeight]
  );

  // Handle format change
  const handleFormatChange = useCallback(
    (format: Format) => {
      setCurrentFormat(format);
      const zoom = calculateFitZoom(format);
      setEditorState((prev) => ({
        ...prev,
        zoom,
      }));

      const topLeftX =
        Math.abs(containerWidth - format.width * zoom) / 2 / zoom;
      const topLeftY =
        (Math.abs(containerHeight - format.height * zoom) / 2 + 20) / zoom; // 20 for title text

      // Update root group and background layer positions
      setObjects((prev) =>
        prev.map((obj) => {
          if (obj.id === ROOT_ID) {
            return {
              ...obj,
              size: format,
              position: { x: topLeftX, y: topLeftY },
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

  // Handle window resize
  useEffect(() => {
    const handleResize = debounce(() => {
      setCurrentFormat(currentFormat);
    }, 500);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentFormat]);

  useEffect(() => {
    handleFormatChange(currentFormat);
  }, [containerWidth, containerHeight, currentFormat, handleFormatChange]);

  // Handle object selection
  const handleSelect = useCallback(
    (id: string | null, multiSelect: boolean) => {
      setEditorState((prev) => {
        // If selecting a layer, update selectedLayerId
        const selectedObject = id ? findNodeById(objects, id) : null;
        const isLayer = selectedObject?.type === "layer";

        return {
          ...prev,
          selectedIds: id
            ? multiSelect
              ? prev.selectedIds.includes(id)
                ? prev.selectedIds.filter((i) => i !== id)
                : [...prev.selectedIds, id]
              : [id]
            : [],
          // Update selectedLayerId when selecting a layer
          selectedLayerId: isLayer ? id : prev.selectedLayerId,
        };
      });
    },
    [objects]
  );

  // Handle object changes
  const handleObjectChange = useCallback(
    (id: string, changes: Partial<EditorObjectBase>) => {
      setObjects((prev) => updateNodeInTree(prev, id, changes));
    },
    [setObjects]
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
      closeDialogRef.current?.("load");
    },
    [setObjects]
  );

  // Update handleTemplateSelect similarly
  const handleTemplateSelect = useCallback(
    (template: Template) => {
      setObjects(template.objects);
      setCurrentFormat(template.format);
      closeDialogRef.current?.("templateBrowser");
    },
    [setObjects]
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
        size: scaleSize(
          currentFormat,
          mediaItem.size.width,
          mediaItem.size.height
        ),
        rotation: 0,
        opacity: 1,
        visible: true,
        name: mediaItem.name,
        zIndex: objects.length,
        blendMode: "normal",
        parentId: editorState.selectedLayerId || ROOT_ID,
        children: [],
        isExpanded: false,
      };

      setObjects(insertNode(objects, newImage, newImage.parentId));
      closeDialogRef.current?.("mediaLibrary");
    },
    [
      containerWidth,
      containerHeight,
      currentFormat,
      editorState.selectedLayerId,
      objects,
      setObjects,
    ]
  );

  const { dialogs, openDialog, closeDialog } = useDialogs({
    stageRef,
    currentFormat,
    customFormats,
    objects,
    handleLoadProject,
    handleTemplateSelect,
    handleTemplateSaved,
    handleMediaLibrarySelect,
  });
  closeDialogRef.current = closeDialog;

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

  // Update handleDeleteObject to use removeNodeFromParent
  const handleDeleteObject = useCallback(
    (id: string) => {
      setObjects((prev) => removeNodeFromParent(prev, id));
    },
    [setObjects]
  );

  // Update handleAddObject to respect selected layer
  const handleAddObject = useCallback(
    (object: Partial<EditorObjectBase>) => {
      const newObject: EditorObjectBase = {
        ...object,
        id: `${object.type}-${Date.now()}`,
        parentId: editorState.selectedLayerId || ROOT_ID || null, // Add to selected layer if one is selected
        zIndex: Math.max(...objects.map((obj) => obj.zIndex), 0) + 1,
        isExpanded: false,
        visible: true,
        name: object.name || `${object.type}-${objects.length + 1}`,
        children: [],
        position: object.position || { x: 0, y: 0 },
        size: object.size || { width: 0, height: 0 },
        rotation: object.rotation || 0,
        opacity: object.opacity || 1,
        type: object.type as TreeNodeType,
        blendMode: object.blendMode || "normal",
      };

      const updatedObjects = insertNode(objects, newObject, newObject.parentId);

      setObjects(updatedObjects);
    },
    [objects, editorState.selectedLayerId, setObjects]
  );

  // Add the event listener in the Canvas component
  useEffect(() => {
    if (stageRef.current) {
      const stage = stageRef.current;
      stage.on("addObject", (e: KonvaEventObject<CustomEvent>) => {
        handleAddObject(e.object);
      });
      return () => {
        stage.off("addObject");
      };
    }
  }, [stageRef, handleAddObject]);

  // Add these functions near other handlers
  const handleCut = useCallback(() => {
    setObjects((objects) => {
      const selectedObjects = editorState.selectedIds.map((id) =>
        findNodeById(objects, id)
      );
      localStorage.setItem("clipboard", JSON.stringify(selectedObjects));

      let objs = [...objects];
      editorState.selectedIds.forEach((id) => {
        objs = removeNodeFromParent(objects, id);
      });
      return objs;
    });
  }, [editorState.selectedIds, setObjects]);

  const handleCopy = useCallback(() => {
    const selectedNodes = editorState.selectedIds
      .map((id) => findNodeById(objects, id))
      .filter((node): node is EditorObjectBase => node !== null)
      .map((node) => {
        // Add a copy suffix to the name, check it doesn't already exist
        const copied = {
          ...node,
          id: `${node.id}-copy`,
          name: `${node.name}-copy`,
        };

        if (findNodeById(objects, copied.id)) {
          copied.id = `${node.id}-copy-${Date.now()}`;
          copied.name = `${node.name}-copy`;
        }

        return copied;
      });

    if (selectedNodes.length > 0) {
      localStorage.setItem("clipboard", JSON.stringify(selectedNodes));
    }
  }, [editorState.selectedIds, objects]);

  // Update handlePaste to respect selected layer
  const handlePaste = useCallback(() => {
    const clipboardData = localStorage.getItem("clipboard");
    if (!clipboardData) return;

    const pastedNodes = JSON.parse(clipboardData) as EditorObjectBase[];

    setObjects((prev) => {
      let objects = [...prev];
      pastedNodes.forEach((node) => {
        objects = insertNode(
          objects,
          node,
          editorState.selectedLayerId || ROOT_ID
        );
      });
      return objects;
    });
  }, [editorState.selectedLayerId, setObjects]);

  // Update the z-index handlers to reorder objects within their layer
  const handleBringToFront = useCallback(() => {
    if (editorState.selectedIds.length === 0) return;

    let updatedObjects = [...objects];
    editorState.selectedIds.forEach((id) => {
      updatedObjects = moveNodeToFront(updatedObjects, id);
    });
    setObjects(updatedObjects);
  }, [editorState.selectedIds, objects, setObjects]);

  const handleSendToBack = useCallback(() => {
    if (editorState.selectedIds.length === 0) return;

    let updatedObjects = [...objects];
    editorState.selectedIds.forEach((id) => {
      updatedObjects = moveNodeToBack(updatedObjects, id);
    });
    setObjects(updatedObjects);
  }, [editorState.selectedIds, objects, setObjects]);

  const handleBringForward = useCallback(() => {
    if (editorState.selectedIds.length === 0) return;

    let updatedObjects = [...objects];
    editorState.selectedIds.forEach((id) => {
      updatedObjects = moveNodeForward(updatedObjects, id);
    });
    setObjects(updatedObjects);
  }, [editorState.selectedIds, objects, setObjects]);

  const handleSendBackward = useCallback(() => {
    if (editorState.selectedIds.length === 0) return;

    let updatedObjects = [...objects];
    editorState.selectedIds.forEach((id) => {
      updatedObjects = moveNodeBackward(updatedObjects, id);
    });
    setObjects(updatedObjects);
  }, [editorState.selectedIds, objects, setObjects]);

  // Update handleGroup to use tree operations
  const handleGroup = useCallback(() => {
    if (editorState.selectedIds.length < 2) return;

    const groupId = `group-${Date.now()}`;
    const firstSelected = findNodeById(objects, editorState.selectedIds[0]);
    if (!firstSelected) return;

    const groupObject: GroupObject = {
      id: groupId,
      type: "group",
      name: `Group ${objects.length + 1}`,
      position: { x: 0, y: 0 },
      size: { width: 0, height: 0 },
      rotation: 0,
      opacity: 1,
      visible: true,
      children: [],
      isExpanded: false,
      zIndex: Math.max(...objects.map((obj) => obj.zIndex || 0)) + 1,
      parentId: firstSelected.parentId,
      blendMode: "normal",
    };

    let updatedObjects = objects;
    const selectedObjects = editorState.selectedIds.map((id) =>
      findNodeById(updatedObjects, id)
    );
    const minMax = selectedObjects.reduce(
      (acc, obj) => {
        if (!obj) return acc;
        return {
          minX: Math.min(acc.minX, obj.position.x),
          minY: Math.min(acc.minY, obj.position.y),
          maxX: Math.max(acc.maxX, obj.position.x + obj.size.width),
          maxY: Math.max(acc.maxY, obj.position.y + obj.size.height),
        };
      },
      {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
      }
    );

    groupObject.position = {
      x: minMax.minX,
      y: minMax.minY,
    };
    groupObject.size = {
      width: minMax.maxX - minMax.minX,
      height: minMax.maxY - minMax.minY,
    };

    updatedObjects = insertNode(objects, groupObject, groupObject.parentId);

    // Move selected objects into group
    editorState.selectedIds.forEach((id) => {
      const obj = findNodeById(updatedObjects, id);

      if (!obj) return;
      obj.parentId = groupId;
      updatedObjects = removeNodeFromParent(updatedObjects, id);
      updatedObjects = insertNode(updatedObjects, obj, groupId);
    });

    setObjects(updatedObjects);
    setEditorState((prev) => ({
      ...prev,
      selectedIds: [groupId],
    }));
  }, [editorState.selectedIds, objects, setObjects, setEditorState]);

  // Update handleUngroup to use tree operations
  const handleUngroup = useCallback(() => {
    const selectedGroups = editorState.selectedIds
      .map((id) => findNodeById(objects, id))
      .filter((obj): obj is GroupObject => obj?.type === "group");

    if (selectedGroups.length === 0) return;

    let updatedObjects = [...objects];

    selectedGroups.forEach((group) => {
      // Move all children to parent
      group.children.forEach((child) => {
        updatedObjects = removeNodeFromParent(updatedObjects, child.id);
        updatedObjects = insertNode(updatedObjects, child, group.parentId);
      });
      // Remove empty group
      updatedObjects = removeNodeFromParent(updatedObjects, group.id);
    });

    setObjects(updatedObjects);
    setEditorState((prev) => ({
      ...prev,
      selectedIds: [],
    }));
  }, [editorState.selectedIds, objects, setObjects, setEditorState]);

  useEditorHotkeys({
    setEditorState,
    handleCut,
    handleCopy,
    handlePaste,
    handleDelete: handleDeleteObject,
    handleUndo: undo,
    handleRedo: redo,
    handleBringToFront,
    handleBringForward,
    handleSendToBack,
    handleSendBackward,
    handleGroup,
    handleUngroup,
  });

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
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
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
          setEditorState={setEditorState}
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
          handleCut={handleCut}
          handleCopy={handleCopy}
          handlePaste={handlePaste}
          handleBringToFront={handleBringToFront}
          handleSendToBack={handleSendToBack}
          handleGroup={handleGroup}
          handleUngroup={handleUngroup}
          handleBringForward={handleBringForward}
          handleSendBackward={handleSendBackward}
          stageRef={stageRef}
        />
      </div>

      <div className="panel right-panel" style={{ width: rightPanelWidth }}>
        <PropertyPanel
          selectedIds={editorState.selectedIds}
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
      <DialogManager
        dialogs={dialogs}
        closeDialog={closeDialog}
        openDialog={openDialog}
        stage={stageRef.current}
      />
    </div>
  );
}

export default App;
