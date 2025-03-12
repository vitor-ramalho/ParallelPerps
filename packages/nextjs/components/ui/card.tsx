interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className = "", ...props }: CardProps) {
  return <div className={`card bg-base-100 shadow-xl ${className}`} {...props} />;
}
