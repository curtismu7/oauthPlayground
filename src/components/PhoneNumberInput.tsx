import React, { useCallback, useEffect, useState } from 'react';
import CountryCodeSelector, { type CountryCode } from './CountryCodeSelector';

interface PhoneNumberInputProps {
	value: string;
	onChange: (fullPhoneNumber: string, countryCode: string, phoneNumber: string) => void;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
	label?: string;
	helpText?: string;
	autoConcatenate?: boolean; // If false, don't automatically concatenate country code during typing
	onCountryCodeChange?: (countryCode: string) => void; // Callback to get the selected country code
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
	value,
	onChange,
	placeholder = 'Enter phone number',
	disabled = false,
	required = false,
	label = 'Phone Number',
	helpText,
	autoConcatenate = true,
	onCountryCodeChange,
}) => {
	const [selectedCountry, setSelectedCountry] = useState<CountryCode>({
		code: 'US',
		name: 'United States',
		flag: '🇺🇸',
		dialCode: '+1',
	});

	const [phoneNumber, setPhoneNumber] = useState('');

	// Notify parent of initial country code
	useEffect(() => {
		if (onCountryCodeChange) {
			onCountryCodeChange(selectedCountry.dialCode);
		}
	}, [onCountryCodeChange, selectedCountry.dialCode]);

	// Parse existing value to extract country code and phone number
	useEffect(() => {
		if (value) {
			// Try to find a matching country code at the beginning of the value
			const countryCodeMatch = value.match(/^(\+\d{1,4})/);
			if (countryCodeMatch) {
				const dialCode = countryCodeMatch[1];
				const country = COUNTRY_CODES.find((c) => c.dialCode === dialCode);
				if (country) {
					setSelectedCountry(country);
					setPhoneNumber(value.substring(dialCode.length).trim());
				} else {
					// If no country found, assume it's just a phone number
					setPhoneNumber(value);
				}
			} else {
				setPhoneNumber(value);
			}
		}
	}, [value]);

	const handleCountryChange = useCallback(
		(country: CountryCode) => {
			setSelectedCountry(country);

			// Notify parent component of country code change
			if (onCountryCodeChange) {
				onCountryCodeChange(country.dialCode);
			}

			if (autoConcatenate) {
				// Automatically concatenate country code (default behavior)
				const fullNumber = country.dialCode + phoneNumber;
				onChange(fullNumber, country.dialCode, phoneNumber);
			} else {
				// Don't concatenate - just pass the phone number as-is
				onChange(phoneNumber, country.dialCode, phoneNumber);
			}
		},
		[phoneNumber, onChange, autoConcatenate, onCountryCodeChange]
	);

	const handlePhoneNumberChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newPhoneNumber = e.target.value;
			setPhoneNumber(newPhoneNumber);

			if (autoConcatenate) {
				// Automatically concatenate country code (default behavior)
				const fullNumber = selectedCountry.dialCode + newPhoneNumber;
				onChange(fullNumber, selectedCountry.dialCode, newPhoneNumber);
			} else {
				// Don't concatenate - just pass the phone number as-is
				onChange(newPhoneNumber, selectedCountry.dialCode, newPhoneNumber);
			}
		},
		[selectedCountry.dialCode, onChange, autoConcatenate]
	);

	// Format phone number for display (basic formatting)
	const formatPhoneNumber = (phone: string) => {
		// Remove all non-digits
		const digits = phone.replace(/\D/g, '');

		// Basic formatting for US/Canada numbers
		if (selectedCountry.code === 'US' || selectedCountry.code === 'CA') {
			if (digits.length >= 6) {
				return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
			} else if (digits.length >= 3) {
				return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
			} else if (digits.length > 0) {
				return `(${digits}`;
			}
		}

		// For other countries, just return the digits
		return digits;
	};

	const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

	return (
		<div>
			{label && (
				<label
					style={{
						display: 'block',
						marginBottom: '0.5rem',
						fontWeight: 500,
						color: 'V9_COLORS.TEXT.GRAY_DARK',
						fontSize: '0.875rem',
					}}
				>
					{label}
					{required && (
						<span style={{ color: 'V9_COLORS.PRIMARY.RED', marginLeft: '0.25rem' }}>*</span>
					)}
				</label>
			)}

			<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
				{/* Country Code Selector */}
				<div style={{ flex: '0 0 auto' }}>
					<CountryCodeSelector
						selectedCountry={selectedCountry}
						onCountryChange={handleCountryChange}
						disabled={disabled}
					/>
				</div>

				{/* Phone Number Input */}
				<div style={{ flex: 1 }}>
					<input
						type="tel"
						value={formattedPhoneNumber}
						onChange={handlePhoneNumberChange}
						placeholder={placeholder}
						disabled={disabled}
						required={required}
						style={{
							width: '100%',
							padding: '0.75rem',
							border: '1px solid V9_COLORS.TEXT.GRAY_LIGHTER',
							borderRadius: '0.375rem',
							fontSize: '0.875rem',
							backgroundColor: disabled ? '#f9fafb' : 'V9_COLORS.TEXT.WHITE',
							color: disabled ? 'V9_COLORS.TEXT.GRAY_LIGHT' : 'V9_COLORS.TEXT.GRAY_DARK',
							transition: 'border-color 0.2s ease',
							height: '48px', // Explicit height to match CountryCodeSelector
							boxSizing: 'border-box',
							...(disabled
								? {}
								: {
										'&:focus': {
											outline: 'none',
											borderColor: 'V9_COLORS.PRIMARY.BLUE',
											boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
										},
									}),
						}}
					/>
				</div>
			</div>

			{helpText && (
				<div
					style={{
						fontSize: '0.75rem',
						color: 'V9_COLORS.TEXT.GRAY_MEDIUM',
						marginTop: '0.25rem',
					}}
				>
					{helpText}
				</div>
			)}

			{/* Display the full formatted number */}
			<div
				style={{
					fontSize: '0.75rem',
					color: 'V9_COLORS.TEXT.GRAY_LIGHT',
					marginTop: '0.25rem',
					fontFamily: 'monospace',
				}}
			>
				Full number: {selectedCountry.dialCode}
				{phoneNumber || '...'}
			</div>
		</div>
	);
};

// Country codes constant (same as in CountryCodeSelector)
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

export default PhoneNumberInput;
