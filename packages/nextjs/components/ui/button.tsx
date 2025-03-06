interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({ className = "", variant = "primary", size = "md", ...props }: ButtonProps) {
  const baseStyles = "btn rounded-full font-semibold transition-colors disabled:opacity-50";
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
  };
  const sizes = {
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg",
  };

  return <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
