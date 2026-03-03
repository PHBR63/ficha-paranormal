/**
 * TextLayer - Camada de textos/anotações no mapa tático
 * 
 * Renderiza textos arrastáveis e editáveis no canvas.
 * - Clique com ferramenta "text" cria novo texto
 * - Double-click edita texto existente
 * - Drag move o texto
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Layer, Text, Group, Rect } from 'react-konva';
import Konva from 'konva';

/** Estrutura de um texto persistido */
export interface MapText {
  id: string;
  map_id: string;
  created_by: string;
  text: string;
  x: number;
  y: number;
  font_size: number;
  color: string;
  rotation: number;
  created_at: string;
}

interface TextLayerProps {
  /** Textos salvos no banco */
  texts: MapText[];
  /** Se o modo texto está ativo */
  isTextMode: boolean;
  /** Tamanho da fonte padrão */
  defaultFontSize: number;
  /** Cor padrão */
  defaultColor: string;
  /** Se é mestre (pode editar/mover todos) */
  isMaster: boolean;
  /** ID do usuário atual */
  currentUserId?: string;
  /** Callback ao criar um novo texto */
  onTextCreate: (text: Omit<MapText, 'id' | 'map_id' | 'created_by' | 'created_at'>) => void;
  /** Callback ao atualizar texto */
  onTextUpdate: (textId: string, data: Partial<MapText>) => void;
  /** Callback ao deletar texto */
  onTextDelete?: (textId: string) => void;
}

interface TextItemProps {
  item: MapText;
  isEditable: boolean;
  onUpdate: (data: Partial<MapText>) => void;
  onDelete?: () => void;
}

/**
 * Componente individual de texto no mapa
 */
function TextItem({ item, isEditable, onUpdate, onDelete }: TextItemProps) {
  const textRef = useRef<Konva.Text>(null);
  const [isEditing, setIsEditing] = useState(false);

  /** Abre editor inline ao double-click */
  const handleDoubleClick = useCallback(() => {
    if (!isEditable) return;

    const textNode = textRef.current;
    if (!textNode) return;

    // Posição absoluta do texto no canvas
    const stage = textNode.getStage();
    if (!stage) return;

    const textPosition = textNode.absolutePosition();
    const stageBox = stage.container().getBoundingClientRect();
    const areaPosition = {
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y,
    };

    // Cria input HTML posicionado sobre o texto
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    textarea.value = item.text;
    textarea.style.position = 'fixed';
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${Math.max(textNode.width(), 100)}px`;
    textarea.style.height = `${Math.max(textNode.height(), 30)}px`;
    textarea.style.fontSize = `${item.font_size}px`;
    textarea.style.border = '2px solid hsl(var(--primary))';
    textarea.style.padding = '2px 4px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'hsl(var(--background))';
    textarea.style.color = 'hsl(var(--foreground))';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = '1.2';
    textarea.style.fontFamily = 'sans-serif';
    textarea.style.zIndex = '10000';
    textarea.style.borderRadius = '4px';

    textarea.focus();
    setIsEditing(true);

    const removeTextarea = () => {
      const newText = textarea.value.trim();
      if (newText && newText !== item.text) {
        onUpdate({ text: newText });
      } else if (!newText && onDelete) {
        onDelete();
      }
      document.body.removeChild(textarea);
      setIsEditing(false);
    };

    textarea.addEventListener('blur', removeTextarea);
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        textarea.blur();
      }
      if (e.key === 'Escape') {
        textarea.value = item.text;
        textarea.blur();
      }
    });
  }, [isEditable, item, onUpdate, onDelete]);

  /** Handler de drag para mover o texto */
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isEditable) return;
    e.cancelBubble = true;
    onUpdate({
      x: Math.round(e.target.x()),
      y: Math.round(e.target.y()),
    });
  }, [isEditable, onUpdate]);

  return (
    <Text
      ref={textRef}
      x={item.x}
      y={item.y}
      text={item.text}
      fontSize={item.font_size}
      fill={item.color}
      rotation={item.rotation}
      draggable={isEditable}
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}
      onDragStart={(e) => { e.cancelBubble = true; }}
      onDragEnd={handleDragEnd}
      visible={!isEditing}
      shadowColor="#000"
      shadowBlur={2}
      shadowOpacity={0.8}
    />
  );
}

export function TextLayer({
  texts,
  isTextMode,
  defaultFontSize,
  defaultColor,
  isMaster,
  currentUserId,
  onTextCreate,
  onTextUpdate,
  onTextDelete,
}: TextLayerProps) {

  /** Handler de clique para criar novo texto */
  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!isTextMode) return;

    // Ignora se clicou em um texto existente
    if (e.target !== e.currentTarget) return;

    e.cancelBubble = true;
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getRelativePointerPosition();
    if (!pos) return;

    // Cria texto na posição do clique
    onTextCreate({
      text: 'Texto',
      x: Math.round(pos.x),
      y: Math.round(pos.y),
      font_size: defaultFontSize,
      color: defaultColor,
      rotation: 0,
    });
  }, [isTextMode, defaultFontSize, defaultColor, onTextCreate]);

  return (
    <Layer onClick={handleClick} onTap={handleClick}>
      {texts.map((item) => {
        const canEdit = isMaster || item.created_by === currentUserId;
        return (
          <TextItem
            key={item.id}
            item={item}
            isEditable={canEdit}
            onUpdate={(data) => onTextUpdate(item.id, data)}
            onDelete={onTextDelete ? () => onTextDelete(item.id) : undefined}
          />
        );
      })}
    </Layer>
  );
}

export default TextLayer;
