import type { Point, PatternState } from '../types';

// Calculate star points for polygon patterns
export function calculateStarPoints(
  cx: number,
  cy: number,
  outerRadius: number,
  points: number,
  innerRadiusFactor: number
): Point[] {
  const waypoints: Point[] = [];
  const innerRadius = outerRadius * innerRadiusFactor;
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i / (points * 2)) * 2 * Math.PI - Math.PI / 2;
    waypoints.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    });
  }
  return waypoints;
}

// Simple pseudo-noise function
export function noise(x = 0, y = 0, z = 0): number {
  let random = Math.sin(x * 12.9898 + y * 78.233 + z * 45.543) * 43758.5453;
  return (random - Math.floor(random)) * 2 - 1;
}

// Initialize pattern state and waypoints
export function initializePatternState(
  patternName: string,
  areaWidth: number,
  areaHeight: number,
  objectWidth: number,
  objectHeight: number
): { state: PatternState; initialPosition: Point } {
  const centerX = areaWidth / 2;
  const centerY = areaHeight / 2;
  const maxRadius = Math.min(areaWidth - objectWidth, areaHeight - objectHeight) / 2 * 0.9;

  const state: PatternState = {
    waypoints: [],
    currentWaypointIndex: 0,
    segmentProgress: 0,
    angle: 0,
    directionX: Math.random() > 0.5 ? 1 : -1,
    directionY: Math.random() > 0.5 ? 1 : -1,
    noiseOffsetX: Math.random() * 1000,
    noiseOffsetY: Math.random() * 1000,
    noiseOffsetZ: Math.random() * 1000,
  };

  switch (patternName) {
    case 'triangle':
      state.waypoints = [
        { x: centerX, y: centerY - maxRadius },
        { x: centerX - maxRadius * Math.sqrt(3) / 2, y: centerY + maxRadius / 2 },
        { x: centerX + maxRadius * Math.sqrt(3) / 2, y: centerY + maxRadius / 2 }
      ];
      break;

    case 'squarePath':
      state.waypoints = [
        { x: centerX - maxRadius, y: centerY - maxRadius },
        { x: centerX + maxRadius, y: centerY - maxRadius },
        { x: centerX + maxRadius, y: centerY + maxRadius },
        { x: centerX - maxRadius, y: centerY + maxRadius }
      ];
      break;

    case 'rectangle':
      const rectWidth = Math.min(maxRadius * 1.5, areaWidth - objectWidth);
      const rectHeight = maxRadius;
      state.waypoints = [
        { x: centerX - rectWidth / 2, y: centerY - rectHeight / 2 },
        { x: centerX + rectWidth / 2, y: centerY - rectHeight / 2 },
        { x: centerX + rectWidth / 2, y: centerY + rectHeight / 2 },
        { x: centerX - rectWidth / 2, y: centerY + rectHeight / 2 }
      ];
      break;

    case 'pentagon':
    case 'hexagon':
    case 'heptagon':
    case 'octagon':
    case 'nonagon':
    case 'decagon': {
      const sides = {
        pentagon: 5, hexagon: 6, heptagon: 7, octagon: 8, nonagon: 9, decagon: 10
      }[patternName] || 5;
      
      state.waypoints = [];
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * 2 * Math.PI - Math.PI / 2;
        state.waypoints.push({
          x: centerX + maxRadius * Math.cos(angle),
          y: centerY + maxRadius * Math.sin(angle)
        });
      }
      break;
    }

    case 'rhombus':
      state.waypoints = [
        { x: centerX, y: centerY - maxRadius },
        { x: centerX + maxRadius * 0.7, y: centerY },
        { x: centerX, y: centerY + maxRadius },
        { x: centerX - maxRadius * 0.7, y: centerY }
      ];
      break;

    case 'trapezoid': {
      const trapTop = maxRadius * 1.2;
      const trapBottom = maxRadius * 1.8;
      state.waypoints = [
        { x: centerX - trapTop / 2, y: centerY - maxRadius / 2 },
        { x: centerX + trapTop / 2, y: centerY - maxRadius / 2 },
        { x: centerX + trapBottom / 2, y: centerY + maxRadius / 2 },
        { x: centerX - trapBottom / 2, y: centerY + maxRadius / 2 }
      ];
      break;
    }

    case 'kite':
      state.waypoints = [
        { x: centerX, y: centerY - maxRadius },
        { x: centerX + maxRadius * 0.6, y: centerY + maxRadius * 0.2 },
        { x: centerX, y: centerY + maxRadius },
        { x: centerX - maxRadius * 0.6, y: centerY + maxRadius * 0.2 }
      ];
      break;

    case 'parallelogram': {
      const paraOffset = maxRadius * 0.5;
      state.waypoints = [
        { x: centerX - maxRadius + paraOffset, y: centerY - maxRadius * 0.6 },
        { x: centerX + maxRadius + paraOffset, y: centerY - maxRadius * 0.6 },
        { x: centerX + maxRadius - paraOffset, y: centerY + maxRadius * 0.6 },
        { x: centerX - maxRadius - paraOffset, y: centerY + maxRadius * 0.6 }
      ];
      break;
    }

    case 'hexagram':
      state.waypoints = calculateStarPoints(centerX, centerY, maxRadius, 6, 0.5);
      break;

    case 'decagram':
      state.waypoints = calculateStarPoints(centerX, centerY, maxRadius, 10, 0.5);
      break;
  }

  const initialPosition = state.waypoints.length > 0
    ? state.waypoints[0]
    : { x: centerX - objectWidth / 2, y: centerY - objectHeight / 2 };

  return { state, initialPosition };
}

