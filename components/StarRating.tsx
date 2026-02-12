import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StarRating: React.FC<StarRatingProps> = ({
  value = 0,
  onChange,
  readonly = false,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSize = sizeClasses[size];
  const isInteractive = !readonly && onChange;

  const handleClick = (rating: number) => {
    if (isInteractive && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= Math.round(value);

        return (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            disabled={!isInteractive}
            className={`${
              isInteractive
                ? 'cursor-pointer hover:scale-110 transition-transform'
                : 'cursor-default'
            } focus:outline-none`}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              className={`${iconSize} ${
                isFilled
                  ? 'fill-orange-500 text-orange-500'
                  : 'text-slate-300'
              } ${isInteractive && 'hover:fill-orange-400 hover:text-orange-400'}`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
