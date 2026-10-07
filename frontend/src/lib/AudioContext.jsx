import { createContext, useContext, useRef, useState, useCallback } from "react";

const AudioCtx = createContext(null);

export function AudioProvider({ children }) {
  const audioRef = useRef(new Audio());
  const [track, setTrack] = useState(null);   // { src, title, eventId }
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audio = audioRef.current;

  // Wire up events once
  audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
  audio.ondurationchange = () => setDuration(audio.duration || 0);
  audio.onended = () => setPlaying(false);
  audio.onpause = () => setPlaying(false);
  audio.onplay = () => setPlaying(true);

  const play = useCallback((src, title, eventId) => {
    if (audio.src !== src) {
      audio.src = src;
      audio.load();
    }
    audio.play().catch(() => {});
    setTrack({ src, title, eventId });
  }, [audio]);

  const togglePlay = useCallback(() => {
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, [audio]);

  const seek = useCallback((time) => {
    audio.currentTime = time;
  }, [audio]);

  const stop = useCallback(() => {
    audio.pause();
    audio.currentTime = 0;
    setTrack(null);
    setPlaying(false);
  }, [audio]);

  return (
    <AudioCtx.Provider value={{ track, playing, currentTime, duration, play, togglePlay, seek, stop }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  return useContext(AudioCtx);
}
