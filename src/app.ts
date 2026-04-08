import type { PatternState, Point, PeekabooState } from './types';
import {
  initializePatternState,
  patternRandom,
  patternHorizontal,
  patternVertical,
  patternCircle,
  patternOval,
  patternFigureEight,
  patternSuperellipse,
  patternDeltoid,
  patternRandomized,
  followPath
} from './utils/patterns';
import { AudioManager } from './utils/audio';
import { addSession } from './utils/storage';

export class MyopiaApp {
  // DOM Elements (initialized in constructor)
  private exerciseArea!: HTMLElement;
  private movingObject!: HTMLElement;
  private instructions!: HTMLElement;
  private uiPanel!: HTMLElement;
  private uiPanelHandle!: HTMLButtonElement;
  private uiPanelOverlay!: HTMLElement;
  private uiPanelClose!: HTMLButtonElement;
  
  // Controls (initialized in constructor)
  private patternSelect!: HTMLSelectElement;
  private speedSelect!: HTMLSelectElement;
  private bounceToggle!: HTMLInputElement;
  private bounceIntensitySlider!: HTMLInputElement;
  private objectShapeSelect!: HTMLSelectElement;
  private objectColorPicker!: HTMLInputElement;
  private objectSizeSlider!: HTMLInputElement;
  private objectOpacitySlider!: HTMLInputElement;
  private bgTypeSelect!: HTMLSelectElement;
  private bgColorPicker!: HTMLInputElement;
  private bgPresetSelect!: HTMLSelectElement;
  private bgLoopToggle!: HTMLInputElement;
  private musicSourceSelect!: HTMLSelectElement;
  private musicPresetSelect!: HTMLSelectElement;
  private musicVolumeSlider!: HTMLInputElement;
  private startButton!: HTMLButtonElement;
  private pauseButton!: HTMLButtonElement;
  private stopButton!: HTMLButtonElement;
  private sessionTimeDisplay!: HTMLElement;

  // State
  private audioManager: AudioManager;
  private animationId: number | null = null;
  private animationStartTime: number | null = null;
  private sessionStartTime: number | null = null;
  private pausedTime: number = 0;
  private timerInterval: number | null = null;
  private lastTimestamp: number = 0;

  // Movement state
  private positionX: number = 0;
  private positionY: number = 0;
  private patternState: PatternState | null = null;
  private peekabooState: PeekabooState = { isVisible: true, timer: null };

  // Configuration
  private currentPattern: string = 'random';
  private speedMultiplier: number = 2;
  private bounceEnabled: boolean = false;
  private bounceIntensity: number = 3;
  private objectSize: number = 25;
  private objectOpacity: number = 1.0;

  constructor() {
    this.audioManager = new AudioManager();
    this.initializeElements();
    this.setupEventListeners();
    this.initializeUI();
  }

  private initializeElements(): void {
    this.exerciseArea = document.getElementById('exercise-area')!;
    this.movingObject = document.getElementById('moving-object')!;
    this.instructions = document.getElementById('instructions')!;
    this.uiPanel = document.getElementById('ui-panel')!;
    this.uiPanelHandle = document.getElementById('ui-panel-handle') as HTMLButtonElement;
    this.uiPanelOverlay = document.getElementById('ui-panel-overlay')!;
    this.uiPanelClose = document.getElementById('ui-panel-close') as HTMLButtonElement;

    this.patternSelect = document.getElementById('pattern') as HTMLSelectElement;
    this.speedSelect = document.getElementById('speed') as HTMLSelectElement;
    this.bounceToggle = document.getElementById('bounce-toggle') as HTMLInputElement;
    this.bounceIntensitySlider = document.getElementById('bounce-intensity') as HTMLInputElement;
    this.objectShapeSelect = document.getElementById('object-shape') as HTMLSelectElement;
    this.objectColorPicker = document.getElementById('object-color') as HTMLInputElement;
    this.objectSizeSlider = document.getElementById('object-size') as HTMLInputElement;
    this.objectOpacitySlider = document.getElementById('object-opacity') as HTMLInputElement;
    this.bgTypeSelect = document.getElementById('bg-type') as HTMLSelectElement;
    this.bgColorPicker = document.getElementById('bg-color') as HTMLInputElement;
    this.bgPresetSelect = document.getElementById('bg-preset') as HTMLSelectElement;
    this.bgLoopToggle = document.getElementById('bg-loop-toggle') as HTMLInputElement;
    this.musicSourceSelect = document.getElementById('music-source') as HTMLSelectElement;
    this.musicPresetSelect = document.getElementById('music-preset') as HTMLSelectElement;
    this.musicVolumeSlider = document.getElementById('music-volume') as HTMLInputElement;
    this.startButton = document.getElementById('start-button') as HTMLButtonElement;
    this.pauseButton = document.getElementById('pause-button') as HTMLButtonElement;
    this.stopButton = document.getElementById('stop-button') as HTMLButtonElement;
    this.sessionTimeDisplay = document.getElementById('session-time')!;
  }

