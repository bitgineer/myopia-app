# Myopia App - Eye Tracking Exercise

![Eye Tracking Exercise Demo](background/blackandwhite.png)

A modern web application designed to help with myopia (nearsightedness) through guided eye tracking exercises.

## Features

### Movement Patterns (25+)
- **Basic**: Random Bounce, Horizontal, Vertical, Circle, Oval
- **Shapes**: Triangle, Square, Rectangle, Parallelogram, Rhombus, Trapezoid, Kite
- **Polygons**: Pentagon, Hexagon, Heptagon, Octagon, Nonagon, Decagon
- **Stars**: Hexagram (6-point), Decagram (10-point)
- **Curves**: Figure Eight, Superellipse, Deltoid
- **Special**: Randomized Smooth, Peek-a-boo

### Customization
- **Speed**: Slow (1x), Medium (2x), Fast (4x), Very Fast (8x)
- **Object**: Size (10-100px), Color, Opacity (0.1-1.0), Shape (Circle/Square/Image)
- **Background**: Solid color, Preset images, Custom image upload
- **Audio**: Preset tracks (Elysian Focus, Enhanced Visual Processing), Custom audio upload
- **Bounce**: Optional random jitter with adjustable intensity

### Tracking & PWA
- **Progress**: Session history with duration, pattern, and speed
- **Statistics**: Total sessions, total time, activity chart
- **PWA**: Install as standalone app, offline support, responsive design

## Quick Start

```bash
# Clone the repository
git clone https://github.com/bitgineer/myopia-app.git
cd myopia-app

# Install dependencies (package-lock.json is not committed - generates fresh)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. Open the app in your browser
2. Click **⚙️ Settings** to configure:
   - Movement pattern and speed
   - Object appearance (size, color, opacity, shape)
   - Background (color or image)
   - Audio (optional)
3. Click **Start** to begin exercising
4. Follow the moving object with your eyes
5. Click **Stop** when finished to save your session
6. View your progress at `/progress.html`

## Technical Stack

- **Build Tool**: Vite (fast HMR, optimized builds)
- **Language**: TypeScript (type-safe, better DX)
- **Styling**: Tailwind CSS (utility-first CSS framework)
- **PWA**: vite-plugin-pwa (offline support, installable)
- **Storage**: localStorage for session history (data persists across sessions)

## Project Structure

```
myopia-app/
├── src/
│   ├── app.ts          # Main application logic
│   ├── main.ts         # Entry point (exercise page)
│   ├── progress.ts     # Progress page logic
│   ├── style.css       # Tailwind + custom styles
│   ├── types/
│   │   └── index.ts    # TypeScript type definitions
│   └── utils/
│       ├── audio.ts    # Audio manager class
│       ├── patterns.ts # 25+ movement pattern algorithms
│       └── storage.ts  # localStorage management with session tracking
├── public/             # Static assets
│   ├── background/     # Background images
│   └── music/          # Audio files
├── index.html          # Exercise page
├── progress.html       # Progress page
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript config
├── tailwind.config.js  # Tailwind config
├── vite.config.ts      # Vite + PWA config
├── postcss.config.js   # PostCSS config (Tailwind + Autoprefixer)
└── .gitignore          # Git ignore rules (excludes node_modules, dist)
```

### Configuration Details

- **vite.config.ts**: Vite dev server (port 3000), Rollup multi-page input, PWA plugin with service worker
- **tailwind.config.js**: Content paths, custom primary colors, fade/slide animations
- **tsconfig.json**: ES2020 target, strict mode, DOM types, moduleResolution bundler
- **postcss.config.js**: Processes Tailwind CSS and Autoprefixer

## Development

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

The `dist/` folder contains the production build. To deploy:

```bash
# Build for production
npm run build

# The dist/ folder now contains:
# - index.html (exercise page)
# - progress.html (progress page)
# - assets/ (JS, CSS, source maps)
# - sw.js (service worker for PWA)
# - manifest.webmanifest (PWA manifest)
# - public/ contents (backgrounds, music, icons)
```

Deploy to any static hosting:

- **GitHub Pages**: 
  ```bash
  npm run build
  git subtree push --prefix dist origin gh-pages
  ```
- **Netlify**: Drag and drop `dist` folder, or connect repo with build command `npm run build`
- **Vercel**: Connect repository, build command: `npm run build`, output: `dist`
- **Firebase Hosting**: `firebase deploy --only hosting` after configuring `firebase.json`

## PWA Features

- **Installable**: Add to home screen on mobile/desktop
- **Offline Support**: Works without internet connection
- **Fast Loading**: Cached assets for instant startup

## Browser Compatibility

- **Chrome/Edge**: Full support (recommended for PWA features)
- **Firefox**: Full support
- **Safari**: Full support (iOS 11+)
- **Mobile**: iOS Safari, Chrome for Android

## Data Persistence

Exercise history is stored in browser's localStorage:
- **Storage Key**: `myopiaAppProgress_v2`
- **Data Includes**: Session start time, duration, pattern, speed
- **Privacy**: All data stays on your device
- **Clear**: Use the "Clear History" button in progress page

## License

MIT License - Free for personal and educational use
