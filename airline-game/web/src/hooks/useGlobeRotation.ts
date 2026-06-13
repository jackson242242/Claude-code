'use client';

// V3.2: Globe drag-to-rotate hook.
// Manages λ (longitude) rotation with pointer drag events.
// φ (latitude) is clamped to ±80° to keep poles visible and avoid flipping.

import { useCallback, useRef, useState } from 'react';

export type GlobeRotation = {
  lambda: number;
  phi: number;
};

export type UseGlobeRotationReturn = {
  rotation: GlobeRotation;
  /** Attach to SVG onPointerDown */
  onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => void;
  /** Attach to SVG onPointerMove */
  onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
  /** Attach to SVG onPointerUp */
  onPointerUp: (e: React.PointerEvent<SVGSVGElement>) => void;
  /** Attach to SVG onPointerLeave */
  onPointerLeave: (e: React.PointerEvent<SVGSVGElement>) => void;
};

const PHI_MAX = 80;
const DRAG_SCALE = 0.4; // degrees per pixel

export const useGlobeRotation = (
  initialLambda = 0,
  initialPhi = 0,
): UseGlobeRotationReturn => {
  const [rotation, setRotation] = useState<GlobeRotation>({
    lambda: initialLambda,
    phi: initialPhi,
  });

  const dragging = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const rafId = useRef<number | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    dragging.current = true;
    lastX.current = e.clientX;
    lastY.current = e.clientY;
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastX.current;
    const dy = e.clientY - lastY.current;
    lastX.current = e.clientX;
    lastY.current = e.clientY;

    if (rafId.current !== null) return; // throttle to rAF
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      setRotation((prev) => {
        const newLambda = prev.lambda + dx * DRAG_SCALE;
        const newPhi = Math.max(
          -PHI_MAX,
          Math.min(PHI_MAX, prev.phi - dy * DRAG_SCALE),
        );
        return { lambda: newLambda, phi: newPhi };
      });
    });
  }, []);

  const stopDrag = useCallback(() => {
    dragging.current = false;
  }, []);

  return {
    rotation,
    onPointerDown,
    onPointerMove,
    onPointerUp: stopDrag,
    onPointerLeave: stopDrag,
  };
};
