import { useState } from "react";
import { SnapControl, Snapcast } from "../snapcontrol";
import {
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { Slider } from "./ui/slider";
import { ResponsiveDialog } from "./ResponsiveDialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { cn } from "../utils";

type ClientProps = {
  client: Snapcast.Client;
  snapcontrol: SnapControl;
  onDelete: () => void;
  onVolumeChange: () => void;
};

export default function Client(props: ClientProps) {
  const [update, setUpdate] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [name, setName] = useState(props.client.config.name);
  const [tmpLatency, setTmpLatency] = useState(props.client.config.latency);
  const [latency, setLatency] = useState(props.client.config.latency);

  function handleVolumeChange(value: number) {
    console.debug("handleVolumeChange: " + value);
    props.client.config.volume.percent = value;
    props.snapcontrol.setVolume(props.client.id, value, false);
    // setState({});
    props.onVolumeChange();
  }

  function handleOptionsClicked() {
    console.debug("handleOptionsClicked");
    setName(props.client.config.name);
    setTmpLatency(props.client.config.latency);
    setLatency(props.client.config.latency);
    setDetailsOpen(true);
  }

  function handleDetailsClose(apply: boolean) {
    setDetailsOpen(false);
    if (apply) {
      console.debug(
        "handleDetailsClose, setting latency to " +
          tmpLatency +
          ", name: " +
          name,
      );
      props.snapcontrol.setClientName(props.client.id, name);
      props.snapcontrol.setClientLatency(props.client.id, tmpLatency);
      setName(props.client.config.name);
      setLatency(tmpLatency);
    } else {
      console.debug(
        "handleDetailsClose, setting latency from " +
          tmpLatency +
          " to " +
          latency,
      );
      props.snapcontrol.setClientLatency(props.client.id, latency);
      setName(props.client.config.name);
      setTmpLatency(latency);
    }
  }

  function handleLatencyChange(latency: number) {
    console.debug("handleLatencyChange: " + latency);
    setTmpLatency(latency);
    props.snapcontrol.setClientLatency(props.client.id, latency);
  }

  function handleMuteClicked() {
    console.debug("handleMuteClicked");
    props.snapcontrol.setVolume(
      props.client.id,
      props.client.config.volume.percent,
      !props.client.config.volume.muted,
    );
    setUpdate(update + 1);
  }

  return (
    <div
      className={cn({
        "opacity-50": !props.client.connected,
      })}
    >
      <div className="flex items-center">
        <Button
          aria-label="Mute"
          variant="ghost"
          size="icon"
          onClick={handleMuteClicked}
        >
          {props.client.config.volume.muted ? (
            <VolumeOffIcon />
          ) : (
            <VolumeUpIcon />
          )}
        </Button>

        <Slider
          aria-label="Volume"
          color="secondary"
          min={0}
          max={100}
          value={[props.client.config.volume.percent]}
          onValueChange={(value) => handleVolumeChange(value[0])}
          label={
            props.client.config.name === ""
              ? props.client.host.name
              : props.client.config.name
          }
          disabled={props.client.config.volume.muted}
        />

        <Button
          aria-label="Options"
          variant="ghost"
          size="icon"
          onClick={handleOptionsClicked}
        >
          <MoreVertIcon />
        </Button>
      </div>

      <ResponsiveDialog
        open={detailsOpen}
        setOpen={(newState) => {
          if (!newState) handleDetailsClose(false);
        }}
        title="Client Settings"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => handleDetailsClose(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={() => handleDetailsClose(true)}>OK</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              className="w-full"
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="latency">Latency</Label>
            <Input
              id="latency"
              value={tmpLatency}
              type="number"
              onChange={(event) =>
                handleLatencyChange(Number(event.target.value) || 0)
              }
            />
          </div>

          {/* TODO: make these all readonly */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="client">Client</Label>
            <Input
              id="client"
              value={
                props.client.snapclient.name +
                " " +
                props.client.snapclient.version
              }
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="mac">Mac</Label>
            <Input id="mac" value={props.client.host.mac} />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="id">ID</Label>
            <Input id="id" value={props.client.id} />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="ip">IP</Label>
            <Input id="ip" value={props.client.host.ip} />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="host">Host</Label>
            <Input id="host" value={props.client.host.name} />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="os">OS</Label>
            <Input id="os" value={props.client.host.os} />
          </div>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
