import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  X,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  Send
} from 'lucide-react';
import { api } from '../services/api';

const QUICK_EXAMPLES = [
  "Hey Kitchen OS, I just used half the cottage cheese",
  "Hey Kitchen OS, update the cooked dal to 200g",
  "Used 2 eggs and drank half the milk",
  "Add paneer to fridge"
];

export default function VoiceLogModal({ isOpen, onClose, onPantryUpdated }) {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [responseLog, setResponseLog] = useState(null);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);
  const recognitionRef = useRef(null);
  const liveTranscriptRef = useRef('');

  const speakNativeVoice = (text) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny')));
      if (naturalVoice) utterance.voice = naturalVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSuccessResponse = (res) => {
    setResponseLog(res);
    if (res.transcript_received || res.transcript) {
      setTranscript(res.transcript_received || res.transcript);
    }
    
    // Play synthesized ElevenLabs audio if available
    if (res.audio_base64 && res.audio_base64.includes('audio/mp3')) {
      setAudioUrl(res.audio_base64);
      setTimeout(() => {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.play().catch(e => {
            console.log('Audio autoplay prevented, speaking via SpeechSynthesis:', e);
            speakNativeVoice(res.spoken_confirmation);
          });
        }
      }, 150);
    } else if (res.spoken_confirmation) {
      // Fallback voice narration via browser SpeechSynthesis for instant feedback
      speakNativeVoice(res.spoken_confirmation);
    }

    if (onPantryUpdated) {
      onPantryUpdated();
    }
  };

  const processAudioBlob = async (audioBlob, mimeType) => {
    setIsProcessing(true);
    setError(null);
    try {
      const ext = mimeType.includes('webm') ? 'webm' : (mimeType.includes('wav') ? 'wav' : 'ogg');
      const res = await api.voice.sendAudioCommand(audioBlob, `kitchen_speech.${ext}`);
      handleSuccessResponse(res);
    } catch (err) {
      console.error(err);
      setError('Could not process voice audio. Try again or submit as text.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processTextCommand = async (textToSend) => {
    const text = textToSend || transcript;
    if (!text.trim()) return;

    setIsProcessing(true);
    setError(null);
    try {
      const res = await api.voice.sendCommand(text);
      handleSuccessResponse(res);
    } catch (err) {
      console.error(err);
      setError('Voice command failed to process.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    setError(null);
    liveTranscriptRef.current = '';
    audioChunksRef.current = [];

    // 1. Initialize Web Speech Recognition if available in browser
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              liveTranscriptRef.current += event.results[i][0].transcript + ' ';
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          const combined = (liveTranscriptRef.current + ' ' + interimTranscript).trim();
          if (combined) setTranscript(combined);
        };

        recognition.onerror = (e) => {
          console.log('Speech recognition event:', e.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.log('SpeechRecognition init skipped:', err);
      }
    }

    // 2. Start MediaRecorder for audio recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav');

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const finalRecordedText = liveTranscriptRef.current.trim() || transcript.trim();
        
        if (finalRecordedText && finalRecordedText.length > 2) {
          await processTextCommand(finalRecordedText);
        } else {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          await processAudioBlob(audioBlob, mimeType);
        }
      };

      recorder.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setError('Microphone access denied. You can still type your voice command below.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setResponseLog(null);
      setError(null);
      setTranscript('');
      setAudioUrl(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#FFFDF8] rounded-3xl border-2 border-[#E6DBC8] shadow-2xl p-6 sm:p-8">

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E6DBC8]">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-[#A84323]/10 text-[#A84323] flex items-center justify-center border border-[#A84323]/20 shadow-xs">
              <Mic className="w-6 h-6 text-[#A84323]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2D1F18] font-serif flex items-center gap-2">
                <span>Voice Inventory Assistant</span>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-[#A84323]/10 text-[#A84323] px-2.5 py-0.5 rounded-full border border-[#A84323]/25">
                  Gemini & ElevenLabs AI
                </span>
              </h3>
              <p className="text-xs text-[#5C4435] font-medium">
                Log items hands-free while cooking with conversational audio confirmations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8A7667] hover:text-[#2D1F18] hover:bg-[#FAF5EB] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden Audio Player */}
        {audioUrl && (
          <audio ref={audioPlayerRef} src={audioUrl} className="hidden" />
        )}

        {/* Voice Recording Control */}
        <div className="my-6 text-center">
          <div className="relative inline-block">
            {isRecording && (
              <span className="absolute -inset-3 rounded-full bg-[#A84323]/20 animate-ping pointer-events-none" />
            )}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isRecording
                  ? 'bg-rose-600 text-white shadow-rose-600/30 scale-105'
                  : 'bg-[#A84323] hover:bg-[#94381C] text-white shadow-[#A84323]/25 hover:scale-105'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              ) : isRecording ? (
                <MicOff className="w-8 h-8 text-white animate-pulse" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
          </div>

          <div className="mt-3">
            <span className="text-xs font-bold text-[#2D1F18] block font-serif">
              {isRecording
                ? 'Listening to kitchen speech... Click to Stop'
                : isProcessing
                  ? 'Processing with Gemini & ElevenLabs Voice AI...'
                  : 'Click microphone to speak hands-free'}
            </span>
            <span className="text-[11px] text-[#8A7667] font-medium">
              E.g., "Used half the paneer and put 200g of cooked dal in the fridge"
            </span>
          </div>
        </div>

        {/* Text Input / Live Transcript */}
        <div className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  processTextCommand();
                }
              }}
              placeholder="Or type speech: 'Used 2 tomatoes and put milk in fridge'..."
              className="w-full pl-4 pr-11 py-3 rounded-xl bg-[#FAF5EB] border border-[#E6DBC8] text-xs font-medium text-[#2D1F18] placeholder-[#8A7667] focus:outline-none focus:border-[#A84323] focus:ring-1 focus:ring-[#A84323] transition-all"
            />
            <button
              type="button"
              onClick={() => processTextCommand()}
              disabled={isProcessing || !transcript.trim()}
              className="absolute right-2 top-2 p-1.5 rounded-lg bg-[#A84323] hover:bg-[#94381C] text-white disabled:opacity-40 transition-all"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Quick Examples */}
          <div>
            <span className="text-[11px] font-bold text-[#5C4435] block mb-1.5 font-serif">
              Try quick examples:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setTranscript(ex);
                    processTextCommand(ex);
                  }}
                  className="text-[10px] text-[#5C4435] hover:text-[#A84323] bg-[#FAF5EB] hover:bg-[#F5EDE1] border border-[#E6DBC8] px-2.5 py-1 rounded-lg text-left transition-all"
                >
                  "{ex.slice(0, 38)}..."
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Response Feedback */}
        {responseLog && (
          <div className="mt-5 p-4 rounded-2xl bg-[#FAF5EB] border border-[#E6DBC8] space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2D1F18] font-serif flex items-center gap-1.5">
                {responseLog.actions_parsed?.some(a => a.action === 'add_rejected') ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-[#A84323]" />
                    <span className="text-[#A84323]">Voice Action Notice</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Pantry Inventory Updated</span>
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (audioUrl && audioPlayerRef.current) {
                    audioPlayerRef.current.play().catch(() => speakNativeVoice(responseLog.spoken_confirmation));
                  } else {
                    speakNativeVoice(responseLog.spoken_confirmation);
                  }
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#A84323] bg-[#A84323]/10 px-2 py-0.5 rounded-md hover:bg-[#A84323]/20 transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Replay Voice</span>
              </button>
            </div>

            <p className="text-xs text-[#2D1F18] font-medium italic">
              "{responseLog.spoken_confirmation}"
            </p>

            {responseLog.database_logs && responseLog.database_logs.length > 0 && (
              <div className="pt-2 border-t border-[#E6DBC8]/60 space-y-1">
                {responseLog.database_logs.map((log, idx) => (
                  <div key={idx} className="text-[11px] text-[#5C4435] flex items-center gap-1.5 font-medium">
                    <span className={`w-1.5 h-1.5 rounded-full ${log.includes('Rejected') || log.includes("can't add") ? 'bg-amber-600' : 'bg-[#4E6E36]'}`} />
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-800 flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 pt-4 border-t border-[#E6DBC8] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-bold text-[#8A7667] hover:text-[#2D1F18] hover:bg-[#FAF5EB] transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
