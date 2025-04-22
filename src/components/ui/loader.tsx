import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const Loader = (({ className }: { className?: string }) => (
    <Loader2
        className={cn("h-6 w-6 animate-spin text-primary", className)}
    />
))

export { Loader }