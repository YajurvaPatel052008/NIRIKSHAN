export default function BrandLogo({ className = "h-8 w-8", alt = "NIRIKSHAN logo" }) {
  return (
    <img
      src="/Firefly.png"
      alt={alt}
      className={`object-contain ${className}`}
    />
  );
}