  private setupEventListeners(): void {
    this.startButton.addEventListener('click', () => this.startExercise());
    this.pauseButton.addEventListener('click', () => this.pauseExercise());
    this.stopButton.addEventListener('click', () => this.stopExercise());
    this.uiPanelHandle.addEventListener('click', () => this.toggleUIPanel());
    this.uiPanelClose?.addEventListener('click', () => this.toggleUIPanel());
    this.uiPanelOverlay?.addEventListener('click', () => this.toggleUIPanel());

    // Pattern controls
    this.patternSelect.addEventListener('change', (e) => {
      this.currentPattern = (e.target as HTMLSelectElement).value;
      this.resetObjectPosition();
    });

    this.speedSelect.addEventListener('change', (e) => {
      this.speedMultiplier = parseInt((e.target as HTMLSelectElement).value, 10);
    });

    this.bounceToggle.addEventListener('change', (e) => {
      this.bounceEnabled = (e.target as HTMLInputElement).checked;
      this.bounceIntensitySlider.disabled = !this.bounceEnabled;
    });

    this.bounceIntensitySlider.addEventListener('input', (e) => {
      this.bounceIntensity = parseInt((e.target as HTMLInputElement).value, 10);
    });

    // Object controls
    this.objectSizeSlider.addEventListener('input', () => this.applyObjectSettings());
    this.objectOpacitySlider.addEventListener('input', () => this.applyObjectSettings());
    this.objectShapeSelect.addEventListener('change', () => this.applyObjectSettings());
    this.objectColorPicker.addEventListener('input', () => this.applyObjectSettings());

    document.getElementById('object-image')?.addEventListener('change', (e) => {
      this.handleObjectImageUpload(e as Event);
    });

    // Background controls
    this.bgTypeSelect.addEventListener('change', () => this.applyBackgroundSettings());
    this.bgColorPicker.addEventListener('input', () => {
      if (this.bgTypeSelect.value === 'color') {
        this.applyBackgroundSettings();
      }
    });
    this.bgPresetSelect.addEventListener('change', () => this.applyBackgroundSettings());
    this.bgLoopToggle.addEventListener('change', () => this.applyBackgroundSettings());

    document.getElementById('bg-custom-input')?.addEventListener('change', (e) => {
      this.handleBackgroundImageUpload(e as Event);
    });

    // Music controls
    this.musicSourceSelect.addEventListener('change', () => this.handleMusicSourceChange());
    this.musicPresetSelect.addEventListener('change', () => {
      if (this.musicSourceSelect.value === 'preset') {
        this.audioManager.loadPreset(this.musicPresetSelect.value);
      }
    });
    document.getElementById('music-custom-input')?.addEventListener('change', (e) => {
      this.handleCustomMusicUpload(e as Event);
    });
    this.musicVolumeSlider.addEventListener('input', (e) => {
      const volume = parseFloat((e.target as HTMLInputElement).value);
      this.audioManager.setVolume(volume);
      document.getElementById('music-volume-value')!.textContent = volume.toFixed(2);
    });

    // Window resize
    window.addEventListener('resize', () => {
      if (!this.animationId) {
        setTimeout(() => this.resetObjectPosition(), 100);
      }
    });
  }

