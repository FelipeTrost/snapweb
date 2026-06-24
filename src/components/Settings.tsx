import { useState } from "react";
import { Theme, useConfig } from "../config";
import { ResponsiveDialog } from "./ResponsiveDialog.tsx";
import { Label } from "./ui/label.tsx";
import { Input } from "./ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select.tsx";
import { Checkbox } from "./ui/checkbox.tsx";
import { Button } from "./ui/button.tsx";
import { Settings } from "lucide-react";

export function SettingsDialogButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SettingsDialog open={open} onClose={setOpen} />
      <Button
        onClick={() => setOpen(true)}
        variant="ghost"
        size="icon"
        className="stroke-blue-50"
      >
        <Settings />
      </Button>
    </>
  );
}

export function SettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: (_apply: boolean) => void;
}) {
  const config = useConfig();

  const [serverurl, setServerurl] = useState(config.baseUrl);
  const [appMode, setAppMode] = useState(config.appMode);
  const [theme, setTheme] = useState(config.theme);
  const [showOffline, setShowOffline] = useState(config.showOffline);
  const [groupType, setGroupType] = useState(config.groupType);

  function handleClose(apply: boolean) {
    if (apply) {
      config.setbaseUrl(serverurl);
      config.setappMode(appMode);
      config.settheme(theme);
      config.setshowOffline(showOffline);
      config.setgroupType(groupType);
    }

    onClose(false);
  }

  return (
    <div>
      <ResponsiveDialog
        open={open}
        setOpen={onClose}
        title="Settings"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => handleClose(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={() => handleClose(true)}>OK</Button>
          </div>
        }
        verticalGaps
      >
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="host">Host</Label>
          <Input
            id="host"
            className="w-full"
            placeholder="Name"
            value={serverurl}
            onChange={(event) => {
              setServerurl(event.target.value as string);
            }}
          />
        </div>

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="grouptype">Group Type</Label>
          <Select
            id="grouptype"
            value={groupType}
            onValueChange={(groupType: string) =>
              setGroupType(groupType as "separate-page" | "flat-list")
            }
          >
            <SelectTrigger className="w-[180px] ">
              <SelectValue placeholder="Group Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="separate-page">Separate Page</SelectItem>
              <SelectItem value="flat-list">Flat List</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="theme">App Mode</Label>
          <Select
            value={appMode}
            onValueChange={(theme: string) =>
              setAppMode(theme as "group" | "stream")
            }
          >
            <SelectTrigger className="w-[180px] ">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="group">group</SelectItem>
              <SelectItem value="stream">stream</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="theme">Theme</Label>
          <Select
            value={theme}
            onValueChange={(theme: string) => setTheme(theme as Theme)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">system</SelectItem>
              <SelectItem value="dark">dark</SelectItem>
              <SelectItem value="light">light</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="showoffline"
            checked={showOffline}
            onCheckedChange={(e) => setShowOffline(e as boolean)}
          />
          <Label htmlFor="showoffline">Show offline clients</Label>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
