import { Tools, ToolsType } from "../../types";

import { LuPencil } from "react-icons/lu";
import { FiMinus, FiMousePointer, FiSquare } from "react-icons/fi";
import { IoHandRightOutline, IoText } from "react-icons/io5";

type ActionBarProps = {
  tool: ToolsType;
  setTool: (tool: ToolsType) => void;
};

export function ActionBar({ tool, setTool }: ActionBarProps) {
  return (
    <div className="fixed top-[70px] z-2 p-2.5 bg-[var(--primary-bg-color)] left-1/2 flex gap-5 justify-center transform -translate-x-1/2 border border-[var(--border-color)] rounded-[10px] shadow-md">
      {Object.values(Tools).map((t, index) => (
        <div
          className={`relative cursor-pointer rounded-md border border-transparent p-2.5 bg-[var(--primary-bg-color)] transition-colors duration-300 hover:bg-[var(--secondary-bg-color)] ${
            tool === t ? "bg-[var(--selected-bg-color)]" : ""
          }`}
          key={t}
          onClick={() => setTool(t)}
        >
          <input
            type="radio"
            id={t}
            checked={tool === t}
            onChange={() => setTool(t)}
            className="cursor-pointer w-5 h-5 absolute opacity-0"
            readOnly
          />
          <label 
            htmlFor={t}
            className="cursor-pointer absolute w-px h-px p-0 -m-px overflow-hidden clip-rect-0 whitespace-nowrap border-0"
          >
            {t}
          </label>
          {t === "pan" && <IoHandRightOutline className={`w-[25px] h-[25px] cursor-pointer flex text-[var(--primary-text-color)] transition-colors duration-300 ${tool === t ? "text-[var(--highlight-color)]" : ""}`} />}
          {t === "selection" && <FiMousePointer className={`w-[25px] h-[25px] cursor-pointer flex text-[var(--primary-text-color)] transition-colors duration-300 ${tool === t ? "text-[var(--highlight-color)]" : ""}`} />}
          {t === "rectangle" && <FiSquare className={`w-[25px] h-[25px] cursor-pointer flex text-[var(--primary-text-color)] transition-colors duration-300 ${tool === t ? "text-[var(--highlight-color)]" : ""}`} />}
          {t === "line" && <FiMinus className={`w-[25px] h-[25px] cursor-pointer flex text-[var(--primary-text-color)] transition-colors duration-300 ${tool === t ? "text-[var(--highlight-color)]" : ""}`} />}
          {t === "pencil" && <LuPencil className={`w-[25px] h-[25px] cursor-pointer flex text-[var(--primary-text-color)] transition-colors duration-300 ${tool === t ? "text-[var(--highlight-color)]" : ""}`} />}
          {t === "text" && <IoText className={`w-[25px] h-[25px] cursor-pointer flex text-[var(--primary-text-color)] transition-colors duration-300 ${tool === t ? "text-[var(--highlight-color)]" : ""}`} />}
          <span className={`absolute bottom-0 right-[3px] text-[0.7em] text-[var(--secondary-text-color)] ${tool === t ? "text-[var(--highlight-color)]" : ""}`}>
            {index + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