  private initializeUI(): void {
    setTimeout(() => {
      this.applyObjectSettings();
      this.resetObjectPosition();
      this.applyBackgroundSettings();
      this.bounceIntensitySlider.disabled = !this.bounceEnabled;
      this.audioManager.setVolume(0.5);
      document.getElementById('music-volume-value')!.textContent = '0.50';
    }, 100);
  }

  private getElementDimensions(element: HTMLElement): { width: number; height: number } {
    return { width: element.offsetWidth, height: element.offsetHeight };
  }

  private resetObjectPosition(): void {
    clearTimeout(this.peekabooState.timer!);
    this.peekabooState.isVisible = true;
    this.peekabooState.timer = null;
    this.movingObject.style.visibility = 'visible';

    const { width: areaWidth, height: areaHeight } = this.getElementDimensions(this.exerciseArea);
    const { width: objectWidth, height: objectHeight } = this.getElementDimensions(this.movingObject);

    const { state, initialPosition } = initializePatternState(
      this.currentPattern,
      areaWidth,
      areaHeight,
      objectWidth,
      objectHeight
    );

    this.patternState = state;
    this.positionX = initialPosition.x;
    this.positionY = initialPosition.y;
    this.movingObject.style.left = `${this.positionX}px`;
    this.movingObject.style.top = `${this.positionY}px`;
    this.lastTimestamp = 0;
  }

  private applyObjectSettings(): void {
    this.objectSize = parseInt(this.objectSizeSlider.value, 10);
    this.objectOpacity = parseFloat(this.objectOpacitySlider.value);

    this.movingObject.style.width = `${this.objectSize}px`;
    this.movingObject.style.height = `${this.objectSize}px`;
    this.movingObject.style.opacity = `${this.objectOpacity}`;

    document.getElementById('object-size-value')!.textContent = `${this.objectSize}px`;
    document.getElementById('object-opacity-value')!.textContent = this.objectOpacity.toFixed(2);

    const shape = this.objectShapeSelect.value;
    const innerImg = this.movingObject.querySelector('#object-inner-image');

    if (shape !== 'image' && innerImg) {
      innerImg.remove();
    }

    if (shape === 'image') {
      document.getElementById('object-color-control')!.style.display = 'none';
      document.getElementById('object-image-control')!.style.display = '';
      this.movingObject.style.backgroundColor = 'transparent';
      this.movingObject.style.borderRadius = '50%';
    } else {
      document.getElementById('object-color-control')!.style.display = '';
      document.getElementById('object-image-control')!.style.display = 'none';
      if (innerImg) innerImg.remove();
      this.movingObject.style.backgroundImage = 'none';
      this.movingObject.style.backgroundColor = this.objectColorPicker.value;
      this.movingObject.style.borderRadius = shape === 'circle' ? '50%' : '0';
    }
  }

