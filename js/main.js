document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const exerciseArea = document.getElementById('exercise-area');
    const movingObject = document.getElementById('moving-object');
    const instructions = document.getElementById('instructions'); // Optional instructions p tag

    // Unified UI Panel Elements
    const uiPanel = document.getElementById('ui-panel');
    const uiPanelHandle = document.getElementById('ui-panel-handle');
    const uiPanelContent = document.getElementById('ui-panel-content'); // For potential scroll locking

    // Music Controls
    const musicSourceSelect = document.getElementById('music-source');
    const musicPresetControl = document.getElementById('music-preset-control');
    const musicPresetSelect = document.getElementById('music-preset');
    const musicCustomControl = document.getElementById('music-custom-control');
    const musicCustomInput = document.getElementById('music-custom-input');
    const musicVolumeSlider = document.getElementById('music-volume');
    const musicVolumeValueSpan = document.getElementById('music-volume-value');

    // Action Controls (inside panel)
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');
    const stopButton = document.getElementById('stop-button');
    const sessionTimeDisplay = document.getElementById('session-time');
    const timerDisplayContainer = document.getElementById('timer'); // The div containing the timer text

    // Config Controls (inside panel)
    const patternSelect = document.getElementById('pattern');
    const speedSelect = document.getElementById('speed');
    const bounceToggle = document.getElementById('bounce-toggle');
    const bounceIntensitySlider = document.getElementById('bounce-intensity');

    const objectShapeSelect = document.getElementById('object-shape');
    const objectColorControl = document.getElementById('object-color-control');
    const objectColorPicker = document.getElementById('object-color');
    const objectImageControl = document.getElementById('object-image-control');
    const objectImageInput = document.getElementById('object-image');
    const objectSizeSlider = document.getElementById('object-size');
    const objectSizeValueSpan = document.getElementById('object-size-value');
    const objectOpacitySlider = document.getElementById('object-opacity'); // New
    const objectOpacityValueSpan = document.getElementById('object-opacity-value'); // New

    const bgTypeSelect = document.getElementById('bg-type'); // New
    const bgColorControl = document.getElementById('bg-color-control'); // New
    const bgColorPicker = document.getElementById('bg-color');
    const bgPresetControl = document.getElementById('bg-preset-control'); // New
    const bgPresetSelect = document.getElementById('bg-preset'); // New
    const bgCustomControl = document.getElementById('bg-custom-control'); // New
    const bgCustomInput = document.getElementById('bg-custom-input'); // New
    const bgLoopToggle = document.getElementById('bg-loop-toggle'); // New


    // --- State Variables ---
    const tracker = window.myopiaTracker;
    let animationId = null;
    let animationStartTime = null;
    let sessionStartTime = null;
    let pausedTime = 0;
    let timerInterval = null;
    let lastTimestamp = 0;

    // Audio state
    let audioPlayer = null;
    let currentVolume = 0.5;

    // Movement state
    let positionX = 0;
    let positionY = 0;
    let patternState = {}; // Holds pattern-specific state
    let peekabooState = { isVisible: true, timer: null };

    // Configuration state (read initial values)
    let currentPattern = patternSelect.value;
    let speedMultiplier = parseInt(speedSelect.value, 10);
    let bounceEnabled = bounceToggle.checked;
    let bounceIntensity = parseInt(bounceIntensitySlider.value, 10);
    let objectSize = parseInt(objectSizeSlider.value, 10);
    let objectOpacity = parseFloat(objectOpacitySlider.value); // New
    let objectImageElement = null; // Holds the inner <img> for object image

    // --- Helper Functions ---
    function getElementDimensions(element) {
        return { width: element.offsetWidth, height: element.offsetHeight };
    }

    function calculateMoveAmount(delta) {
        return speedMultiplier * 100 * delta; // Base speed pixels/sec
    }

    // --- Initialization ---
    function initializePatternState(patternName, areaWidth, areaHeight, objectWidth, objectHeight) {
        patternState = { // Reset common state
            waypoints: [],
            currentWaypointIndex: 0,
            segmentProgress: 0, // Progress (0 to 1) along the current line segment
            angle: 0,
            directionX: (Math.random() > 0.5 ? 1 : -1),
            directionY: (Math.random() > 0.5 ? 1 : -1),
            noiseOffsetX: Math.random() * 1000, // For Perlin noise like patterns
            noiseOffsetY: Math.random() * 1000,
            noiseOffsetZ: Math.random() * 1000,
        };

        const centerX = areaWidth / 2;
        const centerY = areaHeight / 2;
        // Use Math.min to ensure shapes fit within the smaller dimension
        const maxRadius = Math.min(areaWidth - objectWidth, areaHeight - objectHeight) / 2 * 0.9; // 90%

        // Define waypoints for path-based patterns
        switch (patternName) {
            case 'triangle':
                patternState.waypoints = [
                    { x: centerX, y: centerY - maxRadius }, // Top point
                    { x: centerX - maxRadius * Math.sqrt(3) / 2, y: centerY + maxRadius / 2 }, // Bottom left
                    { x: centerX + maxRadius * Math.sqrt(3) / 2, y: centerY + maxRadius / 2 }  // Bottom right
                ];
                break;
            case 'squarePath':
                 patternState.waypoints = [
                    { x: centerX - maxRadius, y: centerY - maxRadius }, // Top Left
                    { x: centerX + maxRadius, y: centerY - maxRadius }, // Top Right
                    { x: centerX + maxRadius, y: centerY + maxRadius }, // Bottom Right
                    { x: centerX - maxRadius, y: centerY + maxRadius }  // Bottom Left
                 ];
                 break;
            case 'rectangle':
                 const rectWidth = Math.min(maxRadius * 1.5, areaWidth - objectWidth); // Ensure width fits
                 const rectHeight = maxRadius;
                 patternState.waypoints = [
                     { x: centerX - rectWidth / 2, y: centerY - rectHeight / 2 },
                     { x: centerX + rectWidth / 2, y: centerY - rectHeight / 2 },
                     { x: centerX + rectWidth / 2, y: centerY + rectHeight / 2 },
                     { x: centerX - rectWidth / 2, y: centerY + rectHeight / 2 }
                 ];
                 break;
             // --- Add waypoint calculations for ALL polygon/shape patterns ---
             // Pentagon, Hexagon, Heptagon, Octagon, Nonagon, Decagon
             case 'pentagon': case 'hexagon': case 'heptagon': case 'octagon': case 'nonagon': case 'decagon':
                 let sides;
                 if (patternName === 'pentagon') sides = 5;
                 else if (patternName === 'hexagon') sides = 6;
                 else if (patternName === 'heptagon') sides = 7;
                 else if (patternName === 'octagon') sides = 8;
                 else if (patternName === 'nonagon') sides = 9;
                 else sides = 10; // decagon
                 patternState.waypoints = [];
                 for (let i = 0; i < sides; i++) {
                     const angle = (i / sides) * 2 * Math.PI - Math.PI / 2; // Start from top
                     patternState.waypoints.push({
                         x: centerX + maxRadius * Math.cos(angle),
                         y: centerY + maxRadius * Math.sin(angle)
                     });
                 }
                 break;
            // --- Add more complex shape waypoints/parameters ---
             case 'rhombus':
                  patternState.waypoints = [
                      { x: centerX, y: centerY - maxRadius }, // Top
                      { x: centerX + maxRadius * 0.7, y: centerY }, // Right
                      { x: centerX, y: centerY + maxRadius }, // Bottom
                      { x: centerX - maxRadius * 0.7, y: centerY }  // Left
                  ];
                  break;
             case 'trapezoid':
                  const trapTop = maxRadius * 1.2;
                  const trapBottom = maxRadius * 1.8;
                  patternState.waypoints = [
                      { x: centerX - trapTop / 2, y: centerY - maxRadius / 2 },
                      { x: centerX + trapTop / 2, y: centerY - maxRadius / 2 },
                      { x: centerX + trapBottom / 2, y: centerY + maxRadius / 2 },
                      { x: centerX - trapBottom / 2, y: centerY + maxRadius / 2 }
                  ];
                  break;
             case 'kite':
                  patternState.waypoints = [
                      { x: centerX, y: centerY - maxRadius }, // Top
                      { x: centerX + maxRadius * 0.6, y: centerY + maxRadius * 0.2 }, // Mid-Right
                      { x: centerX, y: centerY + maxRadius }, // Bottom
                      { x: centerX - maxRadius * 0.6, y: centerY + maxRadius * 0.2 }  // Mid-Left
                  ];
                  break;
             case 'parallelogram':
                 const paraOffset = maxRadius * 0.5;
                 patternState.waypoints = [
                     { x: centerX - maxRadius + paraOffset, y: centerY - maxRadius * 0.6 },
                     { x: centerX + maxRadius + paraOffset, y: centerY - maxRadius * 0.6 },
                     { x: centerX + maxRadius - paraOffset, y: centerY + maxRadius * 0.6 },
                     { x: centerX - maxRadius - paraOffset, y: centerY + maxRadius * 0.6 }
                 ];
                 break;
            // Star patterns might need different logic (draw lines between non-adjacent vertices)
             case 'hexagram': // 6 points
                 patternState.waypoints = calculateStarPoints(centerX, centerY, maxRadius, 6, 0.5); // 6 points, inner radius 50%
                 break;
             case 'decagram': // 10 points
                 patternState.waypoints = calculateStarPoints(centerX, centerY, maxRadius, 10, 0.5); // 10 points, inner radius 50%
                 break;
            // --- Other patterns ---
            case 'oval': // Handled directly in its function
            case 'superellipse': // Handled directly
            case 'deltoid': // Handled directly
            case 'randomized': // Handled directly
            case 'peekaboo': // Handled in main loop
            default: // random, horizontal, vertical, circle, figureEight
                // Use existing random directions or set specific start for others
                break;
        }

        // Set initial position based on pattern start
        if (patternState.waypoints.length > 0) {
            positionX = patternState.waypoints[0].x;
            positionY = patternState.waypoints[0].y;
        } else {
            // Default to center for non-waypoint patterns
             positionX = centerX - objectWidth / 2;
             positionY = centerY - objectHeight / 2;
        }
        movingObject.style.left = `${positionX}px`;
        movingObject.style.top = `${positionY}px`;
    }

    function calculateStarPoints(cx, cy, outerRadius, points, innerRadiusFactor) {
         const waypoints = [];
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


    function resetObjectPosition() {
        clearTimeout(peekabooState.timer); // Stop any pending peekaboo actions
        peekabooState.isVisible = true; // Ensure visible on reset
        movingObject.style.visibility = 'visible';

        const { width: areaWidth, height: areaHeight } = getElementDimensions(exerciseArea);
        const { width: objectWidth, height: objectHeight } = getElementDimensions(movingObject); // Read current size

        initializePatternState(currentPattern, areaWidth, areaHeight, objectWidth, objectHeight);
        lastTimestamp = 0; // Reset timestamp for delta calculation
    }

    // --- Path Following Helper ---
     function followPath(areaWidth, areaHeight, objectWidth, objectHeight, delta) {
         if (!patternState.waypoints || patternState.waypoints.length < 2) {
             // Fallback to random if no waypoints defined for the current pattern
              return patternRandom(areaWidth, areaHeight, objectWidth, objectHeight, delta);
         }

         const moveAmount = calculateMoveAmount(delta);
         const waypoints = patternState.waypoints;
         let currentIndex = patternState.currentWaypointIndex;
         let nextIndex = (currentIndex + 1) % waypoints.length;

         const startPoint = waypoints[currentIndex];
         const endPoint = waypoints[nextIndex];

         const targetVectorX = endPoint.x - startPoint.x;
         const targetVectorY = endPoint.y - startPoint.y;
         const segmentLength = Math.sqrt(targetVectorX * targetVectorX + targetVectorY * targetVectorY);

         // Calculate distance to move along the segment this frame
         let distanceToMove = moveAmount;

         // Calculate current position along the segment based on progress
         // Note: This calculation was slightly off, should use current positionX/Y
         // Let's recalculate based on progress from startPoint
         // let currentSegmentPosX = startPoint.x + targetVectorX * patternState.segmentProgress;
         // let currentSegmentPosY = startPoint.y + targetVectorY * patternState.segmentProgress;

         // Update progress
         if (segmentLength > 0) {
             patternState.segmentProgress += distanceToMove / segmentLength;
         } else {
              patternState.segmentProgress = 1; // Skip zero-length segments
         }


         // Check if we reached or passed the waypoint
         if (patternState.segmentProgress >= 1.0) {
             // Calculate overshoot to carry over to next segment if needed (optional, adds complexity)
             // const overshoot = (patternState.segmentProgress - 1.0) * segmentLength;

             // Move exactly to the end point for this frame
              positionX = endPoint.x;
              positionY = endPoint.y;
              // Move to the next segment
              patternState.currentWaypointIndex = nextIndex;
              patternState.segmentProgress = 0; // Reset progress for new segment (or apply overshoot)
         } else {
             // Interpolate position along the current segment
              positionX = startPoint.x + targetVectorX * patternState.segmentProgress;
              positionY = startPoint.y + targetVectorY * patternState.segmentProgress;
         }

         return { x: positionX, y: positionY };
     }
    // --- End Path Following ---

    // --- Movement Pattern Functions ---
    // All patterns receive current object dimensions: (aw, ah, ow, oh, d)
    // where d is delta time

    function patternRandom(aw, ah, ow, oh, d) {
        const moveAmount = calculateMoveAmount(d);
        positionX += patternState.directionX * moveAmount;
        positionY += patternState.directionY * moveAmount;

        if (positionX <= 0 || positionX >= aw - ow) {
            patternState.directionX *= -1;
            positionX = Math.max(0, Math.min(positionX, aw - ow)); // Clamp position
        }
        if (positionY <= 0 || positionY >= ah - oh) {
            patternState.directionY *= -1;
            positionY = Math.max(0, Math.min(positionY, ah - oh)); // Clamp position
        }
        return { x: positionX, y: positionY };
    }

    function patternHorizontal(aw, ah, ow, oh, d) {
        const moveAmount = calculateMoveAmount(d);
        positionX += patternState.directionX * moveAmount;
        positionY = ah / 2 - oh / 2; // Keep centered vertically

        if (positionX <= 0 || positionX >= aw - ow) {
            patternState.directionX *= -1;
            positionX = Math.max(0, Math.min(positionX, aw - ow));
        }
        return { x: positionX, y: positionY };
    }

     function patternVertical(aw, ah, ow, oh, d) {
        const moveAmount = calculateMoveAmount(d);
        positionX = aw / 2 - ow / 2; // Keep centered horizontally
        positionY += patternState.directionY * moveAmount;

        if (positionY <= 0 || positionY >= ah - oh) {
            patternState.directionY *= -1;
            positionY = Math.max(0, Math.min(positionY, ah - oh));
        }
        return { x: positionX, y: positionY };
    }

    function patternCircle(aw, ah, ow, oh, d) {
        const radius = Math.min(aw - ow, ah - oh) / 2 * 0.9;
        const centerX = aw / 2;
        const centerY = ah / 2;
        const angularSpeed = speedMultiplier * 1.0 * d; // Radians per second (adjust base speed if needed)

        patternState.angle += angularSpeed;
        positionX = centerX + radius * Math.cos(patternState.angle) - ow / 2;
        positionY = centerY + radius * Math.sin(patternState.angle) - oh / 2;
        return { x: positionX, y: positionY };
    }

    function patternOval(aw, ah, ow, oh, d) {
         const radiusX = (aw - ow) / 2 * 0.9; // Wider radius
         const radiusY = (ah - oh) / 2 * 0.6; // Shorter radius
         const centerX = aw / 2;
         const centerY = ah / 2;
         const angularSpeed = speedMultiplier * 1.0 * d;

         patternState.angle += angularSpeed;
         positionX = centerX + radiusX * Math.cos(patternState.angle) - ow / 2;
         positionY = centerY + radiusY * Math.sin(patternState.angle) - oh / 2;
         return { x: positionX, y: positionY };
     }

     function patternFigureEight(aw, ah, ow, oh, d) {
        const radiusX = (aw - ow) / 2 * 0.8;
        const radiusY = (ah - oh) / 2 * 0.8;
        const centerX = aw / 2;
        const centerY = ah / 2;
        const angularSpeed = speedMultiplier * 1.0 * d;

        patternState.angle += angularSpeed;
        // Lissajous curve for figure eight (sin(angle), sin(2*angle))
        positionX = centerX + radiusX * Math.sin(patternState.angle) - ow / 2;
        positionY = centerY + radiusY * Math.sin(2 * patternState.angle) - oh / 2;
        return { x: positionX, y: positionY };
    }

    function patternSuperellipse(aw, ah, ow, oh, d) {
        // Equation: |x/a|^n + |y/b|^n = 1. Using n=4 for a rounded square.
        const n = 4;
        const radiusX = (aw - ow) / 2 * 0.9;
        const radiusY = (ah - oh) / 2 * 0.9;
        const centerX = aw / 2;
        const centerY = ah / 2;
        const angularSpeed = speedMultiplier * 1.0 * d;

        patternState.angle += angularSpeed;
        const cosAngle = Math.cos(patternState.angle);
        const sinAngle = Math.sin(patternState.angle);

        // Parametric form derived from the equation
        positionX = centerX + radiusX * Math.sign(cosAngle) * Math.pow(Math.abs(cosAngle), 2 / n) - ow / 2;
        positionY = centerY + radiusY * Math.sign(sinAngle) * Math.pow(Math.abs(sinAngle), 2 / n) - oh / 2;
        return { x: positionX, y: positionY };
    }

    function patternDeltoid(aw, ah, ow, oh, d) {
        // Parametric equation for a deltoid (3 cusps hypocycloid)
        const R = Math.min(aw - ow, ah - oh) / 4; // Base radius for the rolling circle
        const r = R / 3; // Radius of the rolling circle for deltoid
        const centerX = aw / 2;
        const centerY = ah / 2;
        const angularSpeed = speedMultiplier * 1.0 * d;

        patternState.angle += angularSpeed;
        // Standard parametric equations for hypocycloid (a=R, b=r)
        positionX = centerX + (R - r) * Math.cos(patternState.angle) + r * Math.cos(((R - r) / r) * patternState.angle) - ow / 2;
        positionY = centerY + (R - r) * Math.sin(patternState.angle) - r * Math.sin(((R - r) / r) * patternState.angle) - oh / 2;
        return { x: positionX, y: positionY };
    }

    // Simple Perlin noise function (requires a library or manual implementation)
    // Placeholder: using Math.random for now, replace with real noise later if desired
    function noise(x = 0, y = 0, z = 0) {
        // If you were to include a library like perlin.js:
        // noise.seed(Math.random()); // Seed it once perhaps
        // return noise.perlin3(x, y, z); // Use the library function
        let random = Math.sin(x * 12.9898 + y * 78.233 + z * 45.543) * 43758.5453;
        return (random - Math.floor(random)) * 2 - 1; // Pseudo-random based on inputs -> (-1, 1)
    }

    function patternRandomized(aw, ah, ow, oh, d) {
         const timeFactor = 0.1 * speedMultiplier; // How fast the noise evolves
         patternState.noiseOffsetZ += d * timeFactor; // Evolve noise over time

         // Use noise function (currently pseudo-random placeholder)
         let noiseX = noise(patternState.noiseOffsetX, patternState.noiseOffsetZ);
         let noiseY = noise(patternState.noiseOffsetY, patternState.noiseOffsetZ);

         // Map noise (-1 to 1) to screen coordinates, centered
         let targetX = (aw / 2) + noiseX * (aw / 2 * 0.9); // Map to 90% of width range
         let targetY = (ah / 2) + noiseY * (ah / 2 * 0.9); // Map to 90% of height range

         // Smoothly move towards the target noise position instead of jumping directly
         const moveAmount = calculateMoveAmount(d) * 0.5; // Move slower for smoother effect
         const dx = targetX - (positionX + ow / 2); // Difference from object center to target
         const dy = targetY - (positionY + oh / 2);
         const dist = Math.sqrt(dx*dx + dy*dy);

         if (dist > 1) { // Only move if not already there
             positionX += (dx / dist) * Math.min(moveAmount, dist); // Move towards target, but not more than moveAmount
             positionY += (dy / dist) * Math.min(moveAmount, dist);
         }

         // Clamp position to stay within bounds
         positionX = Math.max(0, Math.min(positionX, aw - ow));
         positionY = Math.max(0, Math.min(positionY, ah - oh));

         return { x: positionX, y: positionY };
     }
    // --- End Movement Patterns ---

    const patternFunctions = {
        // Existing
        random: patternRandom,
        horizontal: patternHorizontal,
        vertical: patternVertical,
        circle: patternCircle,
        figureEight: patternFigureEight,
        // New Path Based (using followPath helper)
        triangle: followPath,
        squarePath: followPath,
        rectangle: followPath,
        parallelogram: followPath,
        rhombus: followPath,
        trapezoid: followPath,
        kite: followPath,
        pentagon: followPath,
        hexagon: followPath,
        heptagon: followPath,
        octagon: followPath,
        nonagon: followPath,
        decagon: followPath,
        hexagram: followPath,
        decagram: followPath,
        // New Direct Calculation
        oval: patternOval,
        superellipse: patternSuperellipse,
        deltoid: patternDeltoid,
        randomized: patternRandomized,
        // Peekaboo handled separately
        peekaboo: () => ({ x: positionX, y: positionY }) // Returns current pos, logic is elsewhere
    };

    // --- Animation Loop ---
    function animate(timestamp) {
        if (!animationId) return; // Stop if cancelled during frame processing

        if (!animationStartTime) animationStartTime = timestamp;
        if (!lastTimestamp) lastTimestamp = timestamp;

        const delta = (timestamp - lastTimestamp) / 1000; // Time since last frame in seconds
        lastTimestamp = timestamp;

        // Handle Peekaboo logic BEFORE calculating movement
        if (currentPattern === 'peekaboo') {
            // If timer not set and object is visible, set timer to hide
            if (peekabooState.isVisible && !peekabooState.timer) {
                const visibleDuration = 1000 + Math.random() * 1500; // Visible for 1-2.5s
                peekabooState.timer = setTimeout(() => {
                    movingObject.style.visibility = 'hidden';
                    peekabooState.isVisible = false;
                    peekabooState.timer = null; // Clear timer, ready for reappear timer
                }, visibleDuration);
            }
            // If timer not set and object is hidden, set timer to reappear
            else if (!peekabooState.isVisible && !peekabooState.timer) {
                const hiddenDuration = 500 + Math.random() * 1000; // Hidden for 0.5-1.5s
                peekabooState.timer = setTimeout(() => {
                    // Move to random location before showing
                    const { width: areaWidth, height: areaHeight } = getElementDimensions(exerciseArea);
                    // Use current object size for calculation
                    const { width: objectWidth, height: objectHeight } = getElementDimensions(movingObject);
                    positionX = Math.random() * (areaWidth - objectWidth);
                    positionY = Math.random() * (areaHeight - objectHeight);
                    movingObject.style.left = `${positionX}px`;
                    movingObject.style.top = `${positionY}px`;
                    movingObject.style.visibility = 'visible';
                    peekabooState.isVisible = true;
                    peekabooState.timer = null; // Clear timer, ready for hide timer
                }, hiddenDuration);
            }
            // If hidden or waiting to hide/show, skip movement calculation for this frame
            if (!peekabooState.isVisible || peekabooState.timer) {
                 animationId = requestAnimationFrame(animate); // Continue loop, but don't move/draw
                 return;
            }
            // If visible and timer just finished (reappeared), proceed to draw at new location
        }

        // --- Normal Movement Calculation ---
        const { width: areaWidth, height: areaHeight } = getElementDimensions(exerciseArea);
        // Get current object size for accurate boundary checks and pattern calculations
        const { width: objectWidth, height: objectHeight } = getElementDimensions(movingObject);

        let nextPos = { x: positionX, y: positionY };
        // Ensure delta is positive and pattern function exists
        if (patternFunctions[currentPattern] && delta > 0) {
            nextPos = patternFunctions[currentPattern](areaWidth, areaHeight, objectWidth, objectHeight, delta);
        }

        // Apply bounce if enabled
        if (bounceEnabled) {
            // Scale bounce intensity relative to object size? (Optional)
            const maxOffset = bounceIntensity * (objectSize / 25); // Example scaling
            const bounceX = (Math.random() - 0.5) * 2 * maxOffset;
            const bounceY = (Math.random() - 0.5) * 2 * maxOffset;
            nextPos.x += bounceX;
            nextPos.y += bounceY;
        }

        // Clamp final position to stay within bounds using current object dimensions
        nextPos.x = Math.max(0, Math.min(nextPos.x, areaWidth - objectWidth));
        nextPos.y = Math.max(0, Math.min(nextPos.y, areaHeight - objectHeight));

        // Update object style
        movingObject.style.left = `${nextPos.x}px`;
        movingObject.style.top = `${nextPos.y}px`;

        // Continue the loop
        animationId = requestAnimationFrame(animate);
    }

    // --- Timer ---
    function updateTimerDisplay() {
        let elapsedSeconds = 0;
        if (animationStartTime) { // If running or paused
            const now = performance.now();
            elapsedSeconds = Math.floor((now - animationStartTime - pausedTime) / 1000);
        } else { // If stopped
             elapsedSeconds = tracker ? Math.floor(tracker.getLastDuration() / 1000) : 0; // Use last recorded duration
        }
         // Ensure non-negative display
         sessionTimeDisplay.textContent = Math.max(0, elapsedSeconds);
    }


    // --- Control Functions (Live Updates Enabled) ---
     function startExercise() {
         if (animationId) return; // Already running or paused
 
         // Read current config values (though listeners should keep state up-to-date)
         currentPattern = patternSelect.value;
         speedMultiplier = parseInt(speedSelect.value, 10);
         bounceEnabled = bounceToggle.checked;
         bounceIntensity = parseInt(bounceIntensitySlider.value, 10);
         applyObjectSettings(); // Ensure current size, opacity, visual appearance are set
 
         // Resume music if applicable
         if (audioPlayer && musicSourceSelect.value !== 'none') {
             audioPlayer.play().catch(e => console.error('Audio play failed:', e));
         }
 
         // Handle resuming from pause
         if (pausedTime > 0) {
              // Correctly calculate time spent paused since last pause action
              const pauseDuration = performance.now() - animationStartTime;
              pausedTime += pauseDuration; // Add this segment's pause duration
              animationStartTime = performance.now(); // Reset segment start time
         } else {
             // Fresh start
             resetObjectPosition(); // Resets position & initializes pattern state for current settings
             pausedTime = 0;
             sessionStartTime = Date.now();
             animationStartTime = performance.now(); // Use high-res timer for animation sync
              if (tracker) tracker.startSession(speedMultiplier, currentPattern); // Pass info to tracker
         }
 
         // Reset peekaboo state if applicable
          clearTimeout(peekabooState.timer);
          peekabooState.timer = null;
          peekabooState.isVisible = true;
          movingObject.style.visibility = 'visible';
 
         lastTimestamp = performance.now(); // Important for delta calculation start/resume
         animationId = requestAnimationFrame(animate);
 
         if (!timerInterval) {
             timerInterval = setInterval(updateTimerDisplay, 1000);
         }
 
         // Update button states only
         startButton.disabled = true;
         pauseButton.disabled = false;
         stopButton.disabled = false;
         // DO NOT disable config panel controls
     }

    function pauseExercise() {
        if (!animationId) return; // Not running

        cancelAnimationFrame(animationId);
        animationId = null;

        // Clear peekaboo timer if paused during it
        clearTimeout(peekabooState.timer);
        peekabooState.timer = null;

        // Pause music if playing
        if (audioPlayer && musicSourceSelect.value !== 'none') {
            audioPlayer.pause();
        }

        // Record the timestamp *when* pause was hit. The duration of the pause
        // will be calculated when resuming in startExercise.
        // animationStartTime now holds the timestamp of the last frame *before* pause was hit.

        clearInterval(timerInterval);
        timerInterval = null; // Stop display updates

        // Update button states
        startButton.disabled = false;
        pauseButton.disabled = true;
        stopButton.disabled = false; // Can still stop from paused state
    }

    function stopExercise() {
        let finalDuration = 0;
        if (animationStartTime) { // Was running or paused
            if (animationId) { // Was running
                 cancelAnimationFrame(animationId);
                 animationId = null;
                 // Calculate duration based on high-res timer if possible
                 finalDuration = performance.now() - animationStartTime - pausedTime;
            } else { // Was paused
                 // Duration calculation is tricky if paused.
                 // Using Date.now() provides a simpler, though potentially less precise, overall session duration.
                 finalDuration = Date.now() - sessionStartTime; // Let tracker handle net if needed
            }
        }

        // Clear peekaboo timer if active
        clearTimeout(peekabooState.timer);
        peekabooState.timer = null;

        // Stop music if playing
        if (audioPlayer && musicSourceSelect.value !== 'none') {
            audioPlayer.pause();
        }

        clearInterval(timerInterval);
        timerInterval = null;
        if(tracker) tracker.stopSession(finalDuration); // Pass raw duration

        // Reset state variables
        animationStartTime = null;
        pausedTime = 0;
        sessionStartTime = null;
        updateTimerDisplay(); // Show final time (likely 0 based on getLastDuration)

        // Reset button states
        startButton.disabled = false;
        pauseButton.disabled = true;
        stopButton.disabled = true;
        // DO NOT re-enable config controls (they were never disabled)

        // Reset object position visually after a short delay
        setTimeout(resetObjectPosition, 100);
    }

    // --- Customization Functions ---

    function applyObjectSize() {
        objectSize = parseInt(objectSizeSlider.value, 10);
        movingObject.style.width = `${objectSize}px`;
        movingObject.style.height = `${objectSize}px`;
        objectSizeValueSpan.textContent = `${objectSize}px`;
    }

    function applyObjectOpacity() { // New
        objectOpacity = parseFloat(objectOpacitySlider.value);
        movingObject.style.opacity = objectOpacity;
        objectOpacityValueSpan.textContent = objectOpacity.toFixed(2);
    }

    // Combined function to apply all relevant object style settings
    function applyObjectSettings() {
        applyObjectSize();
        applyObjectOpacity();

        const shape = objectShapeSelect.value;
        // Ensure inner image element is handled correctly
        const innerImg = movingObject.querySelector('#object-inner-image');
        if (shape !== 'image' && innerImg) {
             innerImg.remove(); // Remove img if not needed
             objectImageElement = null; // Clear reference
        }

        if (shape === 'image') {
            objectColorControl.style.display = 'none'; // Hide color picker
            objectImageControl.style.display = ''; // Show file input
            movingObject.style.backgroundColor = 'transparent'; // Ensure outer div is transparent
            movingObject.style.borderRadius = '50%'; // Apply circle mask
             // Image itself is applied via handleObjectImageUpload
             // If objectImageElement already exists, its src might be updated there
        } else { // Shape is circle or square
            objectColorControl.style.display = ''; // Show color picker
            objectImageControl.style.display = 'none'; // Hide file input
            if (innerImg) { innerImg.remove(); objectImageElement = null; } // Remove img if switching away
            movingObject.style.backgroundImage = 'none'; // Remove background image if any
            movingObject.style.backgroundColor = objectColorPicker.value;
            movingObject.style.borderRadius = (shape === 'circle') ? '50%' : '0';
        }
    }

    function handleObjectImageUpload(event) { // Handles file input for the OBJECT
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Find or create the inner image element
                let innerImg = movingObject.querySelector('#object-inner-image');
                if (!innerImg) {
                    innerImg = document.createElement('img');
                    innerImg.id = 'object-inner-image';
                    movingObject.appendChild(innerImg);
                    objectImageElement = innerImg; // Store reference if needed elsewhere
                }
                innerImg.src = e.target.result;
                // CSS handles object-fit: contain, width/height 100%
                movingObject.style.backgroundColor = 'transparent'; // Ensure outer div is transparent
                movingObject.style.borderRadius = '50%'; // Ensure circle mask is applied
            }
            reader.readAsDataURL(file);
        } else {
             // Remove inner image if upload fails or is cancelled
             const innerImg = movingObject.querySelector('#object-inner-image');
             if (innerImg) { innerImg.remove(); objectImageElement = null; }
             if (file) alert("Please select a valid image file for the object.");
             // Re-apply settings based on dropdown (might revert to circle/square if user didn't intend image)
             // Or simply clear the image display but keep 'image' selected? Let's clear.
             applyObjectSettings();
        }
    }

    // --- Background Customization Functions ---
    function applyBackgroundSettings() {
        const bgType = bgTypeSelect.value;
        let isImageBackground = false; // Flag to track if an image is active

        // Show/Hide Controls based on selection
        bgColorControl.style.display = (bgType === 'color') ? '' : 'none';
        bgPresetControl.style.display = (bgType === 'preset') ? '' : 'none';
        bgCustomControl.style.display = (bgType === 'custom') ? '' : 'none';

        // Apply Background Style
        if (bgType === 'color') {
            exerciseArea.style.backgroundImage = 'none'; // Remove image
            exerciseArea.style.backgroundColor = bgColorPicker.value;
            exerciseArea.classList.remove('bg-looping'); // Ensure looping class is removed
            isImageBackground = false;
        } else if (bgType === 'preset') {
            const presetUrl = bgPresetSelect.value;
            if (presetUrl) {
                exerciseArea.style.backgroundImage = `url('${presetUrl}')`;
                exerciseArea.style.backgroundColor = 'transparent'; // Clear bg color
                // Reverted: Let CSS handle default size/repeat
                isImageBackground = true;
            } else { // Handle case where preset value is empty?
                exerciseArea.style.backgroundImage = 'none';
                exerciseArea.style.backgroundColor = bgColorPicker.value; // Revert to color
                 isImageBackground = false;
            }
        } else if (bgType === 'custom') {
            // Background is applied via handleBackgroundImageUpload
            // Check if an image is already set (from previous custom upload)
            if (exerciseArea.style.backgroundImage && exerciseArea.style.backgroundImage !== 'none') {
                 exerciseArea.style.backgroundColor = 'transparent'; // Keep bg color clear
                 // Reverted: Let CSS handle default size/repeat
                 isImageBackground = true;
            } else {
                 // If no custom bg loaded yet, default to color picker value
                 exerciseArea.style.backgroundImage = 'none';
                 exerciseArea.style.backgroundColor = bgColorPicker.value;
                 isImageBackground = false;
            }
        }

        // Enable/Disable and Apply Loop Toggle
        bgLoopToggle.disabled = !isImageBackground;
        if (!isImageBackground) {
             bgLoopToggle.checked = false; // Uncheck if disabled
             exerciseArea.classList.remove('bg-looping');
        } else {
            // Checkbox state determines if class is added/removed
             if (bgLoopToggle.checked) {
                 exerciseArea.classList.add('bg-looping');
             } else {
                 exerciseArea.classList.remove('bg-looping');
             }
        }
    }

    function handleBackgroundImageUpload(event) { // Handles file input for BACKGROUND
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                exerciseArea.style.backgroundImage = `url(${e.target.result})`;
                exerciseArea.style.backgroundColor = 'transparent'; // Clear color
                // Reverted: Let CSS handle default size/repeat
                bgLoopToggle.disabled = false; // Enable loop toggle
                // Apply looping based on current checkbox state
                 if (bgLoopToggle.checked) {
                     exerciseArea.classList.add('bg-looping');
                 } else {
                     exerciseArea.classList.remove('bg-looping');
                 }
            }
            reader.readAsDataURL(file);
        } else {
            if (file) alert("Please select a valid image file for the background.");
            // Revert to color type if upload fails
            bgTypeSelect.value = 'color';
            applyBackgroundSettings(); // Apply color settings
        }
    }

    // --- UI Panel Toggle Function ---
    function toggleUIPanel() {
        uiPanel.classList.toggle('hidden');
        // Update handle text/icon based on state
        uiPanelHandle.textContent = uiPanel.classList.contains('hidden') ? '⚙️ Settings' : '⬅️ Close';
    }


    // --- Audio Functions ---
    function initAudioPlayer() {
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer = null;
        }
        audioPlayer = new Audio();
        audioPlayer.loop = true;
        audioPlayer.volume = currentVolume;
        updateVolumeDisplay();
    }

    function loadPresetMusic(presetPath) {
        initAudioPlayer();
        audioPlayer.src = presetPath;
        audioPlayer.load();
        audioPlayer.play().catch(e => console.error('Audio play failed:', e));
    }

    function handleCustomMusicUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('audio/')) {
            initAudioPlayer();
            const reader = new FileReader();
            reader.onload = (e) => {
                audioPlayer.src = e.target.result;
                audioPlayer.play().catch(e => console.error('Audio play failed:', e));
            };
            reader.readAsDataURL(file);
        } else if (file) {
            alert("Please select a valid audio file.");
            musicSourceSelect.value = 'none';
            handleMusicSourceChange();
        }
    }

    function handleMusicSourceChange() {
        const source = musicSourceSelect.value;
        
        musicPresetControl.style.display = (source === 'preset') ? '' : 'none';
        musicCustomControl.style.display = (source === 'custom') ? '' : 'none';

        if (audioPlayer) {
            if (source === 'none') {
                audioPlayer.pause();
            } else if (source === 'preset') {
                loadPresetMusic(musicPresetSelect.value);
            }
        }
    }

    function updateVolume(volume) {
        currentVolume = volume;
        if (audioPlayer) {
            audioPlayer.volume = currentVolume;
        }
        updateVolumeDisplay();
    }

    function updateVolumeDisplay() {
        musicVolumeSlider.value = currentVolume;
        musicVolumeValueSpan.textContent = currentVolume.toFixed(2);
    }

    // --- Initial Setup Calls ---
    setTimeout(() => {
        applyObjectSettings(); // Includes size and opacity
        resetObjectPosition(); // Includes initializing pattern state based on current size
        applyBackgroundSettings(); // Apply initial background state & control visibility
        // Set initial state for bounce intensity slider based on checkbox
        bounceIntensitySlider.disabled = !bounceToggle.checked;
        
        // Initialize audio with default volume
        updateVolume(currentVolume);
    }, 100); // Delay slightly for layout calculations


    // --- Event Listeners ---
    startButton.addEventListener('click', startExercise);
    pauseButton.addEventListener('click', pauseExercise);
    stopButton.addEventListener('click', stopExercise);
    uiPanelHandle.addEventListener('click', toggleUIPanel); // Panel Toggle Handle

    // Config Listeners (Apply Live)
    patternSelect.addEventListener('change', (e) => {
        currentPattern = e.target.value;
        // Always reset position immediately when pattern changes for consistent behavior
        resetObjectPosition();
         // If running, the new pattern logic will pick up on the next frame
    });
    speedSelect.addEventListener('change', (e) => {
        speedMultiplier = parseInt(e.target.value, 10);
    });
    bounceToggle.addEventListener('change', (e) => {
        bounceEnabled = e.target.checked;
        // Enable/disable slider immediately
        bounceIntensitySlider.disabled = !bounceEnabled;
    });
    bounceIntensitySlider.addEventListener('input', (e) => {
        bounceIntensity = parseInt(e.target.value, 10);
    });

    // Object Listeners
    objectSizeSlider.addEventListener('input', applyObjectSettings);
    objectOpacitySlider.addEventListener('input', applyObjectSettings); // Opacity listener
    objectShapeSelect.addEventListener('change', applyObjectSettings);
    objectColorPicker.addEventListener('input', applyObjectSettings);
    objectImageInput.addEventListener('change', handleObjectImageUpload); // Specific object image handler

    // Background Listeners
    bgTypeSelect.addEventListener('change', applyBackgroundSettings);
    bgColorPicker.addEventListener('input', () => {
        // Only apply live color changes if the type is 'color'
        if (bgTypeSelect.value === 'color') {
             applyBackgroundSettings();
        }
    });
    bgPresetSelect.addEventListener('change', applyBackgroundSettings);
    bgCustomInput.addEventListener('change', handleBackgroundImageUpload); // Specific background image handler
    bgLoopToggle.addEventListener('change', applyBackgroundSettings);

    // Music Listeners
    musicSourceSelect.addEventListener('change', handleMusicSourceChange);
    musicPresetSelect.addEventListener('change', () => {
        if (musicSourceSelect.value === 'preset') {
            loadPresetMusic(musicPresetSelect.value);
        }
    });
    musicCustomInput.addEventListener('change', handleCustomMusicUpload);
    musicVolumeSlider.addEventListener('input', (e) => {
        updateVolume(parseFloat(e.target.value));
    });


    // Window Resize Listener
    window.addEventListener('resize', () => {
        // Reset position on resize only if stopped to avoid jarring jumps
         if (!animationId) {
             setTimeout(resetObjectPosition, 100); // Recalculate boundaries/waypoints and reset
         }
         // If running, the animation loop will naturally adapt to new dimensions
     });

}); // End DOMContentLoaded