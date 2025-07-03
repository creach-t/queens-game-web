import { useCallback, useRef, useState } from 'react';
import { DragEventData, DragState, TouchState } from '../types/game';

export function useDragSystem() {
  // États du drag
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragStartCell: null,
    dragMode: null,
    draggedCells: new Set(),
    dragPreviewCells: new Set()
  });

  // États du touch
  const [touchState, setTouchState] = useState<TouchState>({
    isTouch: false,
    touchStartTime: 0,
    touchStartPosition: null
  });

  // Référence pour éviter les conflits avec les clics normaux
  const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ UTILITAIRE: Unifier les événements mouse et touch
  const getEventData = useCallback((e: React.MouseEvent | React.TouchEvent): DragEventData => {
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        clientX: touch.clientX,
        clientY: touch.clientY,
        type: 'touch'
      };
    } else {
      return {
        clientX: e.clientX,
        clientY: e.clientY,
        type: 'mouse'
      };
    }
  }, []);

  // ✅ DÉMARRAGE du drag
  const startDrag = useCallback((
    cell: { row: number; col: number },
    cellState: 'empty' | 'queen' | 'marked',
    eventData: DragEventData
  ) => {
    // Empêcher la sélection de texte
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    // Ne pas dragger les reines
    if (cellState === 'queen') {
      return false;
    }

    // Déterminer le mode de drag
    const dragMode = cellState === 'empty' ? 'mark' : 'unmark';
    const cellKey = `${cell.row}-${cell.col}`;

    setDragState({
      isDragging: true,
      dragStartCell: cell,
      dragMode,
      draggedCells: new Set([cellKey]),
      dragPreviewCells: new Set([cellKey])
    });

    if (eventData.type === 'touch') {
      setTouchState({
        isTouch: true,
        touchStartTime: Date.now(),
        touchStartPosition: { x: eventData.clientX, y: eventData.clientY }
      });
    }

    return true;
  }, []);

  // ✅ CONTINUATION du drag
  const updateDrag = useCallback((cell: { row: number; col: number }) => {
    if (!dragState.isDragging) return;

    const cellKey = `${cell.row}-${cell.col}`;
    
    setDragState(prev => {
      const newDraggedCells = new Set(prev.draggedCells);
      const newPreviewCells = new Set(prev.draggedCells);
      
      // Ajouter la nouvelle cellule
      newDraggedCells.add(cellKey);
      newPreviewCells.add(cellKey);

      return {
        ...prev,
        draggedCells: newDraggedCells,
        dragPreviewCells: newPreviewCells
      };
    });
  }, [dragState.isDragging]);

  // ✅ FIN du drag avec application des changements
  const endDrag = useCallback((
    onCellChange: (row: number, col: number, newState: 'empty' | 'marked') => void
  ) => {
    if (!dragState.isDragging) return [];

    const changedCells: { row: number; col: number; newState: 'empty' | 'marked' }[] = [];

    // Appliquer les changements à toutes les cellules draggées
    dragState.draggedCells.forEach(cellKey => {
      const [row, col] = cellKey.split('-').map(Number);
      const newState = dragState.dragMode === 'mark' ? 'marked' : 'empty';
      
      onCellChange(row, col, newState);
      changedCells.push({ row, col, newState });
    });

    // Nettoyer l'état
    setDragState({
      isDragging: false,
      dragStartCell: null,
      dragMode: null,
      draggedCells: new Set(),
      dragPreviewCells: new Set()
    });

    setTouchState({
      isTouch: false,
      touchStartTime: 0,
      touchStartPosition: null
    });

    // Restaurer la sélection de texte
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';

    return changedCells;
  }, [dragState]);

  // ✅ ANNULATION du drag
  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      dragStartCell: null,
      dragMode: null,
      draggedCells: new Set(),
      dragPreviewCells: new Set()
    });

    setTouchState({
      isTouch: false,
      touchStartTime: 0,
      touchStartPosition: null
    });

    // Restaurer la sélection de texte
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';

    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = null;
    }
  }, []);

  // ✅ VÉRIFIER si une cellule est dans le drag
  const isCellInDrag = useCallback((row: number, col: number): boolean => {
    if (!dragState.isDragging) return false;
    const cellKey = `${row}-${col}`;
    return dragState.draggedCells.has(cellKey);
  }, [dragState.isDragging, dragState.draggedCells]);

  // ✅ VÉRIFIER si une cellule est en preview
  const isCellInPreview = useCallback((row: number, col: number): boolean => {
    if (!dragState.isDragging) return false;
    const cellKey = `${row}-${col}`;
    return dragState.dragPreviewCells.has(cellKey);
  }, [dragState.isDragging, dragState.dragPreviewCells]);

  return {
    dragState,
    touchState,
    getEventData,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    isCellInDrag,
    isCellInPreview
  };
}
