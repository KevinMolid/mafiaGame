import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the shape of the context state
interface MusicContextType {
  playing: number; // Represents whether music is playing (1) or not (0)
  setPlaying: (state: number) => void; // Function to update the playing state
  audio: string; // The current audio source
  setAudio: (audio: string) => void; // Function to update the audio source
}

// Create the context with default values
const MusicContext = createContext<MusicContextType | undefined>(undefined);

// Create a provider component
export const MusicProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [playing, setPlaying] = useState<number>(0);
  const [audio, setAudio] = useState<string>("");

  return (
    <MusicContext.Provider value={{ playing, setPlaying, audio, setAudio }}>
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
