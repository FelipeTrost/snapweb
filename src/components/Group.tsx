import React from "react";
import { useState } from "react";
import Client from "./Client";
import logo from "../assets/logo192.png";
import { Snapcast } from "../snapcontrol";
import {
  Alert,
  CardMedia,
  Snackbar,
  Stack,
  Typography,
  IconButton,
} from "@mui/material";
import {
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  SkipPrevious as SkipPreviousIcon,
  SkipNext as SkipNextIcon,
} from "@mui/icons-material";
import { CardTitle } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { ResponsiveDialog } from "./ResponsiveDialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useSnapcast } from "../use-snapcast";
import { Link, useParams } from "wouter";
import { ArrowLeft, Settings } from "lucide-react";
import { useGroupValueChange } from "../volume-utils";
import { config } from "../config";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Skeleton } from "./ui/skeleton";

type GroupClient = {
  client: Snapcast.Client;
  inGroup: boolean;
  wasInGroup: boolean;
};

function Back() {
  return (
    <Link to="/">
      <ArrowLeft />
    </Link>
  );
}

function Group({ group }: { group: Snapcast.Group }) {
  const { snapControl, server } = useSnapcast();

  const [update, setUpdate] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clients, setClients] = useState<GroupClient[]>([]);
  const [streamId, setStreamId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [deletedClients, setDeletedClients] = useState<Snapcast.Client[]>([]);

  function getClients(): Snapcast.Client[] {
    const clients = [];
    for (const client of group.clients) {
      if (
        (client.connected || config.showOffline) &&
        !deletedClients.includes(client)
      ) {
        clients.push(client);
      }
    }
    return clients;
  }

  const {
    handleVolumeChangeCommitted,
    handleVolumeChange,
    volume,
    updateGroupVolume,
    handleMuteClicked,
  } = useGroupValueChange(group, getClients);

  function handleSettingsClicked(_event: React.MouseEvent<HTMLButtonElement>) {
    console.debug("handleSettingsClicked");

    const clients: GroupClient[] = [];
    for (const group of server.groups) {
      for (const client of group.clients) {
        const inGroup: boolean = group.clients.includes(client);
        clients.push({ client: client, inGroup: inGroup, wasInGroup: inGroup });
      }
    }

    // this.clients = [];
    // server.groups.map(group => group.clients.map(client => this.clients.push(client.id)));
    setSettingsOpen(true);
    setClients(clients);
    setStreamId(group.stream_id);
    setGroupName(group.name);
  }

  function handleSettingsClose(apply: boolean) {
    console.debug("handleSettingsClose: " + apply);
    if (apply) {
      let changed: boolean = false;
      for (const element of clients) {
        if (element.inGroup !== element.wasInGroup) {
          changed = true;
          break;
        }
      }

      if (changed) {
        const groupClients: string[] = [];
        for (const element of clients)
          if (element.inGroup) groupClients.push(element.client.id);
        snapControl.setClients(group.id, groupClients);
      }

      if (group.stream_id !== streamId)
        snapControl.setStream(group.id, streamId);

      if (group.name !== groupName)
        snapControl.setGroupName(group.id, groupName);
    }

    setSettingsOpen(false);
  }

  function handleGroupClientChange(client: Snapcast.Client, inGroup: boolean) {
    console.debug(
      "handleGroupClientChange: " + client.id + ", in group: " + inGroup,
    );
    const newclients = clients;
    const idx = newclients.findIndex((element) => element.client === client);
    newclients[idx].inGroup = inGroup;
    setClients(newclients);
    // dummy update, since the array was just mutated
    setUpdate(update + 1);
  }

  function handleClientDelete(client: Snapcast.Client) {
    console.debug("handleClientDelete: " + client.getName());
    const newDeletedClients = deletedClients;
    if (!newDeletedClients.includes(client)) newDeletedClients.push(client);
    setDeletedClients(newDeletedClients);
    // dummy update, since the array was just mutated
    setUpdate(update + 1);
  }

  function handleSnackbarClose(client: Snapcast.Client, undo: boolean) {
    console.debug(
      "handleSnackbarClose, client: " + client.getName() + ", undo: " + undo,
    );
    if (!undo) snapControl.deleteClient(client.id);

    const newDeletedClients = deletedClients;
    if (newDeletedClients.includes(client))
      newDeletedClients.splice(newDeletedClients.indexOf(client), 1);

    setDeletedClients(newDeletedClients);
    setUpdate(update + 1);
  }

  function handlePlayPauseClicked() {
    if (
      server.getStream(group.stream_id)?.properties.playbackStatus === "playing"
    )
      snapControl.control(group.stream_id, "pause");
    else snapControl.control(group.stream_id, "play");
  }

  function snackbar() {
    return deletedClients.map((client) => (
      <Snackbar
        open
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        autoHideDuration={6000}
        key={"snackbar-" + client.id}
        onClose={(_, reason: string) => {
          if (reason !== "clickaway") handleSnackbarClose(client, false);
        }}
      >
        <Alert
          onClose={(_) => {
            handleSnackbarClose(client, false);
          }}
          severity="info"
          sx={{ width: "100%" }}
          action={
            <Button
              color="inherit"
              onClick={(_) => {
                handleSnackbarClose(client, true);
              }}
            >
              Undo
            </Button>
          }
        >
          Deleted {client.getName()}
        </Alert>
      </Snackbar>
    ));
  }

  // console.debug("Render Group " + group.id);
  const groupClients = [];
  for (const client of getClients()) {
    groupClients.push(
      <Client
        key={client.id}
        client={client}
        snapcontrol={snapControl}
        onDelete={() => {
          handleClientDelete(client);
        }}
        onVolumeChange={updateGroupVolume}
      />,
    );
  }
  if (groupClients.length === 0) return <div>{snackbar()}</div>;

  const stream = server.getStream(group.stream_id);
  const artUrl = stream?.properties.metadata?.artUrl || logo;
  const title = stream?.properties.metadata?.title || "Unknown Title";
  const artist: string = stream?.properties.metadata?.artist
    ? stream!.properties.metadata.artist.join(", ")
    : "Unknown Artist";

  console.debug("Art URL: " + artUrl);

  const allClients = [];
  for (const group of server.groups)
    for (const client of group.clients) allClients.push(client);

  return (
    <>
      <div className="flex flex-row flex-nowrap justify-between items-start">
        <div className="flex mb-8 justify-between w-full">
          <Back />
          <CardTitle>{group?.name}</CardTitle>
          <Button
            aria-label="Options"
            variant="ghost"
            size="icon"
            // TODO: get this button's size right
            className="text-2xl"
            onClick={(event) => {
              handleSettingsClicked(event);
            }}
          >
            <Settings />
          </Button>
        </div>
      </div>

      <Select
        value={group.stream_id}
        onValueChange={(stream: string) => {
          setStreamId(stream);
          snapControl.setStream(group.id, stream);
        }}
      >
        <SelectTrigger className="w-[180px] mb-4">
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent>
          {server.streams.map((stream) => (
            <SelectItem key={stream.id} value={stream.id}>
              {stream.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {stream?.properties.canControl && (
        <Stack direction="row" justifyContent="center" alignItems="center">
          <IconButton
            aria-label="previous"
            onClick={() => {
              snapControl.control(group.stream_id, "previous");
            }}
          >
            <SkipPreviousIcon />
          </IconButton>
          <IconButton
            aria-label="play/pause"
            onClick={() => {
              handlePlayPauseClicked();
            }}
          >
            {server.getStream(group.stream_id)?.properties.playbackStatus ===
            "playing" ? (
              <PauseIcon />
            ) : (
              <PlayArrowIcon />
            )}
            {/* sx={{ height: 32, width: 32 }} /> */}
          </IconButton>
          <IconButton
            aria-label="next"
            onClick={() => {
              snapControl.control(group.stream_id, "next");
            }}
          >
            <SkipNextIcon />
          </IconButton>
        </Stack>
      )}

      {stream?.properties.metadata && (
        <Stack spacing={2} direction="row" alignItems="center">
          <CardMedia
            component="img"
            sx={{ width: 48 }}
            image={artUrl}
            alt={title + " cover"}
          />
          <Stack
            spacing={0}
            direction="column"
            justifyContent="center"
            sx={{ flexGrow: 1, overflow: "hidden" }}
          >
            <Typography noWrap variant="subtitle1" align="left">
              {title}
            </Typography>
            <Typography noWrap variant="body1" align="left">
              {artist}
            </Typography>
          </Stack>
        </Stack>
      )}

      {groupClients.length > 1 && (
        <>
          <div className="flex flex-row">
            <IconButton aria-label="Mute" onClick={handleMuteClicked}>
              {group.muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>

            <Slider
              aria-label="Volume"
              color="secondary"
              min={0}
              max={100}
              value={[volume]}
              onValueChange={(value) => handleVolumeChange(value[0])}
              onValueCommit={(value) => handleVolumeChangeCommitted(value[0])}
              disabled={group.muted}
            />
          </div>

          <div className="h-[1px] bg-border w-full my-8" />
        </>
      )}

      <div className="flex flex-col gap-10">{groupClients}</div>

      <ResponsiveDialog
        open={settingsOpen}
        setOpen={(newState) => !newState && handleSettingsClose(false)}
        title="Group Settings"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => handleSettingsClose(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={() => handleSettingsClose(true)}>OK</Button>
          </div>
        }
      >
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="group-name">Group Name</Label>
          <Input
            id="group-name"
            placeholder="Group Name"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
          />
        </div>

        <div className="bg-input h-[1px] w-full my-4" />

        <Label className="mb-4">Clients in Group</Label>

        <div className="flex flex-col gap-4">
          {clients.map((client) => (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={client.client.id}
                checked={client.inGroup}
                onCheckedChange={(e) =>
                  handleGroupClientChange(client.client, e as boolean)
                }
              />
              <Label htmlFor={client.client.id}>
                {client.client.getName()}
              </Label>
            </div>
          ))}
        </div>
      </ResponsiveDialog>
      {snackbar()}
    </>
  );
}

function Loading() {
  // TODO: fix weird spacing
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="!h-[60px] rounded-md" />
      <Skeleton className="!h-[100px] rounded-md" />
      <Skeleton className="!h-[100px] rounded-md" />
      <Skeleton className="!h-[100px] rounded-md" />
    </div>
  );
}

export default function GroupPage() {
  const { snapControl, server, isConnected } = useSnapcast();
  const groupId = useParams<{ groupId: string }>().groupId;

  // status_req_id will be some number when the page loads and the ws connects,
  // once we get a status response it will be -1, and a refresh will be triggered
  // by having a new server object
  if (!isConnected || snapControl.status_req_id !== -1) return <Loading />;

  const group = server.getGroup(groupId);
  if (!group)
    return (
      <div className="pt-8">
        <div className="flex mb-8 justify-between w-full">
          <Back />
        </div>

        <h2 className="text-2xl font-bold">Group not found</h2>
      </div>
    );

  return (
    <div className="pt-8">
      <Group group={group} />
    </div>
  );
}
