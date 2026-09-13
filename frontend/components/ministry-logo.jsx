export default function MinistryLogo({ className = "h-10 w-auto" }) {
  return (
    <img
      src="/dcoa.jpeg"
      alt="Department of Consumer Affairs"
      className={`object-contain ${className}`}
    />
  );
}
