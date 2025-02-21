import { LayerObject } from "../../../types/editor";
import { SortableContext } from "@dnd-kit/sortable";
import { SortableLayerItem } from "./SortableLayerItem";
interface LayerContainerProps {
  layer: LayerObject;
  isRoot?: boolean;
  selectedIds: string[];
  onSelect: (id: string, multiSelect: boolean) => void;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onNameChange: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export const LayerContainer: React.FC<LayerContainerProps> = ({
  layer,
  isRoot,
  selectedIds,
  onSelect,
  onVisibilityChange,
  onNameChange,
  onDelete,
}) => {
  return (
    <div className={`layer-container ${isRoot ? "root-layer" : ""}`}>
      {layer && (
        <SortableLayerItem
          object={layer}
          isSelected={selectedIds.includes(layer.id)}
          onSelect={onSelect}
          onVisibilityChange={onVisibilityChange}
          onNameChange={onNameChange}
          onDelete={onDelete}
          depth={0}
        />
      )}
      <SortableContext items={layer.children.map((obj) => obj.id)}>
        <div className="layer-items">
          {layer.children.map((obj) => (
            <SortableLayerItem
              key={obj.id}
              object={obj}
              isSelected={selectedIds.includes(obj.id)}
              onSelect={onSelect}
              onVisibilityChange={onVisibilityChange}
              onNameChange={onNameChange}
              onDelete={onDelete}
              depth={1}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};
