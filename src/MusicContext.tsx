import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the shape of the context state
interface MusicContextType {
  playing: boolean;
  setPlaying: (state: boolean) => void;
  audio: string;
  setAudio: (audio: string) => void;
  volume: number;
  setVolume: (volume: number) => void;
  audioElement: HTMLAudioElement;
}

// Create the context with default values
const MusicContext = createContext<MusicContextType | undefined>(undefined);

// Create a provider component
export const MusicProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [playing, setPlaying] = useState<boolean>(false);
  const [audio, setAudio] = useState<string>("/MafiaReign.wav");
  const [volume, setVolume] = useState<number>(0.5); // Default volume at 50%
  const [audioElement] = useState(new Audio());

  // Sync audio source whenever `audio` changes
  React.useEffect(() => {
    if (audio) {
      audioElement.src = audio; // Update the audio source
      audioElement.load(); // Ensure the audio is reloaded
    }
  }, [audio, audioElement]);

  // Sync playback state whenever `playing` changes
  React.useEffect(() => {
    if (playing) {
      audioElement
        .play()
        .catch((err) => console.error("Audio playback error:", err));
    } else {
      audioElement.pause();
    }
  }, [playing, audioElement]);

  // Sync volume whenever `volume` changes
  React.useEffect(() => {
    audioElement.volume = volume; // Update volume
    audioElement.loop = true; // Enable looping
  }, [volume, audioElement]);

  return (
    <MusicContext.Provider
      value={{
        playing,
        setPlaying,
        audio,
        setAudio,
        volume,
        setVolume,
        audioElement,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

// Custom hook to use the MusicContext
export const useMusicContext = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error("useMusicContext must be used within a MusicProvider");
  }
  return context;
};
