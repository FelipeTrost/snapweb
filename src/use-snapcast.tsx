import {
  createContext,
  ReactNode,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Snapcast, SnapControl } from "@/src/snapcontrol";
import { config } from "./config";
import { SnapStream } from "./snapstream";
import snapcast512 from "./assets/snapcast-512.png";
import silence from "./assets/10-seconds-of-silence.mp3";

type SnapcastContext = {
  server: Snapcast.Server;
  snapControl: SnapControl;
  isConnected: boolean;
  connectError: string;
  isPlaying: boolean;
  setIsPlaying: (_arg: boolean) => void;
  _update: number;
};

const snapControl = new SnapControl();

const snapCastContext = createContext<SnapcastContext>({
  snapControl,
  server: new Snapcast.Server(),
  isConnected: false,
  connectError: "",
  isPlaying: false,
  setIsPlaying: () => {},
  _update: 0,
});

function updateMediaSession(audio: HTMLAudioElement, streamId: string) {
  // https://developers.google.com/web/updates/2017/02/media-session
  // https://github.com/googlechrome/samples/tree/gh-pages/media-session
  // https://googlechrome.github.io/samples/media-session/audio.html
  // https://developer.mozilla.org/en-US/docs/Web/API/MediaSession/setActionHandler#seekto
  console.debug("updateMediaSession");
  try {
    const properties = snapControl.getStream(streamId).properties;
    const metadata = properties.metadata;
    const title: string = metadata?.title || "Unknown Title";
    const artist: string =
      metadata?.artist !== undefined
        ? metadata?.artist.join(", ")
        : "Unknown Artist";
    const album: string = metadata?.album || "";
    let artwork: Array<MediaImage> = [
      { src: snapcast512, sizes: "512x512", type: "image/png" },
    ];
    if (metadata?.artUrl !== undefined) {
      artwork = [
        { src: metadata.artUrl, sizes: "96x96", type: "image/png" },
        { src: metadata.artUrl, sizes: "128x128", type: "image/png" },
        { src: metadata.artUrl, sizes: "192x192", type: "image/png" },
        { src: metadata.artUrl, sizes: "256x256", type: "image/png" },
        { src: metadata.artUrl, sizes: "384x384", type: "image/png" },
        { src: metadata.artUrl, sizes: "512x512", type: "image/png" },
      ];
    } // || 'snapcast-512.png';
    console.info(
      "Metadata title: " +
        title +
        ", artist: " +
        artist +
        ", album: " +
        album +
        ", artwork: " +
        artwork,
    );
    navigator.mediaSession!.metadata = new MediaMetadata({
      title: title,
      artist: artist,
      album: album,
      artwork: artwork,
    });

    const mediaSession = navigator.mediaSession!;
    let play_state: MediaSessionPlaybackState = "none";
    if (properties.playbackStatus !== undefined) {
      if (properties.playbackStatus === "playing") {
        console.debug("updateMediaSession: playing");
        audio.play();
        play_state = "playing";
      } else if (properties.playbackStatus === "paused") {
        console.debug("updateMediaSession: paused");
        audio.pause();
        play_state = "paused";
      } else if (properties.playbackStatus === "stopped") {
        console.debug("updateMediaSession: stopped");
        audio.pause();
        play_state = "none";
      }
    }

    mediaSession.playbackState = play_state;
    mediaSession.setActionHandler(
      "play",
      properties.canPlay
        ? () => {
            snapControl.control(streamId, "play");
          }
        : null,
    );
    mediaSession.setActionHandler(
      "pause",
      properties.canPause
        ? () => {
            snapControl.control(streamId, "pause");
          }
        : null,
    );
    mediaSession.setActionHandler(
      "previoustrack",
      properties.canGoPrevious
        ? () => {
            snapControl.control(streamId, "previous");
          }
        : null,
    );
    mediaSession.setActionHandler(
      "nexttrack",
      properties.canGoNext
        ? () => {
            snapControl.control(streamId, "next");
          }
        : null,
    );
    try {
      mediaSession.setActionHandler(
        "stop",
        properties.canControl
          ? () => {
              snapControl.control(streamId, "stop");
            }
          : null,
      );
    } catch (error) {
      console.debug(
        'Warning! The "stop" media session action is not supported.',
      );
    }
    const defaultSkipTime: number = 10; // Time to skip in seconds by default
    mediaSession.setActionHandler(
      "seekbackward",
      properties.canSeek
        ? (event: MediaSessionActionDetails) => {
            const offset: number = (event.seekOffset || defaultSkipTime) * -1;
            if (properties.position !== undefined)
              Math.max(properties.position! + offset, 0);
            snapControl.control(streamId, "seek", { offset: offset });
          }
        : null,
    );

    mediaSession.setActionHandler(
      "seekforward",
      properties.canSeek
        ? (event: MediaSessionActionDetails) => {
            const offset: number = event.seekOffset || defaultSkipTime;
            if (
              metadata?.duration !== undefined &&
              properties.position !== undefined
            )
              Math.min(properties.position! + offset, metadata.duration!);
            snapControl.control(streamId, "seek", { offset: offset });
          }
        : null,
    );

    try {
      mediaSession.setActionHandler(
        "seekto",
        properties.canSeek
          ? (event: MediaSessionActionDetails) => {
              const position: number = event.seekTime || 0;
              if (metadata?.duration !== undefined)
                Math.min(position, metadata.duration!);
              snapControl.control(streamId, "setPosition", {
                position: position,
              });
            }
          : null,
      );
    } catch (_error) {
      console.debug(
        'Warning! The "seekto" media session action is not supported.',
      );
    }

    if (
      metadata?.duration !== undefined &&
      properties.position !== undefined &&
      properties.position! <= metadata.duration!
    ) {
      if ("setPositionState" in mediaSession) {
        console.debug(
          "Updating position state: " +
            properties.position! +
            "/" +
            metadata.duration!,
        );
        mediaSession.setPositionState!({
          duration: metadata.duration,
          playbackRate: 1.0,
          position: properties.position!,
        });
      }
    } else {
      mediaSession.setPositionState!({
        duration: 0,
        playbackRate: 1.0,
        position: 0,
      });
    }
  } catch (e) {
    console.debug("updateMediaSession failed: " + e);
    return;
  }
}

