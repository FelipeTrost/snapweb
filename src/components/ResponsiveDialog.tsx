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

type DrawerProps = {
  open: boolean;
  setOpen: (_: boolean) => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  footer?: React.ReactNode;
};

export function ResponsiveDialog({
  open,
  setOpen,
  children,
  title,
  footer,
}: DrawerProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="">
          {title && (
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
          )}
          <div className="max-h-[60vh] overflow-y-auto">{children}</div>
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
        <div className="p-4 overflow-y-auto">{children}</div>
        {footer && <DrawerFooter className="pt-2">{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  );
}
