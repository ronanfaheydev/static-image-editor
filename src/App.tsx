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
  TreeNodeType,
  RootObject,
} from "./types/editor";
import { DialogState, DialogKey } from "./types/project";
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
import {
  findNodeById,
  removeNodeFromParent,
  updateNodeInTree,
  addNodeToParent,
  insertNode,
} from "./utils/treeUtils";
import { useEditorHotkeys } from "./hooks/useEditorHotkeys";

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
    selectedLayerId: null,
    isDrawing: false,
    drawStartPosition: null,
    drawPreview: null,
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
      children: [],
      isExpanded: true,
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
    } as RootObject,
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
  const handleSelect = useCallback(
    (id: string | null, multiSelect: boolean) => {
      setEditorState((prev) => {
        // If selecting a layer, update selectedLayerId
        const selectedObject = id ? objects.find((obj) => obj.id === id) : null;
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
      if (editorState.formatEditMode === "single") {
        setObjects((prev) => updateNodeInTree(prev, id, changes));
      } else {
        // Handle multi-edit mode
        const targetNode = findNodeById(objects, id);
        if (!targetNode) return;

        setObjects((prev) => {
          const similarNodes = prev.filter(
            (node) => node.type === targetNode.type && node.id !== id
          );

          // Update target node and similar nodes
          let updatedTree = updateNodeInTree(prev, id, changes);
          similarNodes.forEach((node) => {
            updatedTree = updateNodeInTree(updatedTree, node.id, changes);
          });

          return updatedTree;
        });
      }
    },
    [editorState.formatEditMode, objects]
  );

  // Handle image upload
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
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
            position: { x: centerX - 100, y: centerY - 100 },
            size: { width: 200, height: 200 },
            rotation: 0,
            opacity: 1,
            visible: true,
            name: file.name,
            zIndex: objects.length,
            blendMode: "normal",
            parentId: editorState.selectedLayerId || null,
            children: [],
            isExpanded: true,
          };

          setObjects((prev) => [...prev, newImage]);
          setEditorState((prev) => ({
            ...prev,
            selectedIds: [newImage.id],
          }));
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
      editorState.selectedLayerId,
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
      position: { x: centerX - 100, y: centerY - 15 },
      size: { width: 200, height: 30 },
      fontSize: 20,
      fontFamily: "Arial",
      fill: "#000000",
      rotation: 0,
      opacity: 1,
      visible: true,
      name: "New Text",
      zIndex: objects.length,
      blendMode: "normal",
      parentId: editorState.selectedLayerId || null,
      children: [],
      isExpanded: true,
    };
    setObjects((prev) => [...prev, newText]);
  }, [
    containerWidth,
    containerHeight,
    currentFormat,
    objects.length,
    setObjects,
    editorState.selectedLayerId,
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

      const newShape: ShapeObject = {
        id: `shape-${Date.now()}`,
        type: "shape",
        shapeType,
        position: { x: centerX - 50, y: centerY - 50 },
        size: { width: 100, height: 100 },
        fill: "#cccccc",
        stroke: "#000000",
        strokeWidth: 2,
        rotation: 0,
        opacity: 1,
        visible: true,
        name: `${shapeType} ${objects.length + 1}`,
        zIndex: objects.length,
        blendMode: "normal",
        parentId: editorState.selectedLayerId || null,
        children: [],
        isExpanded: true,
      };
      setObjects((prev) => [...prev, newShape]);
    },
    [
      containerWidth,
      containerHeight,
      currentFormat,
      objects.length,
      setObjects,
      editorState.selectedLayerId,
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
        // First find and remove the node and its children
        const updatedTree = removeNodeFromParent(prev, id);

        // Then clean up any references to deleted nodes
        return updatedTree.map((node) => ({
          ...node,
          children: node.children.filter(
            (child) => findNodeById(updatedTree, child.id) !== null
          ),
        }));
      });
    },
    [setObjects]
  );

  // Update handleAddObject to respect selected layer
  const handleAddObject = useCallback(
    (object: Partial<EditorObjectBase>) => {
      const root = objects.find((obj) => obj.type === "root");
      const newObject: EditorObjectBase = {
        ...object,
        id: `${object.type}-${Date.now()}`,
        parentId: editorState.selectedLayerId || root?.id || null, // Add to selected layer if one is selected
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
    const selectedObjects = objects.filter((obj) =>
      editorState.selectedIds.includes(obj.id)
    );
    localStorage.setItem("clipboard", JSON.stringify(selectedObjects));
    setObjects((prev) =>
      prev.filter((obj) => !editorState.selectedIds.includes(obj.id))
    );
  }, [editorState.selectedIds, objects]);

  const handleCopy = useCallback(() => {
    const selectedNodes = editorState.selectedIds
      .map((id) => findNodeById(objects, id))
      .filter((node): node is EditorObjectBase => node !== null);

    if (selectedNodes.length > 0) {
      localStorage.setItem("clipboard", JSON.stringify(selectedNodes));
    }
  }, [editorState.selectedIds, objects]);

  // Update handlePaste to respect selected layer
  const handlePaste = useCallback(() => {
    const clipboardData = localStorage.getItem("clipboard");
    if (!clipboardData) return;

    const pastedNodes = JSON.parse(clipboardData) as EditorObjectBase[];
    const offset = { x: 20, y: 20 };

    setObjects((prev) => {
      const newNodes = pastedNodes.map((node) => ({
        ...node,
        id: `${node.type}-${Date.now()}-${Math.random()}`,
        position: {
          x: node.position.x + offset.x,
          y: node.position.y + offset.y,
        },
        parentId: editorState.selectedLayerId || null, // Add to selected layer
        children: [], // Reset children for pasted nodes
      }));

      return [...prev, ...newNodes];
    });
  }, [editorState.selectedLayerId, setObjects]);

  // Update the z-index handlers to reorder objects within their layer
  const handleBringForward = useCallback(() => {
    if (editorState.selectedIds.length === 0) return;

    setObjects((prev) => {
      const selectedObject = prev.find(
        (obj) => obj.id === editorState.selectedIds[0]
      );
      if (!selectedObject) return prev;

      // Get all objects in the same layer
      const layerObjects = prev.filter(
        (obj) => obj.parentId === selectedObject.parentId
      );
      const otherObjects = prev.filter(
        (obj) => obj.parentId !== selectedObject.parentId
      );

      const currentIndex = layerObjects.indexOf(selectedObject);
      if (currentIndex === layerObjects.length - 1) return prev; // Already at top

      // Swap positions in the array
      const reorderedLayerObjects = [...layerObjects];
      [
        reorderedLayerObjects[currentIndex],
        reorderedLayerObjects[currentIndex + 1],
      ] = [
        reorderedLayerObjects[currentIndex + 1],
        reorderedLayerObjects[currentIndex],
      ];

      return [...otherObjects, ...reorderedLayerObjects];
    });
  }, [editorState.selectedIds]);

  const handleSendBackward = useCallback(() => {
    if (editorState.selectedIds.length === 0) return;

    setObjects((prev) => {
      const selectedObject = prev.find(
        (obj) => obj.id === editorState.selectedIds[0]
      );
      if (!selectedObject) return prev;

      // Get all objects in the same layer
      const layerObjects = prev.filter(
        (obj) => obj.parentId === selectedObject.parentId
      );
      const otherObjects = prev.filter(
        (obj) => obj.parentId !== selectedObject.parentId
      );

      const currentIndex = layerObjects.indexOf(selectedObject);
      if (currentIndex === 0) return prev; // Already at bottom

      // Swap positions in the array
      const reorderedLayerObjects = [...layerObjects];
      [
        reorderedLayerObjects[currentIndex],
        reorderedLayerObjects[currentIndex - 1],
      ] = [
        reorderedLayerObjects[currentIndex - 1],
        reorderedLayerObjects[currentIndex],
      ];

      return [...otherObjects, ...reorderedLayerObjects];
    });
  }, [editorState.selectedIds]);

  const handleBringToFront = useCallback(() => {
    if (editorState.selectedIds.length === 0) return;

    setObjects((prev) => {
      const selectedObject = prev.find(
        (obj) => obj.id === editorState.selectedIds[0]
      );
      if (!selectedObject) return prev;

      // Get all objects in the same layer
      const layerObjects = prev.filter(
        (obj) => obj.parentId === selectedObject.parentId
      );
      const otherObjects = prev.filter(
        (obj) => obj.parentId !== selectedObject.parentId
      );

      // Move object to end of layer objects array
      const reorderedLayerObjects = [
        ...layerObjects.filter((obj) => obj.id !== selectedObject.id),
        selectedObject,
      ];

      return [...otherObjects, ...reorderedLayerObjects];
    });
  }, [editorState.selectedIds]);

  const handleSendToBack = useCallback(() => {
    if (editorState.selectedIds.length === 0) return;

    setObjects((prev) => {
      const selectedObject = prev.find(
        (obj) => obj.id === editorState.selectedIds[0]
      );
      if (!selectedObject) return prev;

      // Get all objects in the same layer
      const layerObjects = prev.filter(
        (obj) => obj.parentId === selectedObject.parentId
      );
      const otherObjects = prev.filter(
        (obj) => obj.parentId !== selectedObject.parentId
      );

      // Move object to start of layer objects array
      const reorderedLayerObjects = [
        selectedObject,
        ...layerObjects.filter((obj) => obj.id !== selectedObject.id),
      ];

      return [...otherObjects, ...reorderedLayerObjects];
    });
  }, [editorState.selectedIds]);

  // Add these functions near other handlers
  const handleGroup = useCallback(() => {
    if (editorState.selectedIds.length < 2) return;

    setObjects((prev) => {
      const selectedNodes = editorState.selectedIds
        .map((id) => findNodeById(prev, id))
        .filter((node): node is EditorObjectBase => node !== null);

      if (selectedNodes.length === 0) return prev;

      // Calculate group bounds
      const minX = Math.min(...selectedNodes.map((node) => node.position.x));
      const minY = Math.min(...selectedNodes.map((node) => node.position.y));
      const maxX = Math.max(
        ...selectedNodes.map((node) => node.position.x + node.size.width)
      );
      const maxY = Math.max(
        ...selectedNodes.map((node) => node.position.y + node.size.height)
      );

      // Create new group node
      const groupNode: GroupObject = {
        id: `group-${Date.now()}`,
        type: "group",
        name: "Group",
        position: { x: minX, y: minY },
        size: { width: maxX - minX, height: maxY - minY },
        rotation: 0,
        opacity: 1,
        visible: true,
        children: [],
        isExpanded: true,
        zIndex: Math.max(...selectedNodes.map((node) => node.zIndex)),
        blendMode: "normal",
        parentId: editorState.selectedLayerId || null,
      };

      // Remove selected nodes from their current parents
      let updatedTree = prev;
      selectedNodes.forEach((node) => {
        updatedTree = removeNodeFromParent(updatedTree, node.id);
      });

      // Add nodes to group with adjusted positions
      const groupChildren = selectedNodes.map((node) => ({
        ...node,
        position: {
          x: node.position.x - minX,
          y: node.position.y - minY,
        },
      }));

      // Add group with its children to tree
      groupNode.children = groupChildren;
      return [...updatedTree, groupNode];
    });

    // Update selection to new group
    setEditorState((prev) => ({
      ...prev,
      selectedIds: [`group-${Date.now()}`],
    }));
  }, [
    editorState.selectedIds,
    editorState.selectedLayerId,
    setObjects,
    setEditorState,
  ]);

  const handleUngroup = useCallback(() => {
    setObjects((prev) => {
      const selectedGroups = editorState.selectedIds
        .map((id) => findNodeById(prev, id))
        .filter(
          (node): node is GroupObject => node !== null && node.type === "group"
        );

      if (selectedGroups.length === 0) return prev;

      let updatedTree = prev;
      const ungroupedNodeIds: string[] = [];

      selectedGroups.forEach((group) => {
        // Remove group from tree
        updatedTree = removeNodeFromParent(updatedTree, group.id);

        // Add each child back with adjusted position
        group.children.forEach((child) => {
          const adjustedChild = {
            ...child,
            position: {
              x: child.position.x + group.position.x,
              y: child.position.y + group.position.y,
            },
          };
          updatedTree = [...updatedTree, adjustedChild];
          ungroupedNodeIds.push(child.id);
        });
      });

      // Update selection to ungrouped nodes
      setEditorState((prev) => ({
        ...prev,
        selectedIds: ungroupedNodeIds,
      }));

      return updatedTree;
    });
  }, [editorState.selectedIds, setObjects, setEditorState]);

  // Add keyboard shortcuts
  useHotkeys("cmd+x", handleCut, [handleCut]);
  useHotkeys("cmd+c", handleCopy, [handleCopy]);
  useHotkeys("cmd+v", handlePaste, [handlePaste]);
  // Add keyboard shortcuts for group/ungroup
  useHotkeys(
    "cmd+g",
    (e) => {
      e.preventDefault();
      handleGroup();
    },
    [handleGroup]
  );

  useHotkeys(
    "cmd+shift+g",
    (e) => {
      e.preventDefault();
      handleUngroup();
    },
    [handleUngroup]
  );

  // Add these near other keyboard shortcuts
  useHotkeys(
    "cmd+]",
    (e) => {
      e.preventDefault();
      handleBringToFront();
    },
    [handleBringToFront]
  );

  useHotkeys(
    "cmd+shift+]",
    (e) => {
      e.preventDefault();
      handleBringForward();
    },
    [handleBringForward]
  );

  useHotkeys(
    "cmd+[",
    (e) => {
      e.preventDefault();
      handleSendToBack();
    },
    [handleSendToBack]
  );

  useHotkeys(
    "cmd+shift+[",
    (e) => {
      e.preventDefault();
      handleSendBackward();
    },
    [handleSendBackward]
  );

  // Add these with your other keyboard shortcuts
  useHotkeys(
    "v",
    () => {
      setEditorState((prev) => ({ ...prev, tool: "select" }));
    },
    []
  );

  useHotkeys(
    "t",
    () => {
      setEditorState((prev) => ({ ...prev, tool: "text" }));
    },
    []
  );

  useHotkeys(
    "r",
    () => {
      setEditorState((prev) => ({ ...prev, tool: "shape" }));
    },
    []
  );

  useHotkeys(
    "i",
    () => {
      setEditorState((prev) => ({ ...prev, tool: "image" }));
    },
    []
  );

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
