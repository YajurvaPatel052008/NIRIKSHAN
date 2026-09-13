export default function BrandLogo({ className = "h-8 w-auto", alt = "NIRIKSHAN logo" }) {
  return (
    <img
      src="/Firefly.png"
      alt={alt}
      className={`object-contain ${className}`}
    />
  );
}
