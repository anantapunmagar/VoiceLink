# VoiceLink

A Discord-inspired messaging platform with real-time voice, video, and text communication.

## Features

- **Authentication**: User registration and login with local storage
- **Servers & Channels**: Create servers with text and voice channels
- **Text Chat**: Real-time messaging across browser tabs using BroadcastChannel API
- **Voice/Video Calls**: WebRTC peer-to-peer connections with video support
- **Profile Customization**: Avatars, banners, status, and bio
- **Settings**: Comprehensive user settings with notification preferences

## Tech Stack

- React 19
- TypeScript
- Tailwind CSS v4
- Vite
- WebRTC for voice/video
- BroadcastChannel API for cross-tab communication
- LocalStorage for persistence

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### Build

```bash
npm run build
```

The built files will be in `dist/`.

### Preview

```bash
npm run preview
```

## Deployment to Vercel

### Option 1: Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option 2: Git Integration

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project on [vercel.com](https://vercel.com)
3. Vercel will auto-detect Vite and deploy

### Option 3: Deploy from CLI

```bash
npm install -g vercel
vercel --prod
```

## How It Works

### Cross-Tab Communication
VoiceLink uses the BroadcastChannel API to enable real-time messaging between browser tabs on the same origin. When you send a message in one tab, it instantly appears in all other open tabs.

### Voice/Video Calls
Voice and video use WebRTC with BroadcastChannel for signaling. When you join a voice channel:
1. Your browser captures audio/video via `getUserMedia`
2. A BroadcastChannel message announces your presence
3. Other tabs in the same channel create WebRTC peer connections
4. Media streams flow directly between peers (P2P)

**Note**: For this to work across different networks, you'd need a TURN server. The current implementation uses Google's public STUN servers for basic NAT traversal.

### Data Storage
All data is stored in the browser's localStorage:
- User accounts
- Servers and channels
- Messages
- Voice states

This makes VoiceLink a fully client-side application that works offline after initial load.

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

Requires:
- `getUserMedia` support
- WebRTC support
- BroadcastChannel support

## Project Structure

```
src/
├── lib/
│   ├── types.ts          # TypeScript types
│   ├── storage.ts        # LocalStorage utilities
│   ├── auth.ts           # Authentication logic
│   ├── chat.ts           # Chat messaging with BroadcastChannel
│   └── voice.ts          # WebRTC voice/video
├── components/
│   ├── ui/               # Reusable UI primitives
│   ├── AuthScreen.tsx    # Login/signup
│   ├── MainApp.tsx       # Main layout
│   ├── ServerList.tsx    # Server sidebar
│   ├── ChannelList.tsx   # Channel list
│   ├── ChatPanel.tsx     # Text chat interface
│   ├── VoicePanel.tsx    # Voice/video room
│   ├── UserPanel.tsx     # User controls
│   ├── ProfileModal.tsx  # Profile editor
│   └── SettingsModal.tsx # Settings panel
└── App.tsx               # Root component
```

## Testing Voice/Video

To test voice/video calls:

1. Open VoiceLink in two browser tabs
2. Log in with different accounts (or the same account)
3. Join the same voice channel in both tabs
4. You should see/hear the other tab

## Customization

### Colors
Edit the CSS custom properties in `src/index.css`:
```css
--color-accent: #d4a574;  /* Primary accent color */
--color-bg-0: #090a0c;    /* Darkest background */
```

### Fonts
Update the `--font-sans` variable in `src/index.css`.

## License

MIT

## Notes

- This is a demo application using client-side storage only
- Not suitable for production without a backend
- Password hashing is simplified for demo purposes
- Voice/video works best on the same network or with proper STUN/TURN servers