// Pattern movement functions
export function patternRandom(
  positionX: number,
  positionY: number,
  state: PatternState,
  aw: number,
  ah: number,
  ow: number,
  oh: number,
  moveAmount: number
): Point {
  let newX = positionX + state.directionX * moveAmount;
  let newY = positionY + state.directionY * moveAmount;

  if (newX <= 0 || newX >= aw - ow) {
    state.directionX *= -1;
    newX = Math.max(0, Math.min(newX, aw - ow));
  }
  if (newY <= 0 || newY >= ah - oh) {
    state.directionY *= -1;
    newY = Math.max(0, Math.min(newY, ah - oh));
  }

  return { x: newX, y: newY };
}

export function patternHorizontal(
  positionX: number,
  state: PatternState,
  aw: number,
  ah: number,
  ow: number,
  oh: number,
  moveAmount: number
): Point {
  let newX = positionX + state.directionX * moveAmount;
  const newY = ah / 2 - oh / 2;

  if (newX <= 0 || newX >= aw - ow) {
    state.directionX *= -1;
    newX = Math.max(0, Math.min(newX, aw - ow));
  }

  return { x: newX, y: newY };
}

export function patternVertical(
  positionY: number,
  state: PatternState,
  aw: number,
  ah: number,
  ow: number,
  oh: number,
  moveAmount: number
): Point {
  const newX = aw / 2 - ow / 2;
  let newY = positionY + state.directionY * moveAmount;

  if (newY <= 0 || newY >= ah - oh) {
    state.directionY *= -1;
    newY = Math.max(0, Math.min(newY, ah - oh));
  }

  return { x: newX, y: newY };
}

export function patternCircle(
  aw: number,
  ah: number,
  ow: number,
  oh: number,
  state: PatternState,
  speedMultiplier: number,
  delta: number
): Point {
  const radius = Math.min(aw - ow, ah - oh) / 2 * 0.9;
  const centerX = aw / 2;
  const centerY = ah / 2;
  const angularSpeed = speedMultiplier * 1.0 * delta;

  state.angle += angularSpeed;
  return {
    x: centerX + radius * Math.cos(state.angle) - ow / 2,
    y: centerY + radius * Math.sin(state.angle) - oh / 2
  };
}

export function patternOval(
  aw: number,
  ah: number,
  ow: number,
  oh: number,
  state: PatternState,
  speedMultiplier: number,
  delta: number
): Point {
  const radiusX = (aw - ow) / 2 * 0.9;
  const radiusY = (ah - oh) / 2 * 0.6;
  const centerX = aw / 2;
  const centerY = ah / 2;
  const angularSpeed = speedMultiplier * 1.0 * delta;

  state.angle += angularSpeed;
  return {
    x: centerX + radiusX * Math.cos(state.angle) - ow / 2,
    y: centerY + radiusY * Math.sin(state.angle) - oh / 2
  };
}

export function patternFigureEight(
  aw: number,
  ah: number,
  ow: number,
  oh: number,
  state: PatternState,
  speedMultiplier: number,
  delta: number
): Point {
  const radiusX = (aw - ow) / 2 * 0.8;
  const radiusY = (ah - oh) / 2 * 0.8;
  const centerX = aw / 2;
  const centerY = ah / 2;
  const angularSpeed = speedMultiplier * 1.0 * delta;

  state.angle += angularSpeed;
  return {
    x: centerX + radiusX * Math.sin(state.angle) - ow / 2,
    y: centerY + radiusY * Math.sin(2 * state.angle) - oh / 2
  };
}

