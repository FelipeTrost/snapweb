import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/src/components/ui/drawer";
import { useMediaQuery } from "@/src/hooks";
import { cn } from "../utils";

type DrawerProps = {
  open: boolean;
  setOpen: (_: boolean) => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  verticalGaps?: boolean;
};

export function ResponsiveDialog({
  open,
  setOpen,
  children,
  title,
  footer,
  verticalGaps,
}: DrawerProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="h-max">
          {title && (
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
          )}

          <div
            className={cn("max-h-[60vh] h-max overflow-y-auto py-[1px]", {
              ["flex flex-col gap-4"]: verticalGaps,
            })}
          >
            {children}
          </div>

          {footer && (
            <DialogFooter className="sticky bottom-0">{footer}</DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="max-h-[80vh]">
        {title && (
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
        )}

        <div
          className={cn("p-4 overflow-y-auto", {
            ["flex flex-col gap-4"]: verticalGaps,
          })}
        >
          {children}
        </div>
        {footer && <DrawerFooter className="pt-2">{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  );
}
