import { useSnapcast } from "../use-snapcast";
import { Button } from "./ui/button";
import { Pause, Play } from "lucide-react";

export function OnDevicePlayerControl() {
  const { isPlaying, setIsPlaying } = useSnapcast();

  return (
    <Button
      onClick={() => setIsPlaying(!isPlaying)}
      variant="ghost"
      size="icon"
      className="stroke-blue-50"
    >
      {isPlaying ? <Pause /> : <Play />}
    </Button>
  );
}
