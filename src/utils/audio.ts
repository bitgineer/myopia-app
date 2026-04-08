// Audio management

export class AudioManager {
  private player: HTMLAudioElement | null = null;
  private volume: number = 0.5;

  constructor() {
    this.initPlayer();
  }

  private initPlayer(): void {
    if (this.player) {
      this.player.pause();
    }
    this.player = new Audio();
    this.player.loop = true;
    this.player.volume = this.volume;
  }

  loadPreset(presetPath: string): void {
    this.initPlayer();
    this.player!.src = presetPath;
    this.player!.load();
    this.player!.play().catch(e => console.error('Audio play failed:', e));
  }

  loadCustom(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('audio/')) {
        reject(new Error('Please select a valid audio file'));
        return;
      }

      this.initPlayer();
      const reader = new FileReader();
      reader.onload = (e) => {
        this.player!.src = e.target?.result as string;
        this.player!.play().catch(e => {
          console.error('Audio play failed:', e);
          reject(e);
        });
        resolve();
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  play(): void {
    if (this.player) {
      this.player.play().catch(e => console.error('Audio play failed:', e));
    }
  }

  pause(): void {
    if (this.player) {
      this.player.pause();
    }
  }

  stop(): void {
    if (this.player) {
      this.player.pause();
      this.player.currentTime = 0;
    }
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.player) {
      this.player.volume = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }
}
