import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

export default function VideoMeetPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const roomFromUrl = searchParams.get('room');
  const [token, setToken] = useState(null);
  const [serverUrl, setServerUrl] = useState(null);
  const [roomName, setRoomName] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const state = location.state;
    if (state?.token && state?.serverUrl && state?.roomName) {
      setToken(state.token);
      setServerUrl(state.serverUrl);
      setRoomName(state.roomName);
      setLoading(false);
      return;
    }
    if (roomFromUrl && user) {
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Participant';
      apiFetch('/api/video/token', {
        method: 'POST',
        body: JSON.stringify({ roomName: roomFromUrl, participantName: name }),
      })
        .then((data) => {
          setToken(data.token);
          setServerUrl(data.url || '');
          setRoomName(data.roomName || roomFromUrl);
        })
        .catch((err) => setError(err.message || 'Failed to get meeting link'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      if (!roomFromUrl) setError('Missing room. Schedule a video call from Appointments first.');
    }
  }, [roomFromUrl, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Connecting to meeting…</p>
      </div>
    );
  }

  if (error || !token || !serverUrl || !roomName) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <p className="text-red-400 mb-4">{error || 'Missing token or server. Please schedule a video call from Appointments.'}</p>
        <button
          type="button"
          onClick={() => navigate('/appointments')}
          className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Back to Appointments
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect={true}
        audio={true}
        video={true}
        onDisconnected={() => navigate('/appointments')}
        className="h-screen"
        style={{ height: '100vh' }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
