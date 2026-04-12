import { Warning } from "@phosphor-icons/react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "~/components/ui/dialog";

interface KillSwitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function KillSwitchDialog({
  open,
  onOpenChange,
  onConfirm,
}: KillSwitchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="rounded-2xl">
        <DialogHeader>
          <div className="mx-auto p-3 rounded-full bg-destructive/10 text-destructive mb-2">
            <Warning weight="fill" className="w-8 h-8" />
          </div>
          <DialogTitle className="text-center text-base">
            Emergency Kill Switch
          </DialogTitle>
          <DialogDescription className="text-center">
            This will immediately revoke all agent approvals, reset your daily
            limit to 0, and deactivate the guard. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="flex-1 rounded-xl">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="flex-1 rounded-xl font-bold"
          >
            Confirm Kill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface KillSwitchButtonProps {
  onClick: () => void;
}

export function KillSwitchButton({ onClick }: KillSwitchButtonProps) {
  return (
    <Button
      variant="destructive"
      onClick={onClick}
      className="w-full py-5 rounded-2xl text-base font-bold"
    >
      <Warning weight="fill" className="w-5 h-5 mr-2" />
      Emergency Kill Switch
    </Button>
  );
}
