import React, { useCallback } from "react";

import { PreviewDialog } from "./PreviewDialog";
import { ExportDialog } from "./ExportDialog";
import { SaveDialog } from "./SaveDialog";
import { LoadDialog } from "./LoadDialog";
import { TemplateBrowser } from "./TemplateBrowser";
import { SaveTemplateDialog } from "./SaveTemplateDialog";
import { ExportJSONDialog } from "./ExportJSONDialog";
import { MediaLibraryDialog } from "./MediaLibraryDialog";

import { Format } from "../../types/format";
import { EditorObjectBase } from "../../types/editor";
import type Konva from "konva";
import { DialogKey, Project } from "../../types/project";

import "./DialogManager.scss";

interface DialogManagerProps {
  dialogs: {
    [key in DialogKey]: {
      isOpen: boolean;
      props: {
        objects: EditorObjectBase[];
        formats: Format[];
        customFormats: Format[];
        stage: Konva.Stage;
        currentFormat: Format;
        onLoad: (project: Project) => void;
        project: Project;
        onSelect: (...args) => void;
        onSaved: () => void;
      };
    };
  };
  closeDialog: (dialogName: DialogKey) => void;
  openDialog: (dialogName: DialogKey) => void;
}

export const DialogManager: React.FC<DialogManagerProps> = ({
  dialogs,
  closeDialog,
  openDialog,
}) => (
  <>
    <PreviewDialog
      isOpen={dialogs.preview.isOpen}
      onClose={() => closeDialog("preview")}
      {...dialogs.preview.props}
    />
    <ExportDialog
      isOpen={dialogs.export.isOpen}
      onClose={() => closeDialog("export")}
      {...dialogs.export.props}
    />
    <SaveDialog
      isOpen={dialogs.save.isOpen}
      onClose={() => closeDialog("save")}
      openDialog={openDialog}
      {...dialogs.save.props}
    />
    <LoadDialog
      isOpen={dialogs.load.isOpen}
      onClose={() => closeDialog("load")}
      {...dialogs.load.props}
    />
    <ExportJSONDialog
      isOpen={dialogs.exportJSON.isOpen}
      onClose={() => closeDialog("exportJSON")}
      {...dialogs.exportJSON.props}
    />
    <TemplateBrowser
      isOpen={dialogs.templateBrowser.isOpen}
      onClose={() => closeDialog("templateBrowser")}
      {...dialogs.templateBrowser.props}
    />
    <SaveTemplateDialog
      isOpen={dialogs.saveTemplate.isOpen}
      onClose={() => closeDialog("saveTemplate")}
      {...dialogs.saveTemplate.props}
    />
    <MediaLibraryDialog
      isOpen={dialogs.mediaLibrary.isOpen}
      onClose={() => closeDialog("mediaLibrary")}
      openDialog={openDialog}
      {...dialogs.mediaLibrary.props}
    />
  </>
);
