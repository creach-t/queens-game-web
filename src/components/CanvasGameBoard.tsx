  // ✅ HACHURES AMÉLIORÉES - Plus épaisses et limitées à la cellule
  const drawConflictPattern = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    intensity: 'light' | 'heavy'
  ) => {
    ctx.save();
    
    // ✅ CORRECTIF: Limiter le dessin aux frontières de la cellule
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.clip();
    
    if (intensity === 'light') {
      // Hachures légères pour zones en conflit
      ctx.fillStyle = 'rgba(231, 76, 60, 0.25)';
      ctx.fillRect(x, y, size, size);
      
      // ✅ HACHURES PLUS ÉPAISSES
      ctx.strokeStyle = 'rgba(231, 76, 60, 0.7)';
      ctx.lineWidth = 3; // Plus épais
      ctx.beginPath();
      
      // ✅ ESPACEMENT RÉDUIT pour plus de visibilité
      for (let i = 0; i < size * 2; i += 6) {
        ctx.moveTo(x + i - size, y);
        ctx.lineTo(x + i, y + size);
      }
      ctx.stroke();
    } else {
      // Hachures lourdes pour reines en conflit
      ctx.fillStyle = 'rgba(231, 76, 60, 0.45)';
      ctx.fillRect(x, y, size, size);
      
      // ✅ HACHURES TRÈS ÉPAISSES pour reines
      ctx.strokeStyle = 'rgba(231, 76, 60, 0.9)';
      ctx.lineWidth = 4; // Très épais
      ctx.beginPath();
      
      for (let i = 0; i < size * 2; i += 4) {
        ctx.moveTo(x + i - size, y);
        ctx.lineTo(x + i, y + size);
      }
      ctx.stroke();
    }
    
    ctx.restore(); // ✅ Restore annule automatiquement le clip
  }, []);