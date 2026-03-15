import Image from "next/image";

type LogoSize = "small" | "medium" | "large";
type LogoVariant = "main" | "alt";

interface LogoProps {
  className?: string;
  size?: LogoSize;
  variant?: LogoVariant;
}

export default function Logo({
  className = "",
  size = "medium",
  variant = "main",
}: LogoProps) {
  const sizeMap = {
    small: 32,
    medium: 64,
    large: 170,
  };

  const logoSrcMap = {
    main: "/Images/Logo.png",
    alt: "/Images/Logo1.png",
  };

  const dimension = sizeMap[size];

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image
        src={logoSrcMap[variant]}
        alt="Logo"
        width={dimension}
        height={dimension}
        priority
      />
    </div>
  );
}