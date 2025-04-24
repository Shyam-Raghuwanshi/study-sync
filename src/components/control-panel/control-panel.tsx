import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { PiMinus, PiPlus } from "react-icons/pi";
import {
  HiOutlineArrowUturnLeft,
  HiOutlineArrowUturnRight,
} from "react-icons/hi2";

type ControlPanelProps = {
  undo: () => void;
  redo: () => void;
  onZoom: (scale: number) => void;
  scale: number;
  setScale: (scale: number) => void;
};

export function ControlPanel({
  undo,
  redo,
  onZoom,
  scale,
  setScale,
}: ControlPanelProps) {
  return (
    <>
      <div className="w-[300px] flex gap-5 fixed z-[2] bottom-5 left-5">
        <div className="rounded-lg flex bg-[var(--panel-bg-color)]">
          <Tippy content="Zoom Out">
            <button 
              onClick={() => onZoom(-0.1)} 
              aria-label="Zoom Out"
              className="border-none text-[#27272c] text-[0.9em] bg-transparent p-[10px_15px] rounded-l-lg hover:bg-[var(--hover-bg-color)]"
            >
              <PiMinus className="w-5 h-5 text-[#27272c]" />
            </button>
          </Tippy>
          <Tippy content={`Set scale to 100%`}>
            <button
              onClick={() => setScale(1)}
              aria-label={`Set scale to 100%`}
              className="border-none text-[#27272c] text-[0.9em] bg-transparent p-[10px_15px] hover:bg-[var(--hover-bg-color)]"
            >
              {new Intl.NumberFormat("en-GB", { style: "percent" }).format(
                scale
              )}
            </button>
          </Tippy>
          <Tippy content="Zoom In">
            <button 
              onClick={() => onZoom(0.1)} 
              aria-label="Zoom In"
              className="border-none text-[#27272c] text-[0.9em] bg-transparent p-[10px_15px] rounded-r-lg hover:bg-[var(--hover-bg-color)]"
            >
              <PiPlus className="w-5 h-5 text-[#27272c]" />
            </button>
          </Tippy>
        </div>

        <div className="rounded-lg flex bg-[var(--panel-bg-color)]">
          <Tippy content="Undo last action">
            <button 
              onClick={undo} 
              aria-label="Undo last action"
              className="border-none text-[#27272c] text-[0.9em] bg-transparent p-[10px_15px] rounded-l-lg hover:bg-[var(--hover-bg-color)]"
            >
              <HiOutlineArrowUturnLeft className="w-5 h-5 text-[#27272c]" />
            </button>
          </Tippy>
          <Tippy content="Redo last action">
            <button 
              onClick={redo} 
              aria-label="Redo last action"
              className="border-none text-[#27272c] text-[0.9em] bg-transparent p-[10px_15px] rounded-r-lg hover:bg-[var(--hover-bg-color)]"
            >
              <HiOutlineArrowUturnRight className="w-5 h-5 text-[#27272c]" />
            </button>
          </Tippy>
        </div>
      </div>
    </>
  );
}