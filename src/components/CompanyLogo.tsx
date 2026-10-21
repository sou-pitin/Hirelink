import { getCompanyInitials, getCompanyColor } from '@/lib/utils';

interface CompanyLogoProps {
  name: string;
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function CompanyLogo({ name, logoUrl, size = 'md' }: CompanyLogoProps) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-20 w-20 text-2xl',
  };

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={`${sizes[size]} rounded-xl object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} ${getCompanyColor(name)} rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0`}
    >
      {getCompanyInitials(name)}
    </div>
  );
}
