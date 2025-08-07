# PeerJS Video Call Proof of Concept

A simple proof-of-concept application for peer-to-peer video calls using [PeerJS](https://peerjs.com/) and [Next.js](https://nextjs.org).

## Features

- Real-time peer-to-peer video calls
- No server required for the actual video/audio transmission
- Simple user interface with controls for:
  - Starting/ending calls
  - Muting/unmuting audio
  - Enabling/disabling video
- Responsive design that works on both desktop and mobile devices

## How It Works

This application uses PeerJS, a wrapper around WebRTC, to establish peer-to-peer connections between browsers. The key components are:

1. **Peer Connection**: Each user gets a unique ID when they connect
2. **Media Streaming**: Access to the user's camera and microphone using the browser's MediaDevices API
3. **Signaling**: PeerJS handles the signaling process to establish the connection between peers

## Getting Started

This project uses [Bun](https://bun.sh/) as the preferred package manager. Using other package managers is not recommended to avoid potential conflicts.

First, install the dependencies:

```bash
bun install
# Alternative package managers (not recommended)
# npm install
# yarn install
# pnpm install
```

Then, run the development server:

```bash
bun dev
# Alternative package managers (not recommended)
# npm run dev
# yarn dev
# pnpm dev
```

Open [http://localhost:3333](http://localhost:3333) with your browser to see the application.

## How to Use

1. Open the application in two different browser windows or on two different devices
2. In the first window, note your ID (it's displayed in the "Your ID" field)
3. In the second window, paste that ID into the "Remote ID" field
4. Click "Start Call" in the second window
5. Accept the browser's request to access your camera and microphone
6. You should now see both video feeds and be able to communicate

## Technical Details

- Built with Next.js 15.4.5 and React 19.1.0
- Uses PeerJS for WebRTC peer-to-peer connections
- Styled with Tailwind CSS
- Fully typed with TypeScript

## Limitations

- This is a proof-of-concept and not intended for production use
- No authentication or security measures are implemented
- Relies on STUN servers for NAT traversal, which may not work in all network environments
- No persistent storage of call history or user preferences

## Error Handling and Fallbacks

This application includes several error handling mechanisms to improve reliability:

- **Media Access Fallbacks**: If video+audio access fails, the app will attempt to connect with audio-only
- **Connection Timeout Detection**: Detects and handles cases where connections fail to establish
- **Graceful Error Recovery**: Provides user-friendly error messages and attempts to clean up resources properly
- **Multiple STUN Servers**: Uses multiple STUN servers to improve connection reliability in different network environments
- **Connection Status Indicators**: Visual indicators show the current connection status (connected, connecting, error, disconnected)
- **Manual Reconnection**: A "Retry Connection" button allows users to attempt reconnection with a new ID if the connection fails
- **Enhanced Console Logging**: Detailed, styled console logs help with troubleshooting connection issues
- **Stable ID Generation**: Uses a stable approach to ID generation to prevent issues with changing IDs

## Troubleshooting

If you encounter issues with the application, here are some common problems and solutions:

### User ID Not Appearing
- **Check Connection Status**: Look for the colored indicator next to "Your ID". Green means connected, yellow means connecting, red means error.
- **Check Console**: Press F12 to open browser developer tools and look for your ID in the console (it's highlighted in green).
- **Try Refreshing**: If no ID appears after waiting, try refreshing the page.
- **Use Retry Button**: If you see a connection error, use the "Retry Connection" button to get a new ID.

### Connection Failures
- **Check Network**: Ensure you have a stable internet connection.
- **Browser Extensions**: Some browser extensions (like Dark Reader) can interfere with WebRTC connections. Try disabling them.
- **Firewall Issues**: WebRTC may be blocked by firewalls in some networks. Try on a different network if possible.
- **STUN Server Access**: The application needs access to STUN servers. Corporate networks sometimes block these.
- **Browser Support**: Ensure you're using a modern browser with WebRTC support (Chrome, Firefox, Edge, Safari).

### Call Not Connecting
- **Verify IDs**: Double-check that you've entered the correct remote ID.
- **Both Parties Connected**: Both users need to have a green connection status before starting a call.
- **Camera/Microphone Access**: Ensure you've granted the browser permission to access your camera and microphone.
- **Try Audio Only**: If video doesn't work, the application will attempt to fall back to audio-only mode.
- **Theme Issues**: If you have trouble seeing text or buttons, try switching between light and dark themes using the theme toggle button in the top-right corner.

## Docker Deployment

This project can be deployed using Docker and Docker Compose for easy setup and consistent environments.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Running with Docker Compose

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd peerjs-poc
   ```

2. Build and start the container:
   ```bash
   docker-compose up -d
   ```

3. Access the application at [http://localhost:3000](http://localhost:3000)

4. To stop the container:
   ```bash
   docker-compose down
   ```

### Docker Configuration

The Docker setup includes:
- Multi-stage build process for optimized image size
- Production-ready configuration
- Automatic container restart
- Health checks to ensure the application is running properly

### Troubleshooting Docker Setup

If you encounter issues with the Docker setup:

1. **Build Errors**: If you encounter TypeScript errors during build, the Dockerfile is configured to skip type checking. If you need to enable type checking, remove the `--no-lint` flag from the build command in the Dockerfile.

2. **Container Not Starting**: Check the container logs using:
   ```bash
   docker compose logs
   ```

3. **Port Conflicts**: If port 3000 is already in use on your host machine, modify the port mapping in docker-compose.yml:
   ```yaml
   ports:
     - "3001:3000"  # Change 3001 to any available port
   ```

## Learn More

- [PeerJS Documentation](https://peerjs.com/docs) - learn about PeerJS features and API
- [WebRTC Documentation](https://webrtc.org/) - learn about the underlying WebRTC technology
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Docker Documentation](https://docs.docker.com/) - learn about Docker
