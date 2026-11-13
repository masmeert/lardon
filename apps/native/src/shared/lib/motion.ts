export const motionMs = {
  exit: 100,
  fast: 150,
  moderate: 250,
  slow: 400,
} as const;

export const motionSpring = {
  fast: { damping: 28, stiffness: 420, mass: 1 },
} as const;
