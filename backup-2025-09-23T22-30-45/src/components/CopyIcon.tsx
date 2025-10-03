import React from 'react';
import styled from 'styled-components';

const CopyIconContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  position: relative;
`;

const Square = styled.div<{ $isForeground?: boolean }>`
  position: absolute;
  width: 12px;
  height: 12px;
  border: 1.5px solid #6b7280;
  border-radius: 2px;
  background: transparent;
  
  ${({ $isForeground }) =>
		$isForeground &&
		`
    top: 2px;
    left: 2px;
    box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  `}
`;

const CopyIcon: React.FC<{ size?: number }> = ({ size = 16 }) => {
	return (
		<CopyIconContainer style={{ width: size, height: size }}>
			<Square />
			<Square $isForeground />
		</CopyIconContainer>
	);
};

export default CopyIcon;
