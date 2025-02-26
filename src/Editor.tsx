import { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
import { Format } from "./types/format";
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
import { useEditorState } from "./hooks/useEditorState";
import { useEditorLayout } from "./hooks/useEditorLayout";
import { EditorStateProvider } from "./providers/EditorStateProvider";
import { useObjectHelpers } from "./hooks/useObjectHelpers";
import { useStage } from "./hooks/useStage";
import {
  createGroupObject,
  createNewImage,
  createNewImageFromMediaItem,
} from "./utils/shapeHelpers";

// eslint-disable-next-line
const debounce = (fn: Function, ms = 100) => {
  let timeoutId: number;
  // eslint-disable-next-line
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn.apply(this, args), ms);
  };
};

function Editor() {
  const mainContentRef = useRef<HTMLDivElement | null>(null);
  const containerSize = useContainerSize(mainContentRef);

  const { width: containerWidth, height: containerHeight } = containerSize;

  const {
    editorState,
    updateEditorState: setEditorState,
    format: {
      currentFormat,
      setCurrentFormat: updateFormat,
      customFormats,
      setCustomFormats,
      handleCustomFormatAdd,
    },
  } = useEditorState(); // context updates

  const rootObject = useMemo(
    () =>
      ({
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
      } as RootObject),
    [currentFormat, editorState.backgroundOpacity, editorState.backgroundColor] //  TODO: This should not be in the editor state
  );

  const {
    calculateFitZoom,
    leftPanelWidth,
    rightPanelWidth,
    handleLeftPanelResize,
    handleRightPanelResize,
  } = useEditorLayout({
    containerSize,
    currentFormat,
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
  } = useHistory<EditorObjectBase[]>([rootObject]);

  const { selectObject, addObject, updateObject, updateObjectName, isInGroup } =
    useObjectHelpers({
      objects,
      setObjects,
    });

  // Handle format change
  const handleFormatChange = useCallback(
    (format: Format) => {
      const zoom = calculateFitZoom(format);
      setEditorState({
        zoom,
      });

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
    [
      calculateFitZoom,
      setObjects,
      containerWidth,
      containerHeight,
      setEditorState,
    ]
  );

  // Handle window resize
  useEffect(() => {
    const handleResize = debounce(() => {
      updateFormat(currentFormat);
    }, 500);

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentFormat, updateFormat]);

  useEffect(() => {
    handleFormatChange(currentFormat);
  }, [currentFormat, handleFormatChange]);

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

  const stageRef = useRef<Konva.Stage>(null);

  // Handle format edit mode change
  const handleFormatEditModeChange = useCallback(
    (mode: FormatEditMode) => {
      setEditorState({ formatEditMode: mode });
    },
    [setEditorState]
  );

  // Update handleLoadProject to use it
  const handleLoadProject = useCallback(
    (project: Project) => {
      setObjects(project.objects);
      updateFormat(project.currentFormat);
      setCustomFormats(project.customFormats);
      closeDialogRef.current?.("load");
    },
    [setObjects, updateFormat, setCustomFormats]
  );

  // Update handleTemplateSelect similarly
  const handleTemplateSelect = useCallback(
    (template: Template) => {
      setObjects(template.objects);
      updateFormat(template.format);
      closeDialogRef.current?.("templateBrowser");
    },
    [setObjects, updateFormat]
  );

  // Handle template saved
  const handleTemplateSaved = useCallback(() => {
    alert("Template saved successfully!");
  }, []);

  const {
    handleWheel,
    handleDragStart,
    handleDragEnd,
    handleDragMove,
    stagePosition,
  } = useStage({
    stageRef,
    setEditorState,
    editorState,
  });

  const handleMediaLibrarySelect = useCallback(
    (mediaItem: MediaItem) => {
      const newImage = createNewImageFromMediaItem(
        mediaItem,
        containerSize,
        currentFormat,
        objects.length,
        editorState.selectedLayerId || ROOT_ID
      );

      setObjects(insertNode(objects, newImage, newImage.parentId));
      closeDialogRef.current?.("mediaLibrary");
    },
    [
      containerSize,
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
    setEditorState({
      zoom: calculateFitZoom(currentFormat),
    });
  }, [setEditorState, currentFormat, calculateFitZoom]);

  // Add group creation handler
  const handleAddGroup = useCallback(() => {
    const newGroup = createGroupObject({ zIndex: objects.length });
    setObjects((prev) => [...prev, newGroup]);
  }, [objects.length, setObjects]);

  // Update handleDeleteObject to use removeNodeFromParent
  const handleDeleteObject = useCallback(() => {
    editorState.selectedIds.forEach((id) => {
      setObjects((prev) => removeNodeFromParent(prev, id));
    });
  }, [setObjects, editorState.selectedIds]);

  // Add the event listener in the Canvas component
  useEffect(() => {
    if (stageRef.current) {
      const stage = stageRef.current;
      stage.on("addObject", (e: KonvaEventObject<CustomEvent>) => {
        addObject(e.object);
      });
      return () => {
        stage.off("addObject");
      };
    }
  }, [stageRef, addObject]);

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
    setEditorState({
      selectedIds: [groupId],
    });
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
    setEditorState({
      selectedIds: [],
    });
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
          onSelect={selectObject}
          onVisibilityChange={handleVisibilityChange}
          onNameChange={updateObjectName}
          currentFormat={currentFormat}
          handleFormatChange={handleFormatChange}
          handleCustomFormatAdd={handleCustomFormatAdd}
          handleFormatEditModeChange={handleFormatEditModeChange}
          openDialog={openDialog}
          formatEditMode={editorState.formatEditMode}
          zoom={editorState.zoom}
          onZoomChange={(zoom) => setEditorState({ zoom })}
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
          handleSelect={selectObject}
          handleObjectChange={updateObject}
          handleWheel={handleWheel}
          handleDragStart={handleDragStart}
          handleDragEnd={handleDragEnd}
          handleDragMove={handleDragMove}
          handleAddObject={addObject}
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
          isInGroup={isInGroup}
        />
      </div>

      <div className="panel right-panel" style={{ width: rightPanelWidth }}>
        <PropertyPanel
          selectedIds={editorState.selectedIds}
          onChange={updateObject}
          editorState={editorState}
          setEditorState={setEditorState}
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

export default function MyEditor() {
  return (
    <EditorStateProvider>
      <Editor />
    </EditorStateProvider>
  );
}
