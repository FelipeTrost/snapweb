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
import { config } from "../config";
import { Button } from "./ui/button";
import { Speaker } from "lucide-react";

export function AssignmentClient({ client }: { client: Snapcast.Client }) {
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
      className="touch-none bg-primary-foreground py-2"
      {...listeners}
      {...attributes}
    >
      <CardContent className="flex justify-center px-2 text-center">
        <div className="flex items-center gap-2 overflow-hidden">
          <Speaker />
          <span className="truncate">{client.getName()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function AssignmentGroup({ group }: { group: Snapcast.Group }) {
  function getClients(): Snapcast.Client[] {
    const clients = [];
    for (const client of group.clients) {
      if (client.connected || config.showOffline) {
        clients.push(client);
      }
    }
    return clients;
  }

  const {
    handleVolumeChangeCommitted,
    handleVolumeChange,
    volume,
    handleMuteClicked,
  } = useGroupValueChange(group, getClients);
  const navigate = useLocation()[1];
  const { isOver, setNodeRef } = useDroppable({
    id: group.id,
  });

  const clients = getClients();
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

export function Assignment({
  server,
  snapControl,
}: {
  server: Snapcast.Server;
  snapControl: SnapControl;
}) {
  function onDragEnd(event: DragEndEvent) {
    const groupId = event.over?.id as string;
    const clientId = event.active.id as string;

    function getClients(group: Snapcast.Group) {
      const clients = [];
      for (const client of group.clients) {
        if (client.connected || config.showOffline) {
          clients.push(client);
        }
      }
      return clients;
    }

    // TODO: clean this up, I don't like this
    let group = server.getGroup(groupId);
    let newClients: string[] = [];

    if (group) {
      newClients = group.clients.map((client) => client.id).concat([clientId]);
    } else {
      group = server.getClientGroup(clientId);
      if (!group) throw new Error(`Client ${clientId} not found in any group`);
      const clients = getClients(group);
      newClients = clients
        .map((client) => client.id)
        .filter((id) => id !== clientId);
    }

    // Don't "delete" groups
    if (newClients.length !== 0) snapControl.setClients(group.id!, newClients);
  }

  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="flex flex-col gap-3">
        {server.groups.map((group) => (
          <AssignmentGroup key={group.id} group={group} />
        ))}
      </div>
    </DndContext>
  );
}
