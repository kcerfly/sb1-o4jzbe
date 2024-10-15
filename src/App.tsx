import React, { useState, useRef } from 'react';
import { Play, Pause, RefreshCw, Mic, Send, Bell } from 'lucide-react';
import { config } from './config';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [requestResult, setRequestResult] = useState<{ button: string; result: string } | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const sendRequest = async (endpoint: string, buttonName: string) => {
    try {
      const url = `${config.apiBaseUrl}${endpoint}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.text();
      setRequestResult({ button: buttonName, result: data });
      console.log(`Request to ${url} successful`);
    } catch (error) {
      console.error(`Error sending request to ${endpoint}:`, error);
      setRequestResult({ button: buttonName, result: `Error: ${error.message}` });
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        startRecording(stream);
      } catch (err) {
        console.error('Error accessing the microphone', err);
      }
    }
    setIsRecording(!isRecording);
  };

  const startRecording = (stream: MediaStream) => {
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioURL(audioUrl);
    };

    mediaRecorder.start();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleNotification = () => {
    console.log('Sending notification');
    sendRequest('/notification', 'Send Notification');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg space-y-6 w-96">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Control Panel</h1>
        
        <button
          onClick={() => sendRequest('/init/scene', 'Reset Environment')}
          className="btn-primary"
        >
          <RefreshCw size={20} />
          Reset Environment
        </button>

        <button
          onClick={() => sendRequest('/start', 'Start Tong Tong')}
          className="btn-primary"
        >
          <Play size={20} />
          Start Tong Tong
        </button>

        <button
          onClick={() => sendRequest('/capture', 'Capture Virtual Scene')}
          className="btn-secondary"
        >
          Capture Virtual Scene
        </button>

        <button
          onClick={() => sendRequest('/stop', 'Stop Capturing')}
          className="btn-secondary"
        >
          <Pause size={20} />
          Stop Capturing
        </button>

        <button
          onClick={() => sendRequest('/stream', 'Stream to Virtual Scene')}
          className="btn-secondary"
        >
          <Send size={20} />
          Stream to Virtual Scene
        </button>

        <button
          onClick={handleMicClick}
          className={`btn-primary ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`}
        >
          <Mic size={20} />
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>

        <button
          onClick={handleNotification}
          className="btn-primary"
        >
          <Bell size={20} />
          Send Notification
        </button>

        {audioURL && (
          <div className="mt-4">
            <audio src={audioURL} controls className="w-full" />
          </div>
        )}

        {requestResult && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h3 className="font-bold">{requestResult.button} Result:</h3>
            <p className="mt-2 text-sm">{requestResult.result}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;