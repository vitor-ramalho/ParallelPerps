interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  maxValue?: string | number;
  onPercentageClick?: (percentage: number) => void;
  showPercentages?: boolean;
}

export function Input({ className = "", maxValue, onPercentageClick, showPercentages = false, ...props }: InputProps) {
  return (
    <div className="w-full space-y-2">
      {showPercentages && (
        <div className="flex gap-2 justify-end">
          {[25, 50, 100].map(percentage => (
            <button
              key={percentage}
              onClick={() => onPercentageClick?.(percentage)}
              className="px-2 py-1 text-xs rounded-lg hover:bg-primary hover:text-white transition-colors"
            >
              {percentage}%
            </button>
          ))}
        </div>
      )}
      <input
        className={`
            input input-bordered w-full bg-transparent
            focus:outline-none focus:ring-2 focus:ring-primary
            [&::-webkit-outer-spin-button]:appearance-none 
            [&::-webkit-inner-spin-button]:appearance-none
            ${className}
          `}
        {...props}
      />
    </div>
  );
}
