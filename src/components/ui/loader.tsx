import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoaderProps {
  size?: "default" | "sm" | "lg";
  className?: string;
}

export const Loader = ({
  size = "default",
  className,
}: LoaderProps) => {
  return (
    <Loader2
      className={cn(
        "animate-spin text-primary",
        size === "default" && "h-8 w-8",
        size === "sm" && "h-4 w-4",
        size === "lg" && "h-12 w-12",
        className
      )}
    />
  );
};