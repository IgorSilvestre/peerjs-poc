import VideoCall from './components/VideoCall';

export default function Home() {
  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">PeerJS Video Call POC</h1>
          <p className="text-gray-600 dark:text-gray-400">
            A simple proof-of-concept for peer-to-peer video calls using PeerJS
          </p>
        </header>

        <VideoCall />

        <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Built with <a href="https://nextjs.org" className="underline" target="_blank" rel="noopener noreferrer">Next.js</a> and <a href="https://peerjs.com" className="underline" target="_blank" rel="noopener noreferrer">PeerJS</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
