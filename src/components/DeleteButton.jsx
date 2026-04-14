import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";

export default function DeleteButton({ onDelete, label = "Sil", size = "sm" }) {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    await onDelete();
    setOpen(false);
  };

  return (
    <>
      <Button
        size={size}
        variant="ghost"
        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Silmək istədiyinizə əminsiniz?</DialogTitle>
            <DialogDescription>
              Bu əməliyyat geri qaytarıla bilməz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Ləğv et</Button>
            <Button variant="destructive" onClick={handleConfirm}>Sil</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}