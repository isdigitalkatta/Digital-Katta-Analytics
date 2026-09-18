import React from 'react';
import { DigitalKattaBrandLogo } from './DigitalKattaBrandLogo';

interface CompanyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero' | 'sidebar';
  showTagline?: boolean;
  className?: string;
  variant?: 'light' | 'dark' | 'transparent';
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  size = 'md',
  showTagline = true,
  className = '',
  variant = 'transparent',
}) => {
  const mappedSize = size === 'hero' ? 'xl' : size === 'sidebar' ? 'sm' : size;
  return (
    <DigitalKattaBrandLogo
      size={mappedSize}
      showTagline={showTagline}
      className={className}
      framed={variant !== 'transparent'}
      variant={variant}
    />
  );
};

