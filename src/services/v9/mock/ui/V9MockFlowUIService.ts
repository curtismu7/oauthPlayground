// src/services/v7m/ui/V9MockFlowUIService.ts
// Minimal UI container helpers for V7M flows.
import styled from 'styled-components';

const V7MContainer = styled.div`
	display: flex;
	min-height: 100%;
	width: 100%;
`;

const V7MContentWrapper = styled.div`
	flex: 1;
	padding: 16px;
`;

export const V9MockFlowUIService = {
	getContainer: () => V7MContainer,
	getContentWrapper: () => V7MContentWrapper,
};