export function SnapcastProvider({ children }: { children: ReactNode }) {
  const [server, setServer] = useState(snapControl.server);
  const [_update, setUpdate] = useState(0);
  const [isConnected, setConnected] = useState(false);
  const [serverUrl, _setServerUrl] = useState(config.baseUrl);
  const [connectError, setConnectError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(new Audio());
  const snapstreamRef = useRef<SnapStream | null>(null);

  // Basic
  useEffect(() => {
    function handleChange(snapserver: Snapcast.Server) {
      setServer(snapserver);
      setUpdate((prev) => prev + 1);
      if (snapstreamRef.current)
        updateMediaSession(audioRef.current, getMyStreamId());
    }

    snapControl.onChange = (_control: SnapControl, server: Snapcast.Server) =>
      handleChange(server);

    snapControl.onConnectionChanged = (
      _control: SnapControl,
      connected: boolean,
      error?: string,
    ) => {
      console.log(
        "Connection state changed: " + connected + ", error: " + error,
      );
      if (!connected) {
        setIsPlaying(false);
        // setServer(new Snapcast.Server());
        if (error) setConnectError(error);
      }

      setConnected(connected);
    };

    snapControl.connect(serverUrl);

    return () => snapControl.disconnect();
  }, []);

  // useEffect(() => {
  //   console.debug("serverUrl updated: " + serverUrl);
  //   setServer(new Snapcast.Server());
  //   snapControlRef.current.connect(serverUrl);
  //   const connection = snapControlRef.current;
  //   return () => {
  //     connection.disconnect();
  //   };
  // }, [serverUrl]);

  // Browser media playback

  function getMyStreamId(): string {
    try {
      const group = snapControl.getGroupFromClient(SnapStream.getClientId());
      return snapControl.getStream(group.stream_id).id;
    } catch (e) {
      return "";
    }
  }

  useEffect(() => {
    if (isPlaying) {
      console.debug("isPlaying changed to true");
      audioRef.current.src = silence;
      audioRef.current.loop = true;
      audioRef.current.play().then(() => {
        snapstreamRef.current = new SnapStream(config.baseUrl);
      });
    } else {
      console.debug("isPlaying changed to false");
      if (snapstreamRef.current) snapstreamRef.current.stop();
      snapstreamRef.current = null;
      audioRef.current.pause();
      audioRef.current.src = "";
    }
  }, [isPlaying]);

  const contextValue = useMemo(
    () => ({
      snapControl,
      server,
      isConnected,
      connectError,
      isPlaying,
      setIsPlaying,
      _update,
    }),
    [server, _update, isConnected, connectError, isPlaying, setIsPlaying],
  );

  return (
    <snapCastContext.Provider value={contextValue}>
      {children}
    </snapCastContext.Provider>
  );
}

export function useSnapcast() {
  return use(snapCastContext);
}
