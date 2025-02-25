import { useState, useCallback, useMemo } from "react";
import type Konva from "konva";
import { Format } from "../types/format";
import { DialogKey, DialogState, Project } from "../types/project";
import { Template } from "../types/template";
import { MediaItem } from "../types/media";
import { EditorObjectBase } from "../types/editor";

export const useDialogs = ({
  stageRef,
  currentFormat,
  customFormats,
  objects,
  handleLoadProject,
  handleTemplateSelect,
  handleTemplateSaved,
  handleMediaLibrarySelect,
}: {
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  currentFormat: Format;
  customFormats: Format[];
  objects: EditorObjectBase[];
  handleLoadProject: (project: Project) => void;
  handleTemplateSelect: (template: Template) => void;
  handleTemplateSaved: (template: Template) => void;
  handleMediaLibrarySelect: (media: MediaItem) => void;
}) => {
  const [currentDialog, setCurrentDialog] = useState<DialogKey[] | null>(null);

  // Update the openDialog function to include props
  const openDialog = useCallback((dialogName: DialogKey) => {
    setCurrentDialog((prev) => {
      if (prev?.includes(dialogName)) {
        return prev;
      }
      return prev ? [...prev, dialogName] : [dialogName];
    });
  }, []);

  const closeDialog = useCallback((key?: DialogKey) => {
    setCurrentDialog((prev) => {
      if (!prev) {
        return prev;
      }
      if (key) {
        return prev.filter((dialog) => dialog !== key);
      }
      return null;
    });
  }, []);

  // Add state for dialogs
  const dialogs: DialogState = useMemo(() => {
    const dialogState: DialogState = {
      preview: {
        isOpen: false,
        props: {},
        open: () => void 0,
        close: () => void 0,
      },
      export: {
        isOpen: false,
        props: {
          stage: stageRef.current,
          currentFormat,
          objects,
        },
        open: () => void 0,
        close: () => void 0,
      },
      save: {
        isOpen: false,
        props: {
          stage: stageRef.current,
          currentFormat,
          customFormats,
          objects,
        },
        open: () => void 0,
        close: () => void 0,
      },
      load: {
        isOpen: false,
        props: {
          onLoad: handleLoadProject,
        },
        open: () => void 0,
        close: () => void 0,
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
        open: () => void 0,
        close: () => void 0,
      },
      templateBrowser: {
        isOpen: false,
        props: {
          onSelect: handleTemplateSelect,
        },
        open: () => void 0,
        close: () => void 0,
      },
      saveTemplate: {
        isOpen: false,
        props: {
          objects,
          currentFormat,
          onSaved: handleTemplateSaved,
        },
        open: () => void 0,
        close: () => void 0,
      },
      mediaLibrary: {
        isOpen: false,
        props: {
          onSelect: handleMediaLibrarySelect,
        },
        open: () => void 0,
        close: () => void 0,
      },
    };

    Object.keys(dialogState).forEach((key) => {
      dialogState[key as DialogKey].isOpen =
        currentDialog?.includes(key as DialogKey) || false;
      dialogState[key as DialogKey].open = openDialog.bind(
        null,
        key as DialogKey
      );
      dialogState[key as DialogKey].close = closeDialog.bind(
        null,
        key as DialogKey
      );
    });
    return dialogState;
  }, [
    stageRef,
    currentDialog,
    currentFormat,
    customFormats,
    objects,
    handleLoadProject,
    handleTemplateSelect,
    handleTemplateSaved,
    handleMediaLibrarySelect,
    closeDialog,
    openDialog,
  ]);

  return { dialogs, openDialog, closeDialog };
};
