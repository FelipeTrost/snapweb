import { useSnapcast } from "../use-snapcast";
import { useConfig, config } from "../config";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { Snapcast, SnapControl } from "@/src/snapcontrol";
import { cn } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Link, useLocation } from "wouter";
import {
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
} from "@mui/icons-material";
import { Slider } from "./ui/slider";
import { useGroupValueChange } from "../volume-utils";
import { Button } from "./ui/button";
import { Speaker, WifiOff } from "lucide-react";
import { OnDevicePlayerControl } from "./OnDevicePlayerControl";
import { SettingsDialogButton } from "./Settings";

function AssignmentClient({ client }: { client: Snapcast.Client }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: client.id,
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn("touch-none bg-primary-foreground py-2", {
        ["bg-accent"]: !client.connected,
      })}
      {...listeners}
      {...attributes}
    >
      <CardContent className="flex justify-center px-2 text-center">
        <div className="flex items-center gap-2 overflow-hidden">
          {client.connected ? <Speaker /> : <WifiOff />}
          <span className="truncate">{client.getName()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function AssignmentGroup({ group }: { group: Snapcast.Group }) {
  const config = useConfig();

  const clients = [];
  for (const client of group.clients) {
    if (client.connected || config.showOffline) {
      clients.push(client);
    }
  }

  const {
    handleVolumeChangeCommitted,
    handleVolumeChange,
    volume,
    handleMuteClicked,
  } = useGroupValueChange(group, clients);
  const navigate = useLocation()[1];
  const { isOver, setNodeRef } = useDroppable({
    id: group.id,
  });

  if (clients.length === 0) return null;

  return (
    <Card
      onClick={() => navigate(`/${group.id}`)}
      ref={setNodeRef}
      className={cn([{ "bg-gray-200": isOver }])}
    >
      {group.name && (
        <CardHeader>
          <Link to={`/${group.id}`}>
            <CardTitle className="text-xl">{group.name}</CardTitle>
          </Link>
        </CardHeader>
      )}
      <CardContent>
        <div className="flex flex-row mb-4 items-center">
          <Button
            aria-label="Mute"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              handleMuteClicked();
              // Prevent navigating to group when muting
              e.stopPropagation();
            }}
          >
            {group.muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </Button>

          <Slider
            aria-label="Volume"
            color="secondary"
            min={0}
            max={100}
            value={[volume]}
            onValueChange={(value) => handleVolumeChange(value[0])}
            onValueCommit={(value) => handleVolumeChangeCommitted(value[0])}
            disabled={group.muted}
            // Avoid navigating to group when slider is used
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <h1 className="font-bold mb-2">Speakers</h1>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {clients.map((client) => (
            <AssignmentClient key={client.id} client={client} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AssignmentSource({ stream }: { stream: Snapcast.Stream }) {
  const { server } = useSnapcast();
  const config = useConfig();

  const clients = [];
  for (const group of server.groups) {
    if (group.stream_id !== stream.id) continue;
    for (const client of group.clients) {
      if (client.connected || config.showOffline) {
        clients.push(client);
      }
    }
  }

  const {
    handleVolumeChangeCommitted,
    handleVolumeChange,
    volume,
    handleMuteClicked,
    muted,
  } = useGroupValueChange(undefined, clients);

  const navigate = useLocation()[1];
  const { isOver, setNodeRef } = useDroppable({
    id: stream.id,
  });

  return (
    <Card
      onClick={() => navigate(`/g/${stream.id}`)}
      ref={setNodeRef}
      className={cn([{ "bg-gray-200": isOver }])}
    >
      {stream.id && (
        <CardHeader>
          <Link to={`/g/${stream.id}`}>
            <CardTitle className="text-xl">{stream.id}</CardTitle>
          </Link>
        </CardHeader>
      )}

      <CardContent>
        {clients.length > 0 && (
          <div className="flex flex-row mb-4 items-center">
            <Button
              aria-label="Mute"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                handleMuteClicked();
                // Prevent navigating to group when muting
                e.stopPropagation();
              }}
            >
              {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </Button>

            <Slider
              aria-label="Volume"
              color="secondary"
              min={0}
              max={100}
              value={[volume]}
              onValueChange={(value) => handleVolumeChange(value[0])}
              onValueCommit={(value) => handleVolumeChangeCommitted(value[0])}
              disabled={muted}
              // Avoid navigating to group when slider is used
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <h1 className="font-bold mb-2">Speakers</h1>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {clients.map((client) => (
            <AssignmentClient key={client.id} client={client} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function moveClientToStream(
  server: Snapcast.Server,
  snapControl: SnapControl,
  clientId: string,
  streamId: string,
) {
  const stream = server.getStream(streamId);
  const client = server.getClient(clientId);
  const clientCurrentGroup = server.getClientGroup(clientId);

  if (!client || !stream || !clientCurrentGroup) {
    console.error("Client or stream not found");
    return;
  }

  if (clientCurrentGroup.stream_id === streamId) return;

  // Find group with the stream already set
  for (const group of server.groups) {
    if (group.stream_id === streamId) {
      const newClients = group.clients
        .map((client) => client.id)
        .concat(clientId);
      snapControl.setClients(group.id, newClients);
      return;
    }
  }

  // remove client from current group
  const reqId = snapControl.setClients(
    clientCurrentGroup.id,
    clientCurrentGroup.clients
      .map((client) => client.id)
      .filter((id) => id !== clientId),
  );

  let timeout: NodeJS.Timeout | null = null;
  function callback(json_msg: any) {
    if (!("id" in json_msg) || json_msg.id !== reqId) return;

    const newClientGroup = snapControl.server.getClientGroup(clientId);
    if (!newClientGroup) {
      console.error(
        "Error, client was removed from a group and was not added to a new one",
      );
    } else {
      snapControl.setStream(newClientGroup.id, streamId);
    }

    snapControl.removeResponseCallback(callback);
    if (timeout) clearTimeout(timeout);
  }

  snapControl.addResponseCallback(callback);

  timeout = setTimeout(() => snapControl.removeResponseCallback(callback), 500);
}

function moveClientToGroup(
  server: Snapcast.Server,
  snapControl: SnapControl,
  clientId: string,
  groupId: string,
) {
  let group = server.getGroup(groupId);
  let newClients: string[] = [];

  if (group) {
    newClients = group.clients.map((client) => client.id).concat([clientId]);
  } else {
    group = server.getClientGroup(clientId);
    if (!group) throw new Error(`Client ${clientId} not found in any group`);

    for (const client of group.clients) {
      if (client.id === clientId) continue;
      if (client.connected || config.showOffline) {
        newClients.push(client.id);
      }
    }
  }

  // Don't "delete" groups
  if (newClients.length !== 0) snapControl.setClients(group.id!, newClients);
}

function Assignment({
  server,
  snapControl,
}: {
  server: Snapcast.Server;
  snapControl: SnapControl;
}) {
  const config = useConfig();

  function onDragEnd(event: DragEndEvent) {
    const intoId = event.over?.id as string;
    const clientId = event.active.id as string;

    const move =
      config.appMode === "group" ? moveClientToGroup : moveClientToStream;
    move(server, snapControl, clientId, intoId);
  }

  let assignment;
  if (config.appMode === "group") {
    assignment = server.groups.map((group) => (
      <AssignmentGroup key={group.id} group={group} />
    ));
  } else {
    assignment = server.streams.map((stream) => (
      <AssignmentSource key={stream.id} stream={stream} />
    ));
  }

  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="flex flex-col gap-3">{assignment}</div>
    </DndContext>
  );
}

export default function SnapWeb() {
  const config = useConfig();
  const { snapControl, isConnected, server, connectError } = useSnapcast();

  return (
    <div className="relative">
      <div className="flex justify-center py-2">
        <OnDevicePlayerControl />
        <SettingsDialogButton />
      </div>
      {/* TODO: app bar with about and config */}
      <Assignment server={server} snapControl={snapControl} />

      {!isConnected && (
        <div className="fixed w-max left-1/2 transform -translate-x-1/2 bottom-4">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {connectError + "\nSnapserver host: " + config.baseUrl}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* TODO: About dialog */}
    </div>
  );
}
