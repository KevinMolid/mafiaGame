import React, { useEffect, useRef } from "react";

interface AudioPlayProps {
  playing: number;
  audio: string;
  loop?: boolean;
}

const AudioPlay: React.FC<AudioPlayProps> = (props) => {
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (props.playing > 0) {
      play(props.audio);
    } else if (audio.current) {
      audio.current.pause();
    }
  }, [props.playing, props.audio]);

  function play(sound: string) {
    if (audio.current) {
      audio.current.src = sound;
      audio.current.volume = 0.5;
      audio.current.loop = props.loop ?? false;
      audio.current.play();
    } else {
      audio.current = new Audio(sound);
      audio.current.volume = 0.5;
      audio.current.loop = props.loop ?? false;
      audio.current.play();
    }
  }

  return <></>;
};

export default AudioPlay;
