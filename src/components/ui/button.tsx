import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // ── Base ──────────────────────────────────────────────────────────────────
  "group/button relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold whitespace-nowrap select-none outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-fire/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary — fire→gold gradient, dark text, glow on hover
        default: [
          "bg-gradient-to-r from-fire to-gold text-[#1A0800] font-bold tracking-tight",
          "shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,_0_2px_8px_rgba(229,90,58,0.25)]",
          "hover:shadow-[0_0_0_1px_rgba(229,90,58,0.35),_0_4px_24px_rgba(229,90,58,0.45)]",
          "hover:brightness-110",
        ],
        // Outline — subtle border, fires up on hover
        outline: [
          "border border-white/10 bg-transparent text-cream",
          "hover:border-fire/50 hover:bg-fire/5 hover:text-cream",
          "hover:shadow-[0_0_0_1px_rgba(229,90,58,0.2)]",
        ],
        // Secondary — dark raised surface
        secondary: [
          "bg-white/[0.06] text-cream border border-white/[0.06]",
          "hover:bg-white/[0.10] hover:border-white/[0.12]",
        ],
        // Ghost — invisible until hover
        ghost: [
          "text-muted-foreground",
          "hover:bg-white/[0.05] hover:text-cream",
        ],
        // Destructive
        destructive: [
          "bg-fire/10 text-fire border border-fire/20",
          "hover:bg-fire/20 hover:border-fire/40",
        ],
        // Link
        link: "text-fire underline-offset-4 hover:underline h-auto p-0 shadow-none",
      },
      size: {
        default: "h-9 px-4 py-2",
        xs:      "h-6 px-2 text-xs rounded-md gap-1",
        sm:      "h-7 px-3 text-[0.8rem] rounded-md",
        lg:      "h-11 px-6 text-base rounded-xl gap-2",
        xl:      "h-13 px-8 text-lg rounded-xl gap-2.5 font-bold",
        icon:       "size-9",
        "icon-xs":  "size-6 rounded-md",
        "icon-sm":  "size-7 rounded-md",
        "icon-lg":  "size-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
