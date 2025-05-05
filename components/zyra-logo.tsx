import Image from "next/image"

interface ZyraLogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ZyraLogo({ size = "md", className = "" }: ZyraLogoProps) {
  const sizes = {
    sm: 24,
    md: 32,
    lg: 48,
  }

  const logoSize = sizes[size]

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image src="/logo.png" alt="Zyra Logo" width={logoSize} height={logoSize} className="object-contain" />
    </div>
  )
}
