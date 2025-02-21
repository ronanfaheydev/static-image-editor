import React, { useEffect, useRef } from "react";
import "./ContextMenu.scss";

export interface ContextMenuItem {
  label: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
  shortcut?: string;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  position,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  console.log(items);

  return (
    <div
      className="context-menu"
      style={{ top: position.y, left: position.x }}
      ref={menuRef}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.separator && <div className="separator" />}
          <button
            className="menu-item"
            onClick={() => {
              debugger;
              item.action();
              onClose();
            }}
            disabled={item.disabled}
          >
            <span>{item.label}</span>
            {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
