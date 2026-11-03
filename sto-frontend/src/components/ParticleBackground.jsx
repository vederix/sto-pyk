import React from 'react';

/**
 * Static Pure CSS Backdrop (Animation Removed for Maximum Performance)
 * Zero JavaScript animation loop, zero GPU/CPU thread consumption.
 */
export default function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Static Ambient Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-rose-600/10 blur-3xl rounded-full pointer-events-none" />
      {/* Subtle Network Dot Grid */}
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#be123c_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
    </div>
  );
}
