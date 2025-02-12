import React, { useState } from "react";
import { Format, DEFAULT_FORMATS } from "../types/format";

interface FormatSelectorProps {
  currentFormat: Format;
  onFormatChange: (format: Format) => void;
  onCustomFormatAdd: (format: Format) => void;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  currentFormat,
  onFormatChange,
  onCustomFormatAdd,
}) => {
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customFormat, setCustomFormat] = useState({
    name: "",
    width: 0,
    height: 0,
  });

  const handleCustomFormatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customFormat.name && customFormat.width && customFormat.height) {
      const newFormat: Format = {
        id: `custom-${Date.now()}`,
        ...customFormat,
      };
      onCustomFormatAdd(newFormat);
      setIsAddingCustom(false);
      setCustomFormat({ name: "", width: 0, height: 0 });
    }
  };

  return (
    <div className="format-selector">
      <select
        value={currentFormat.id}
        onChange={(e) => {
          const format = DEFAULT_FORMATS.find((f) => f.id === e.target.value);
          if (format) onFormatChange(format);
        }}
      >
        {DEFAULT_FORMATS.map((format) => (
          <option key={format.id} value={format.id}>
            {format.name} ({format.width}x{format.height})
          </option>
        ))}
      </select>

      <button onClick={() => setIsAddingCustom(true)}>Add Custom Format</button>

      {isAddingCustom && (
        <div className="custom-format-modal">
          <form onSubmit={handleCustomFormatSubmit}>
            <h3>Add Custom Format</h3>
            <label>
              Name:
              <input
                type="text"
                value={customFormat.name}
                onChange={(e) =>
                  setCustomFormat({ ...customFormat, name: e.target.value })
                }
                required
              />
            </label>
            <label>
              Width:
              <input
                type="number"
                value={customFormat.width || ""}
                onChange={(e) =>
                  setCustomFormat({
                    ...customFormat,
                    width: parseInt(e.target.value),
                  })
                }
                required
                min="1"
              />
            </label>
            <label>
              Height:
              <input
                type="number"
                value={customFormat.height || ""}
                onChange={(e) =>
                  setCustomFormat({
                    ...customFormat,
                    height: parseInt(e.target.value),
                  })
                }
                required
                min="1"
              />
            </label>
            <div className="modal-actions">
              <button type="submit">Add</button>
              <button type="button" onClick={() => setIsAddingCustom(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
