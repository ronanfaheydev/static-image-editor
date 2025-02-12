import React from "react";
import { PreviewDialog } from "./PreviewDialog";
import { ExportDialog } from "./ExportDialog";
import { SaveDialog } from "./SaveDialog";
import { LoadDialog } from "./LoadDialog";
import { TemplateBrowser } from "./TemplateBrowser";
import { SaveTemplateDialog } from "./SaveTemplateDialog";
import { ExportJSONDialog } from "./ExportJSONDialog";

interface DialogManagerProps {
  dialogs: {
    [key: string]: {
      isOpen: boolean;
      props: any;
    };
  };
  closeDialog: (dialogName: string) => void;
}

export const DialogManager: React.FC<DialogManagerProps> = ({
  dialogs,
  closeDialog,
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
  </>
);
