import Image from "next/image"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  withText?: boolean
  className?: string
}

export function Logo({ size = "md", withText = false, className = "" }: LogoProps) {
  const sizes = {
    sm: 24,
    md: 32,
    lg: 48,
  }

  const logoSize = sizes[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image src="/logo.png" alt="Zyra Logo" width={logoSize} height={logoSize} className="object-contain" />
      {withText && <span className="font-heading text-xl font-bold tracking-tight">Zyra</span>}
    </div>
  )
}
