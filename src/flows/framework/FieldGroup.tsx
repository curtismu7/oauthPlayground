// src/flows/framework/FieldGroup.tsx
//
// Reusable labeled input with optional hint text. Matches the Field/Input look
// established in clientCredentials.flow.tsx, lifted into a shared primitive.

import React from 'react';
import styled, { css } from 'styled-components';
import { tokens } from './tokens';

const Wrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.3rem;
`;

const Label = styled.label`
	font-size: 0.82rem;
	font-weight: 600;
	color: ${tokens.color.textSecondary};
`;

// Shared field look so the single-line <input> and the multiline <textarea>
// stay visually identical (same border, focus ring, and disabled state).
const fieldCss = css`
	font-size: 0.9rem;
	padding: 0.5rem 0.65rem;
	border: 1px solid ${tokens.color.borderSubtle};
	border-radius: ${tokens.radius.md};
	font-family: inherit;
	color: ${tokens.color.text};
	background: ${tokens.color.bg};
	outline: none;
	&:focus {
		border-color: ${tokens.color.primary};
		box-shadow: 0 0 0 2px ${tokens.color.primaryBorder};
	}
	&:disabled {
		opacity: 0.55;
		cursor: not-allowed;
		background: ${tokens.color.bgSubtle};
	}
`;

const Input = styled.input`
	${fieldCss}
`;

const TextArea = styled.textarea`
	${fieldCss}
	min-height: 4.5rem;
	resize: vertical;
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 0.8rem;
	word-break: break-all;
`;

const Hint = styled.span`
	font-size: 0.78rem;
	color: ${tokens.color.textMuted};
	line-height: 1.4;
`;

export interface FieldGroupProps {
	label: React.ReactNode;
	hint?: React.ReactNode;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	id?: string;
	type?: 'text' | 'password';
	placeholder?: string;
	disabled?: boolean;
	/** Render a multi-line <textarea> instead of a single-line <input> (e.g. for pasted tokens). */
	multiline?: boolean;
	rows?: number;
}

export const FieldGroup: React.FC<FieldGroupProps> = ({
	label,
	hint,
	value,
	onChange,
	id,
	type = 'text',
	placeholder,
	disabled = false,
	multiline = false,
	rows = 3,
}) => {
	return (
		<Wrap>
			<Label htmlFor={id}>{label}</Label>
			{multiline ? (
				<TextArea
					id={id}
					value={value}
					// Callers pass a single value-only handler; bridge the textarea event
					// (only e.target.value is read) so they don't need a second handler type.
					onChange={onChange as unknown as React.ChangeEventHandler<HTMLTextAreaElement>}
					placeholder={placeholder}
					disabled={disabled}
					rows={rows}
				/>
			) : (
				<Input
					id={id}
					type={type}
					value={value}
					onChange={onChange}
					placeholder={placeholder}
					disabled={disabled}
				/>
			)}
			{hint && <Hint>{hint}</Hint>}
		</Wrap>
	);
};
