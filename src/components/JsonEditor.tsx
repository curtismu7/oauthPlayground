import { FiCheck, FiCopy } from '@icons';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

interface JsonEditorProps {
	value: any;
	onChange?: (value: any) => void;
	readOnly?: boolean;
	height?: string;
	scopeColors?: Record<string, string>;
	className?: string;
}

const EditorContainer = styled.div`
  position: relative;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #1f2937;
`;

const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #374151;
  border-bottom: 1px solid #4b5563;
`;

const EditorTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #d1d5db;
`;

const CopyButton = styled.button.withConfig({
	shouldForwardProp: (prop) => prop !== 'copied',
})<{ copied?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: ${(props) => (props.copied ? '#059669' : '#374151')};
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: ${(props) => (props.copied ? '#047857' : '#4b5563')};
  }
`;

const EditorContent = styled.div<{ height?: string }>`
  height: ${(props) => props.height || '300px'};
  overflow: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #f9fafb;
  padding: 1rem;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ScopeHighlight = styled.span<{ color: string }>`
  background-color: ${(props) => props.color}20;
  color: ${(props) => props.color};
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-weight: 500;
  border: 1px solid ${(props) => props.color}40;
`;

const JsonEditor: React.FC<JsonEditorProps> = ({
	value,
	onChange,
	readOnly = false,
	height = '300px',
	scopeColors = {},
	className,
}) => {
	const [copied, setCopied] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState('');

	// Default scope colors
	const defaultScopeColors = {
		openid: '#3b82f6',
		profile: '#10b981',
		email: '#f59e0b',
		address: '#ef4444',
		phone: '#8b5cf6',
		offline_access: '#06b6d4',
		read: '#84cc16',
		write: '#f97316',
		admin: '#dc2626',
	};

	const colors = { ...defaultScopeColors, ...scopeColors };

	useEffect(() => {
		setEditValue(JSON.stringify(value, null, 2));
	}, [value]);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy JSON:', err);
		}
	};

	const handleEdit = () => {
		setIsEditing(true);
		setEditValue(JSON.stringify(value, null, 2));
	};

	const handleSave = () => {
		try {
			const parsed = JSON.parse(editValue);
			onChange?.(parsed);
			setIsEditing(false);
		} catch (err) {
			console.error('Invalid JSON:', err);
			// Could show error message to user
		}
	};

	const handleCancel = () => {
		setIsEditing(false);
		setEditValue(JSON.stringify(value, null, 2));
	};

	const formatJsonWithColors = useMemo(() => {
		if (isEditing) return null;

		const jsonString = JSON.stringify(value, null, 2);

		// Create a function to highlight scopes in the JSON
		const highlightScopes = (text: string): React.ReactNode[] => {
			const parts: React.ReactNode[] = [];
			let lastIndex = 0;

			// Find all scope values in the JSON
			const scopeRegex = /"([^"]*scope[^"]*)"\s*:\s*"([^"]+)"/g;
			let match;

			while ((match = scopeRegex.exec(text)) !== null) {
				// Add text before the match
				if (match.index > lastIndex) {
					parts.push(text.slice(lastIndex, match.index));
				}

				// Add the key
				parts.push(match[1]);

				// Add the colon and quotes
				parts.push('": "');

				// Split the scopes and highlight each one
				const scopes = match[2].split(' ');
				scopes.forEach((scope, index) => {
					if (index > 0) parts.push(' ');
					const color = colors[scope] || '#6b7280';
					parts.push(
						<ScopeHighlight key={`${match.index}-${index}`} color={color}>
							{scope}
						</ScopeHighlight>
					);
				});

				// Add closing quote
				parts.push('"');

				lastIndex = match.index + match[0].length;
			}

			// Add remaining text
			if (lastIndex < text.length) {
				parts.push(text.slice(lastIndex));
			}

			return parts.length > 0 ? parts : [text];
		};

		return highlightScopes(jsonString);
	}, [value, colors, isEditing]);

	if (isEditing) {
		return (
			<EditorContainer className={className}>
				<EditorHeader>
					<EditorTitle>Edit JSON Configuration</EditorTitle>
					<div style={{ display: 'flex', gap: '0.5rem' }}>
						<button
							onClick={handleSave}
							style={{
								padding: '0.5rem 0.75rem',
								background: '#10b981',
								color: 'white',
								border: 'none',
								borderRadius: '0.375rem',
								fontSize: '0.75rem',
								cursor: 'pointer',
							}}
						>
							Save
						</button>
						<button
							onClick={handleCancel}
							style={{
								padding: '0.5rem 0.75rem',
								background: '#6b7280',
								color: 'white',
								border: 'none',
								borderRadius: '0.375rem',
								fontSize: '0.75rem',
								cursor: 'pointer',
							}}
						>
							Cancel
						</button>
					</div>
				</EditorHeader>
				<textarea
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					style={{
						width: '100%',
						height: height,
						border: 'none',
						outline: 'none',
						background: '#1f2937',
						color: '#f9fafb',
						fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
						fontSize: '0.875rem',
						lineHeight: '1.5',
						padding: '1rem',
						resize: 'none',
					}}
					placeholder="Enter valid JSON..."
				/>
			</EditorContainer>
		);
	}

	return (
		<EditorContainer className={className}>
			<EditorHeader>
				<EditorTitle>JSON Configuration</EditorTitle>
				<div style={{ display: 'flex', gap: '0.5rem' }}>
					{!readOnly && (
						<button
							onClick={handleEdit}
							style={{
								padding: '0.5rem 0.75rem',
								background: '#3b82f6',
								color: 'white',
								border: 'none',
								borderRadius: '0.375rem',
								fontSize: '0.75rem',
								cursor: 'pointer',
							}}
						>
							Edit
						</button>
					)}
					<CopyButton copied={copied} onClick={handleCopy}>
						{copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
						{copied ? 'Copied!' : 'Copy'}
					</CopyButton>
				</div>
			</EditorHeader>
			<EditorContent height={height}>{formatJsonWithColors}</EditorContent>
		</EditorContainer>
	);
};

export default JsonEditor;
