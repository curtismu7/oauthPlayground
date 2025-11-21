import React, { useState } from 'react';
import styled from 'styled-components';

interface InfoPopoverProps {
	title: string;
	children: React.ReactNode;
}

const Wrapper = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 0.35rem;
`;

const Trigger = styled.button`
  appearance: none;
  border: none;
  padding: 0;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 9999px;
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;

  &:hover,
  &:focus-visible {
    background: rgba(59, 130, 246, 0.22);
    color: #1e3a8a;
    transform: translateY(-1px);
    outline: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
`;

const PopoverCard = styled.div`
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 50%;
  transform: translateX(-50%);
  min-width: 14rem;
  max-width: 18rem;
  background: #0f172a;
  color: #f8fafc;
  border-radius: 0.75rem;
  padding: 0.85rem 1rem;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.25);
  z-index: 20;
  pointer-events: none;
  font-size: 0.8rem;
  line-height: 1.45;

  @media (prefers-reduced-motion: no-preference) {
    animation: popover-fade 0.18s ease;
  }

  @keyframes popover-fade {
    from {
      opacity: 0;
      transform: translate(-50%, -4px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
`;

const PopoverTitle = styled.div`
  font-weight: 600;
  margin-bottom: 0.35rem;
  font-size: 0.82rem;
`;

const PopoverBody = styled.div`
  color: rgba(226, 232, 240, 0.9);
`;

export const InfoPopover: React.FC<InfoPopoverProps> = ({ title, children }) => {
	const [isOpen, setIsOpen] = useState(false);

	const show = () => setIsOpen(true);
	const hide = () => setIsOpen(false);

	return (
		<Wrapper onMouseEnter={show} onMouseLeave={hide}>
			<Trigger type="button" onFocus={show} onBlur={hide} aria-label={`${title} details`}>
				i
			</Trigger>
			{isOpen && (
				<PopoverCard role="tooltip">
					<PopoverTitle>{title}</PopoverTitle>
					<PopoverBody>{children}</PopoverBody>
				</PopoverCard>
			)}
		</Wrapper>
	);
};
