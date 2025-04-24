import { BsQuestionCircle } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

export function Info() {
  const [open, setOpen] = useState(false);

  return (
    <div className="z-10 absolute top-5 right-5">
      <Button 
        variant="ghost"
        size="icon"
        aria-label="Open information dialog"
        onClick={() => setOpen(true)}
        className="bg-primary text-primary-bg hover:bg-primary/80 transition-colors rounded-lg p-2.5"
      >
        <BsQuestionCircle className="h-4 w-4 text-primary-bg" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader className="bg-primary text-primary-bg text-center">
            <DialogTitle className="text-xl">How to Use WhiteBoard</DialogTitle>
          </DialogHeader>
          <div className="p-5 max-w-[500px] leading-relaxed text-primary-text">
            <p className="font-bold">Welcome to WhiteBoard! Get started with these simple steps:</p>
            <ul className="list-none my-2.5 mb-5">
              <li className="mb-2.5">
                <strong className="text-primary font-bold">Choose a Tool:</strong> Select from pencil, line,
                rectangle, or text tools to start drawing.
              </li>
              <li className="mb-2.5">
                <strong className="text-primary font-bold">Draw & Move:</strong> Click and drag on the canvas to
                draw. Select an element and drag to move.
              </li>
              <li className="mb-2.5">
                <strong className="text-primary font-bold">Edit Text:</strong> Select the text tool and click on the
                canvas to start typing.
              </li>
              <li className="mb-2.5">
                <strong className="text-primary font-bold">Zoom:</strong> Use Ctrl + Scroll to zoom in and out of the
                canvas.
              </li>
              <li className="mb-2.5">
                <strong className="text-primary font-bold">Pan:</strong> Hold Space and drag to move around the
                canvas, or hold the middle mouse button.
              </li>
            </ul>
            <p className="font-bold">Keyboard Shortcuts:</p>
            <ul className="list-none my-2.5 mb-5">
              <li className="mb-2.5">
                <strong className="text-primary font-bold">Undo:</strong> Ctrl + Z
              </li>
              <li className="mb-2.5">
                <strong className="text-primary font-bold">Redo:</strong> Ctrl + Y or Ctrl + Shift + Z
              </li>
              <li className="mb-2.5">
                <strong className="text-primary font-bold">Zoom In:</strong> Ctrl + Plus
              </li>
              <li className="mb-2.5">
                <strong className="text-primary font-bold">Zoom Out:</strong> Ctrl + Minus
              </li>
            </ul>
            <p className="font-bold">Enjoy creating your masterpiece!</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
