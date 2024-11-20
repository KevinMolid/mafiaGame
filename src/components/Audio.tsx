import React, { useEffect } from "react";
import { useMusicContext } from "../MusicContext"; // Import the context

interface AudioPlayProps {
  playing: boolean;
  audio: string;
  volume: number;
  loop?: boolean;
}

const AudioPlay: React.FC<AudioPlayProps> = (props) => {
  const { audioElement, setAudio } = useMusicContext(); // Get audioElement from the context

  useEffect(() => {
    if (audioElement) {
      // Update the audio source whenever the `audio` prop changes
      setAudio(props.audio); // Update the context with the new audio source
      if (props.playing) {
        audioElement
          .play()
          .catch((err) => console.error("Audio playback error:", err)); // Play the audio
      } else {
        audioElement.pause(); // Pause the audio
      }
      audioElement.volume = props.volume ?? 0.5; // Set volume
      audioElement.loop = props.loop ?? false; // Set loop
    }
  }, [
    props.playing,
    props.audio,
    props.volume,
    props.loop,
    audioElement,
    setAudio,
  ]); // Add dependencies for all the relevant props

  return <></>; // Nothing to render, the audio element is managed in the background
};

export default AudioPlay;