export function patternSuperellipse(
  aw: number,
  ah: number,
  ow: number,
  oh: number,
  state: PatternState,
  speedMultiplier: number,
  delta: number
): Point {
  const n = 4;
  const radiusX = (aw - ow) / 2 * 0.9;
  const radiusY = (ah - oh) / 2 * 0.9;
  const centerX = aw / 2;
  const centerY = ah / 2;
  const angularSpeed = speedMultiplier * 1.0 * delta;

  state.angle += angularSpeed;
  const cosAngle = Math.cos(state.angle);
  const sinAngle = Math.sin(state.angle);

  return {
    x: centerX + radiusX * Math.sign(cosAngle) * Math.pow(Math.abs(cosAngle), 2 / n) - ow / 2,
    y: centerY + radiusY * Math.sign(sinAngle) * Math.pow(Math.abs(sinAngle), 2 / n) - oh / 2
  };
}

export function patternDeltoid(
  aw: number,
  ah: number,
  ow: number,
  oh: number,
  state: PatternState,
  speedMultiplier: number,
  delta: number
): Point {
  const R = Math.min(aw - ow, ah - oh) / 4;
  const r = R / 3;
  const centerX = aw / 2;
  const centerY = ah / 2;
  const angularSpeed = speedMultiplier * 1.0 * delta;

  state.angle += angularSpeed;
  return {
    x: centerX + (R - r) * Math.cos(state.angle) + r * Math.cos(((R - r) / r) * state.angle) - ow / 2,
    y: centerY + (R - r) * Math.sin(state.angle) - r * Math.sin(((R - r) / r) * state.angle) - oh / 2
  };
}

export function patternRandomized(
  positionX: number,
  positionY: number,
  state: PatternState,
  aw: number,
  ah: number,
  ow: number,
  oh: number,
  speedMultiplier: number,
  delta: number
): Point {
  const timeFactor = 0.1 * speedMultiplier;
  state.noiseOffsetZ += delta * timeFactor;

  let noiseX = noise(state.noiseOffsetX, state.noiseOffsetZ);
  let noiseY = noise(state.noiseOffsetY, state.noiseOffsetZ);

  let targetX = (aw / 2) + noiseX * (aw / 2 * 0.9);
  let targetY = (ah / 2) + noiseY * (ah / 2 * 0.9);

  const moveAmount = speedMultiplier * 100 * delta * 0.5;
  const dx = targetX - (positionX + ow / 2);
  const dy = targetY - (positionY + oh / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  let newX = positionX;
  let newY = positionY;

  if (dist > 1) {
    newX += (dx / dist) * Math.min(moveAmount, dist);
    newY += (dy / dist) * Math.min(moveAmount, dist);
  }

  return {
    x: Math.max(0, Math.min(newX, aw - ow)),
    y: Math.max(0, Math.min(newY, ah - oh))
  };
}

// Path following helper
export function followPath(
  positionX: number,
  positionY: number,
  state: PatternState,
  moveAmount: number
): Point {
  if (!state.waypoints || state.waypoints.length < 2) {
    return { x: positionX, y: positionY };
  }

  const waypoints = state.waypoints;
  let currentIndex = state.currentWaypointIndex;
  let nextIndex = (currentIndex + 1) % waypoints.length;

  const startPoint = waypoints[currentIndex];
  const endPoint = waypoints[nextIndex];

  const targetVectorX = endPoint.x - startPoint.x;
  const targetVectorY = endPoint.y - startPoint.y;
  const segmentLength = Math.sqrt(targetVectorX * targetVectorX + targetVectorY * targetVectorY);

  if (segmentLength > 0) {
    state.segmentProgress += moveAmount / segmentLength;
  } else {
    state.segmentProgress = 1;
  }

  if (state.segmentProgress >= 1.0) {
    state.currentWaypointIndex = nextIndex;
    state.segmentProgress = 0;
    return { x: endPoint.x, y: endPoint.y };
  } else {
    return {
      x: startPoint.x + targetVectorX * state.segmentProgress,
      y: startPoint.y + targetVectorY * state.segmentProgress
    };
  }
}
