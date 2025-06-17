import { useEffect, useRef, useState } from "react";
import { Snapcast } from "./snapcontrol";
import { useSnapcast } from "./use-snapcast";
import { useConfig } from "./config";

type GroupVolumeChange = {
  volumeEntered: boolean;
  client_volumes: Map<string, number>;
  group_volume: number;
};
function getGroupVolume(clients: Snapcast.Client[]) {
  let volume = 0;
  for (const client of clients) volume += client.config.volume.percent;
  volume /= clients.length;
  return volume;
}

// NOTE: wouter destroys and mounts pages, that's why this shows the correct state, if
// if it didn't this hook would need a way to update once the colume is changed somewhere else
export function useGroupValueChange(
  group: Snapcast.Group | undefined,
  clients: Snapcast.Client[],
) {
  const { snapControl } = useSnapcast();
  const config = useConfig();

  const groupVolumeChange = useRef<GroupVolumeChange>({
    volumeEntered: true,
    client_volumes: new Map<string, number>(),
    group_volume: 0,
  });
  const [volume, setVolume] = useState(() => {
    return getGroupVolume(clients);
  });
  const setUpdate = useState(false)[1];

  useEffect(() => {
    setVolume(getGroupVolume(clients));
  }, [clients]);

  let muted: boolean;
  if (group) {
    muted = group.muted;
  } else {
    muted = true;
    for (const client of clients) {
      if (
        (client.connected || config.showOffline) &&
        !client.config.volume.muted
      ) {
        muted = false;
        break;
      }
    }
  }

  function handleVolumeChangeCommitted(value: number) {
    console.debug("handleVolumeChangeCommitted: " + value);
    groupVolumeChange.current.volumeEntered = true;
  }

  function handleVolumeChange(value: number) {
    console.debug("handleVolumeChange: " + value);
    if (groupVolumeChange.current.volumeEntered) {
      groupVolumeChange.current.client_volumes.clear();
      groupVolumeChange.current.group_volume = 0;
      for (const client of clients) {
        groupVolumeChange.current.client_volumes.set(
          client.id,
          client.config.volume.percent,
        );
        groupVolumeChange.current.group_volume += client.config.volume.percent;
      }
      groupVolumeChange.current.group_volume /=
        groupVolumeChange.current.client_volumes.size;
      groupVolumeChange.current.volumeEntered = false;
    }

    const delta = value - groupVolumeChange.current.group_volume;
    let ratio: number;
    if (delta < 0)
      ratio =
        (groupVolumeChange.current.group_volume - value) /
        groupVolumeChange.current.group_volume;
    else
      ratio =
        (value - groupVolumeChange.current.group_volume) /
        (100 - groupVolumeChange.current.group_volume);

    for (const client of clients) {
      let new_volume = groupVolumeChange.current.client_volumes.get(client.id)!;
      if (delta < 0) new_volume -= ratio * new_volume;
      else new_volume += ratio * (100 - new_volume);

      client.config.volume.percent = new_volume;
      snapControl.setVolume(client.id, new_volume);
    }

    setVolume(value);
  }

  function handleMuteClicked() {
    console.debug("handleMuteClicked");
    if (group) {
      group.muted = !group.muted;
      snapControl.muteGroup(group.id, group.muted);
      setUpdate((prev) => !prev);
    } else {
      for (const client of clients) {
        snapControl.setVolume(client.id, client.config.volume.percent, !muted);
      }
    }
  }

  function updateGroupVolume() {
    setVolume(getGroupVolume(clients));
  }

  return {
    handleVolumeChangeCommitted,
    handleVolumeChange,
    handleMuteClicked,
    volume,
    updateGroupVolume,
    muted,
  };
}
