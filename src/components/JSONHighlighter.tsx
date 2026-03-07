import React from 'react';
import styled from 'styled-components';

// Define JSON value types
type JSONValue = string | number | boolean | null | JSONObject | JSONArray;

interface JSONObject {
	[key: string]: JSONValue;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface JSONArray extends Array<JSONValue> {}

export type JSONData = JSONValue;

interface JSONHighlighterProps {
	data: JSONData;
	className?: string;
}

const JSONContainer = styled.pre`
  background-color: white;
  border: 1px solid V9_COLORS.TEXT.GRAY_LIGHTER;
  border-radius: 0.375rem;
  padding: 1rem;
  font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  max-width: 100%;
  overflow: hidden;
`;

const JSONKey = styled.span`
  color: V9_COLORS.PRIMARY.BLUE; /* Blue for keys */
  font-weight: 500;
`;

const _JSONValue = styled.span`
  color: V9_COLORS.PRIMARY.RED_DARK; /* Red for values */
`;

const JSONString = styled.span`
  color: V9_COLORS.PRIMARY.RED_DARK; /* Red for string values */
`;

const JSONNumber = styled.span`
  color: V9_COLORS.PRIMARY.RED_DARK; /* Red for number values */
`;

const JSONBoolean = styled.span`
  color: V9_COLORS.PRIMARY.RED_DARK; /* Red for boolean values */
`;

const JSONNull = styled.span`
  color: V9_COLORS.PRIMARY.RED_DARK; /* Red for null values */
`;

const JSONPunctuation = styled.span`
  color: V9_COLORS.TEXT.GRAY_MEDIUM; /* Gray for punctuation */
`;

const JSONHighlighter: React.FC<JSONHighlighterProps> = ({ data, className }) => {
	const formatValue = (value: JSONValue, indent: number = 0): React.ReactNode => {
		const spaces = '  '.repeat(indent);

		if (value === null) {
			return <JSONNull>null</JSONNull>;
		}

		if (typeof value === 'boolean') {
			return <JSONBoolean>{value.toString()}</JSONBoolean>;
		}

		if (typeof value === 'number') {
			return <JSONNumber>{value}</JSONNumber>;
		}

		if (typeof value === 'string') {
			return <JSONString>"{value}"</JSONString>;
		}

		if (Array.isArray(value)) {
			if (value.length === 0) {
				return <JSONPunctuation>[]</JSONPunctuation>;
			}

			return (
				<>
					<JSONPunctuation>[</JSONPunctuation>
					<br />
					{value.map((item, index) => (
						<React.Fragment key={index}>
							{spaces} {formatValue(item, indent + 1)}
							{index < value.length - 1 && <JSONPunctuation>,</JSONPunctuation>}
							<br />
						</React.Fragment>
					))}
					{spaces}
					<JSONPunctuation>]</JSONPunctuation>
				</>
			);
		}

		if (typeof value === 'object') {
			const entries = Object.entries(value);
			if (entries.length === 0) {
				return <JSONPunctuation>{}</JSONPunctuation>;
			}

			return (
				<>
					<JSONPunctuation>{'{'}</JSONPunctuation>
					<br />
					{entries.map(([key, val], index) => (
						<React.Fragment key={key}>
							{spaces} <JSONKey>"{key}"</JSONKey>
							<JSONPunctuation>: </JSONPunctuation>
							{formatValue(val, indent + 1)}
							{index < entries.length - 1 && <JSONPunctuation>,</JSONPunctuation>}
							<br />
						</React.Fragment>
					))}
					{spaces}
					<JSONPunctuation>{'}'}</JSONPunctuation>
				</>
			);
		}

		return <span>{String(value)}</span>;
	};

	return <JSONContainer className={className}>{formatValue(data)}</JSONContainer>;
};

export default JSONHighlighter;
