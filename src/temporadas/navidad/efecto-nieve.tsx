'use client';

import * as React from 'react';

interface Copo {
  x: number;
  y: number;
  radio: number;
  velocidad: number;
  deriva: number;
  fase: number;
  celeste: boolean;
}

const CANTIDAD_COPOS = 70;

/** Nieve en un canvas fijo. No intercepta clics y respeta "reducir movimiento". */
export function EfectoNieve(): React.JSX.Element | null {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let ancho = 0;
    let alto = 0;
    const ajustar = () => {
      const dpr = window.devicePixelRatio || 1;
      ancho = window.innerWidth;
      alto = window.innerHeight;
      canvas.width = ancho * dpr;
      canvas.height = alto * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    ajustar();

    const nuevoCopo = (yInicial?: number): Copo => ({
      x: Math.random() * ancho,
      y: yInicial ?? -10,
      radio: 1.5 + Math.random() * 3,
      velocidad: 0.5 + Math.random() * 1.2,
      deriva: 0.3 + Math.random() * 0.8,
      fase: Math.random() * Math.PI * 2,
      celeste: Math.random() < 0.5,
    });
    const copos = Array.from({ length: CANTIDAD_COPOS }, () => nuevoCopo(Math.random() * alto));

    let frame = 0;
    let t = 0;
    const dibujar = () => {
      ctx.clearRect(0, 0, ancho, alto);
      t += 0.01;
      // Contorno azul marcado: es lo que permite verlos sobre fondo blanco, y
      // sobre el panel oscuro el relleno claro sigue destacando.
      ctx.shadowColor = 'rgba(60, 110, 190, 0.5)';
      ctx.shadowBlur = 3;
      ctx.strokeStyle = 'rgba(60, 110, 190, 0.85)';
      ctx.lineWidth = 1.2;
      for (const c of copos) {
        c.y += c.velocidad;
        c.x += Math.sin(t * c.deriva + c.fase) * 0.6;
        if (c.y > alto + 10) Object.assign(c, nuevoCopo());
        ctx.fillStyle = c.celeste ? '#bfe0ff' : '#ffffff';
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radio, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      frame = requestAnimationFrame(dibujar);
    };

    const alCambiarVisibilidad = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) frame = requestAnimationFrame(dibujar);
    };

    frame = requestAnimationFrame(dibujar);
    window.addEventListener('resize', ajustar);
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', ajustar);
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      // 1200: sobre el contenido pero bajo los modales de MUI (1300).
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1200 }}
    />
  );
}
