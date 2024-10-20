import React, { useEffect, useRef } from "react";

interface AudioPlayProps {
  playing: number; // Assuming playing is a number
  audio: string; // Assuming audio is a string URL
  loop?: boolean; // Optional property
}

const AudioPlay: React.FC<AudioPlayProps> = (props) => {
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (props.playing > 0) {
      play(props.audio);
    } else if (audio.current) {
      audio.current.pause();
    }
  }, [props.playing, props.audio]); // Added props.audio to the dependency array

  function play(sound: string) {
    if (audio.current) {
      audio.current.src = sound; // Update source instead of creating a new Audio instance
      audio.current.volume = 0.1;
      audio.current.loop = props.loop ?? false; // Default to false if loop is not provided
      audio.current.play();
    } else {
      audio.current = new Audio(sound);
      audio.current.volume = 0.1;
      audio.current.loop = props.loop ?? false;
      audio.current.play();
    }
  }

  return <></>;
};

export default AudioPlay;
