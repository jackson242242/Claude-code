/**
 * One-shot festival confetti for celebration moments (e.g. a confirmed
 * booking). Pure CSS animation, deterministic pieces (SSR-safe), and fully
 * disabled under `prefers-reduced-motion` via the stylesheet.
 */
const PIECES: ReadonlyArray<{
  left: string;
  color: string;
  delay: string;
  duration: string;
}> = [
  { left: '6%', color: 'var(--festival-orange)', delay: '0s', duration: '1.6s' },
  { left: '15%', color: 'var(--festival-magenta)', delay: '0.18s', duration: '1.9s' },
  { left: '24%', color: 'var(--festival-blue)', delay: '0.32s', duration: '1.7s' },
  { left: '33%', color: 'var(--festival-gold)', delay: '0.08s', duration: '2s' },
  { left: '42%', color: 'var(--accent)', delay: '0.45s', duration: '1.75s' },
  { left: '51%', color: 'var(--festival-orange)', delay: '0.22s', duration: '1.85s' },
  { left: '60%', color: 'var(--festival-magenta)', delay: '0.5s', duration: '1.6s' },
  { left: '69%', color: 'var(--festival-blue)', delay: '0.12s', duration: '2s' },
  { left: '78%', color: 'var(--festival-gold)', delay: '0.38s', duration: '1.7s' },
  { left: '87%', color: 'var(--accent)', delay: '0.28s', duration: '1.9s' },
  { left: '94%', color: 'var(--festival-orange)', delay: '0.05s', duration: '1.8s' },
];

export const CelebrationConfetti = () => (
  <div className="confetti-layer" aria-hidden="true" data-testid="confetti">
    {PIECES.map((piece, index) => (
      <span
        key={index}
        className="confetti"
        style={{
          left: piece.left,
          background: piece.color,
          animationDelay: piece.delay,
          animationDuration: piece.duration,
        }}
      />
    ))}
  </div>
);
