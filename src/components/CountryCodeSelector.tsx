import React, { useState, useCallback } from 'react';
import { FiChevronDown } from 'react-icons/fi';

interface CountryCode {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', dialCode: '+43' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', dialCode: '+47' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', dialCode: '+45' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', dialCode: '+358' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', dialCode: '+48' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', dialCode: '+420' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', dialCode: '+36' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', dialCode: '+40' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', dialCode: '+359' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', dialCode: '+385' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', dialCode: '+386' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', dialCode: '+421' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', dialCode: '+372' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', dialCode: '+371' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', dialCode: '+370' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', dialCode: '+353' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', dialCode: '+30' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', dialCode: '+357' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', dialCode: '+356' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', dialCode: '+352' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82' },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', dialCode: '+852' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', dialCode: '+886' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', dialCode: '+51' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', dialCode: '+58' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', dialCode: '+212' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', dialCode: '+216' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', dialCode: '+213' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', dialCode: '+972' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', dialCode: '+7' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', dialCode: '+380' },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾', dialCode: '+375' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', dialCode: '+7' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', dialCode: '+998' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯', dialCode: '+679' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', dialCode: '+94' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', dialCode: '+977' },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹', dialCode: '+975' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻', dialCode: '+960' },
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', dialCode: '+93' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷', dialCode: '+98' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶', dialCode: '+964' },
  { code: 'SY', name: 'Syria', flag: '🇸🇾', dialCode: '+963' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', dialCode: '+961' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', dialCode: '+962' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', dialCode: '+965' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', dialCode: '+974' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', dialCode: '+973' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', dialCode: '+968' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪', dialCode: '+967' },
];

interface CountryCodeSelectorProps {
  selectedCountry: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  disabled?: boolean;
}

const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
  selectedCountry,
  onCountryChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCountrySelect = useCallback((country: CountryCode) => {
    onCountryChange(country);
    setIsOpen(false);
  }, [onCountryChange]);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen(prev => !prev);
    }
  }, [disabled]);

  return (
    <div style={{ position: 'relative', display: 'inline-block', minWidth: '200px' }}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '0.75rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          backgroundColor: disabled ? '#f9fafb' : '#ffffff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.875rem',
          color: disabled ? '#9ca3af' : '#374151',
          transition: 'all 0.2s ease',
          height: '48px', // Explicit height to match phone number input
          boxSizing: 'border-box',
          ...(disabled ? {} : {
            '&:hover': {
              borderColor: '#9ca3af'
            }
          })
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>{selectedCountry.flag}</span>
          <span style={{ fontWeight: '500' }}>{selectedCountry.dialCode}</span>
          <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>
            {selectedCountry.code}
          </span>
        </div>
        <FiChevronDown 
          size={16} 
          style={{ 
            color: '#6b7280',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10
            }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              zIndex: 20,
              maxHeight: '300px',
              overflowY: 'auto',
              marginTop: '0.25rem'
            }}
          >
            {COUNTRY_CODES.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleCountrySelect(country)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.875rem',
                  color: '#374151',
                  textAlign: 'left',
                  transition: 'background-color 0.2s ease',
                  ...(selectedCountry.code === country.code ? {
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8'
                  } : {
                    '&:hover': {
                      backgroundColor: '#f9fafb'
                    }
                  })
                }}
              >
                <span style={{ fontSize: '1.25rem', minWidth: '1.5rem' }}>
                  {country.flag}
                </span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: '500' }}>{country.name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {country.dialCode}
                  </span>
                </div>
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: '#9ca3af',
                  fontWeight: '500'
                }}>
                  {country.code}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CountryCodeSelector;
export type { CountryCode };
