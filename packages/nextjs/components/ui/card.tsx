export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`card bg-base-100 shadow-xl ${className}`} {...props} />;
}
