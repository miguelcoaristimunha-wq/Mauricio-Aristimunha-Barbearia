
import React from 'react';

interface PremiumButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  fullWidth = true,
  disabled = false,
  icon,
  type = 'submit'
}) => {
  const baseStyles = "relative flex items-center justify-center gap-2 px-6 py-4 font-bold text-sm uppercase tracking-widest transition-all duration-300 rounded-premium disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const variants = {
    primary: "bg-gold text-premium-black shadow-gold-glow hover:brightness-110 hover:shadow-gold-glow-strong",
    secondary: "bg-premium-gray dark:bg-gray-800 text-white hover:bg-premium-charcoal",
    outline: "bg-transparent border border-gold text-gold hover:bg-gold hover:text-premium-black"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {icon && <span className="material-icons-round text-xl">{icon}</span>}
      {children}
    </button>
  );
};
