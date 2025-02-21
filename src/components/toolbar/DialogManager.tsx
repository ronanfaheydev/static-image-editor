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
import { Template } from "../../types/template";

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
        onSelect: (template: Template) => void;
        onSaved: () => void;
      };
    };
  };
  closeDialog: (dialogName: DialogKey) => void;
  openDialog: (dialogName: DialogKey) => void;
  stage?: Konva.Stage;
}

export const DialogManager: React.FC<DialogManagerProps> = ({
  dialogs,
  closeDialog,
  openDialog,
  stage,
}) => (
  <>
    <PreviewDialog
      isOpen={dialogs.preview.isOpen}
      onClose={() => closeDialog("preview")}
      openDialog={openDialog}
      {...dialogs.preview.props}
    />
    <ExportDialog
      isOpen={dialogs.export.isOpen}
      onClose={() => closeDialog("export")}
      openDialog={openDialog}
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
      openDialog={openDialog}
      {...dialogs.load.props}
    />
    <ExportJSONDialog
      isOpen={dialogs.exportJSON.isOpen}
      onClose={() => closeDialog("exportJSON")}
      openDialog={openDialog}
      {...dialogs.exportJSON.props}
    />
    <TemplateBrowser
      isOpen={dialogs.templateBrowser.isOpen}
      onClose={() => closeDialog("templateBrowser")}
      openDialog={openDialog}
      {...dialogs.templateBrowser.props}
    />
    <SaveTemplateDialog
      isOpen={dialogs.saveTemplate.isOpen}
      onClose={() => closeDialog("saveTemplate")}
      openDialog={openDialog}
      {...dialogs.saveTemplate.props}
    />
    <MediaLibraryDialog
      isOpen={dialogs.mediaLibrary.isOpen}
      onClose={() => closeDialog("mediaLibrary")}
      openDialog={openDialog}
      {...dialogs.mediaLibrary.props}
      stage={stage}
    />
  </>
);