  private handleObjectImageUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        let innerImg = this.movingObject.querySelector('#object-inner-image') as HTMLImageElement;
        if (!innerImg) {
          innerImg = document.createElement('img');
          innerImg.id = 'object-inner-image';
          this.movingObject.appendChild(innerImg);
        }
        innerImg.src = e.target?.result as string;
        this.movingObject.style.backgroundColor = 'transparent';
        this.movingObject.style.borderRadius = '50%';
      };
      reader.readAsDataURL(file);
    }
  }

  private applyBackgroundSettings(): void {
    const bgType = this.bgTypeSelect.value;
    let isImageBackground = false;

    document.getElementById('bg-color-control')!.style.display = bgType === 'color' ? '' : 'none';
    document.getElementById('bg-preset-control')!.style.display = bgType === 'preset' ? '' : 'none';
    document.getElementById('bg-custom-control')!.style.display = bgType === 'custom' ? '' : 'none';

    if (bgType === 'color') {
      this.exerciseArea.style.backgroundImage = 'none';
      this.exerciseArea.style.backgroundColor = this.bgColorPicker.value;
      this.exerciseArea.classList.remove('bg-looping');
      isImageBackground = false;
    } else if (bgType === 'preset') {
      const presetUrl = this.bgPresetSelect.value;
      if (presetUrl) {
        this.exerciseArea.style.backgroundImage = `url('${presetUrl}')`;
        this.exerciseArea.style.backgroundColor = 'transparent';
        isImageBackground = true;
      }
    } else if (bgType === 'custom') {
      const currentBg = this.exerciseArea.style.backgroundImage;
      if (currentBg && currentBg !== 'none') {
        this.exerciseArea.style.backgroundColor = 'transparent';
        isImageBackground = true;
      } else {
        this.exerciseArea.style.backgroundImage = 'none';
        this.exerciseArea.style.backgroundColor = this.bgColorPicker.value;
        isImageBackground = false;
      }
    }

    this.bgLoopToggle.disabled = !isImageBackground;
    if (!isImageBackground) {
      this.bgLoopToggle.checked = false;
      this.exerciseArea.classList.remove('bg-looping');
    } else {
      if (this.bgLoopToggle.checked) {
        this.exerciseArea.classList.add('bg-looping');
      } else {
        this.exerciseArea.classList.remove('bg-looping');
      }
    }
  }

  private handleBackgroundImageUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.exerciseArea.style.backgroundImage = `url(${e.target?.result})`;
        this.exerciseArea.style.backgroundColor = 'transparent';
        this.bgLoopToggle.disabled = false;
        if (this.bgLoopToggle.checked) {
          this.exerciseArea.classList.add('bg-looping');
        } else {
          this.exerciseArea.classList.remove('bg-looping');
        }
      };
      reader.readAsDataURL(file);
    }
  }

  private handleMusicSourceChange(): void {
    const source = this.musicSourceSelect.value;
    
    document.getElementById('music-preset-control')!.style.display = source === 'preset' ? '' : 'none';
    document.getElementById('music-custom-control')!.style.display = source === 'custom' ? '' : 'none';

    if (source === 'none') {
      this.audioManager.pause();
    } else if (source === 'preset') {
      this.audioManager.loadPreset(this.musicPresetSelect.value);
    }
  }

  private async handleCustomMusicUpload(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      try {
        await this.audioManager.loadCustom(file);
      } catch (e) {
        alert('Please select a valid audio file');
        this.musicSourceSelect.value = 'none';
        this.handleMusicSourceChange();
      }
    }
  }

  private toggleUIPanel(): void {
    const isHidden = this.uiPanel.classList.contains('hidden');
    
    if (isHidden) {
      // Opening panel
      this.uiPanel.classList.remove('hidden');
      this.uiPanelOverlay?.classList.add('visible');
      this.uiPanelHandle.innerHTML = '<span>⬅️</span><span>Close</span>';
      this.uiPanelHandle.setAttribute('aria-label', 'Close settings');
      // Prevent body scroll when panel is open on mobile
      document.body.style.overflow = 'hidden';
    } else {
      // Closing panel
      this.uiPanel.classList.add('hidden');
      this.uiPanelOverlay?.classList.remove('visible');
      this.uiPanelHandle.innerHTML = '<span>⚙️</span><span>Settings</span>';
      this.uiPanelHandle.setAttribute('aria-label', 'Open settings');
      // Restore body scroll
      document.body.style.overflow = '';
    }
  }

  private calculateMoveAmount(delta: number): number {
    return this.speedMultiplier * 100 * delta;
  }

  private animate(timestamp: number): void {
    if (!this.animationId) return;

    if (!this.animationStartTime) this.animationStartTime = timestamp;
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;

    const delta = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    // Handle peekaboo
    if (this.currentPattern === 'peekaboo') {
      if (this.peekabooState.isVisible && !this.peekabooState.timer) {
        const visibleDuration = 1000 + Math.random() * 1500;
        this.peekabooState.timer = window.setTimeout(() => {
          this.movingObject.style.visibility = 'hidden';
          this.peekabooState.isVisible = false;
          this.peekabooState.timer = null;
        }, visibleDuration);
      } else if (!this.peekabooState.isVisible && !this.peekabooState.timer) {
        const hiddenDuration = 500 + Math.random() * 1000;
        this.peekabooState.timer = window.setTimeout(() => {
          const { width: areaWidth } = this.getElementDimensions(this.exerciseArea);
          const { width: objectWidth, height: objectHeight } = this.getElementDimensions(this.movingObject);
          this.positionX = Math.random() * (areaWidth - objectWidth);
          this.positionY = Math.random() * (this.exerciseArea.offsetHeight - objectHeight);
          this.movingObject.style.left = `${this.positionX}px`;
          this.movingObject.style.top = `${this.positionY}px`;
          this.movingObject.style.visibility = 'visible';
          this.peekabooState.isVisible = true;
          this.peekabooState.timer = null;
        }, hiddenDuration);
      }

      if (!this.peekabooState.isVisible || this.peekabooState.timer) {
        this.animationId = requestAnimationFrame((t) => this.animate(t));
        return;
      }
    }

    // Normal movement
    const { width: areaWidth, height: areaHeight } = this.getElementDimensions(this.exerciseArea);
    const { width: objectWidth, height: objectHeight } = this.getElementDimensions(this.movingObject);

    let nextPos: Point = { x: this.positionX, y: this.positionY };
    const moveAmount = this.calculateMoveAmount(delta);

    if (delta > 0 && this.patternState) {
      switch (this.currentPattern) {
        case 'random':
          nextPos = patternRandom(this.positionX, this.positionY, this.patternState, areaWidth, areaHeight, objectWidth, objectHeight, moveAmount);
          break;
        case 'horizontal':
          nextPos = patternHorizontal(this.positionX, this.patternState, areaWidth, areaHeight, objectWidth, objectHeight, moveAmount);
          break;
        case 'vertical':
          nextPos = patternVertical(this.positionY, this.patternState, areaWidth, areaHeight, objectWidth, objectHeight, moveAmount);
          break;
        case 'circle':
          nextPos = patternCircle(areaWidth, areaHeight, objectWidth, objectHeight, this.patternState, this.speedMultiplier, delta);
          break;
        case 'oval':
          nextPos = patternOval(areaWidth, areaHeight, objectWidth, objectHeight, this.patternState, this.speedMultiplier, delta);
          break;
        case 'figureEight':
          nextPos = patternFigureEight(areaWidth, areaHeight, objectWidth, objectHeight, this.patternState, this.speedMultiplier, delta);
          break;
        case 'superellipse':
          nextPos = patternSuperellipse(areaWidth, areaHeight, objectWidth, objectHeight, this.patternState, this.speedMultiplier, delta);
          break;
        case 'deltoid':
          nextPos = patternDeltoid(areaWidth, areaHeight, objectWidth, objectHeight, this.patternState, this.speedMultiplier, delta);
          break;
        case 'randomized':
          nextPos = patternRandomized(this.positionX, this.positionY, this.patternState, areaWidth, areaHeight, objectWidth, objectHeight, this.speedMultiplier, delta);
          break;
        default:
          // Path-based patterns
          if (['triangle', 'squarePath', 'rectangle', 'parallelogram', 'rhombus', 'trapezoid', 'kite', 'pentagon', 'hexagon', 'heptagon', 'octagon', 'nonagon', 'decagon', 'hexagram', 'decagram'].includes(this.currentPattern)) {
            nextPos = followPath(this.positionX, this.positionY, this.patternState, moveAmount);
          }
          break;
      }
    }

    // Apply bounce
    if (this.bounceEnabled) {
      const maxOffset = this.bounceIntensity * (this.objectSize / 25);
      nextPos.x += (Math.random() - 0.5) * 2 * maxOffset;
      nextPos.y += (Math.random() - 0.5) * 2 * maxOffset;
    }

    // Clamp to bounds
    nextPos.x = Math.max(0, Math.min(nextPos.x, areaWidth - objectWidth));
    nextPos.y = Math.max(0, Math.min(nextPos.y, areaHeight - objectHeight));

    this.positionX = nextPos.x;
    this.positionY = nextPos.y;
    this.movingObject.style.left = `${this.positionX}px`;
    this.movingObject.style.top = `${this.positionY}px`;

    this.animationId = requestAnimationFrame((t) => this.animate(t));
  }

  private updateTimerDisplay(): void {
    let elapsedSeconds = 0;
    if (this.animationStartTime) {
      const now = performance.now();
      elapsedSeconds = Math.floor((now - this.animationStartTime - this.pausedTime) / 1000);
    }
    this.sessionTimeDisplay.textContent = Math.max(0, elapsedSeconds).toString();
  }

  public startExercise(): void {
    if (this.animationId) return;

    this.currentPattern = this.patternSelect.value;
    this.speedMultiplier = parseInt(this.speedSelect.value, 10);
    this.bounceEnabled = this.bounceToggle.checked;
    this.bounceIntensity = parseInt(this.bounceIntensitySlider.value, 10);
    this.applyObjectSettings();

    if (this.musicSourceSelect.value !== 'none') {
      this.audioManager.play();
    }

    if (this.pausedTime > 0) {
      const pauseDuration = performance.now() - this.animationStartTime!;
      this.pausedTime += pauseDuration;
      this.animationStartTime = performance.now();
    } else {
      this.resetObjectPosition();
      this.pausedTime = 0;
      this.sessionStartTime = Date.now();
      this.animationStartTime = performance.now();
    }

    clearTimeout(this.peekabooState.timer!);
    this.peekabooState.timer = null;
    this.peekabooState.isVisible = true;
    this.movingObject.style.visibility = 'visible';

    this.lastTimestamp = performance.now();
    this.animationId = requestAnimationFrame((t) => this.animate(t));

    if (!this.timerInterval) {
      this.timerInterval = window.setInterval(() => this.updateTimerDisplay(), 1000);
    }

    this.startButton.disabled = true;
    this.pauseButton.disabled = false;
    this.stopButton.disabled = false;
    this.instructions.style.display = 'none';
  }

  public pauseExercise(): void {
    if (!this.animationId) return;

    cancelAnimationFrame(this.animationId);
    this.animationId = null;

    clearTimeout(this.peekabooState.timer!);
    this.peekabooState.timer = null;

    this.audioManager.pause();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.startButton.disabled = false;
    this.pauseButton.disabled = true;
    this.stopButton.disabled = false;
  }

  public stopExercise(): void {
    let finalDuration = 0;

    if (this.animationStartTime) {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
        finalDuration = performance.now() - this.animationStartTime - this.pausedTime;
      } else {
        finalDuration = Date.now() - this.sessionStartTime!;
      }
    }

    clearTimeout(this.peekabooState.timer!);
    this.peekabooState.timer = null;
    this.audioManager.stop();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Save session
    if (this.sessionStartTime && finalDuration > 100) {
      addSession({
        startTime: this.sessionStartTime,
        speed: this.speedMultiplier,
        pattern: this.currentPattern,
        durationMs: Math.round(finalDuration)
      });
    }

    this.animationStartTime = null;
    this.pausedTime = 0;
    this.sessionStartTime = null;
    this.updateTimerDisplay();

    this.startButton.disabled = false;
    this.pauseButton.disabled = true;
    this.stopButton.disabled = true;
    this.instructions.style.display = '';

    setTimeout(() => this.resetObjectPosition(), 100);
  }
}
