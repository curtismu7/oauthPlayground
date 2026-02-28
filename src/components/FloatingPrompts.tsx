import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const FloatingPromptsButton = styled(Link)`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  z-index: 1000;
  transition: all 0.3s ease;
  text-decoration: none;
  border: 2px solid white;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    bottom: 1rem;
    right: 1rem;
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }
`;

const FloatingPrompts: React.FC = () => {
	return (
		<FloatingPromptsButton
			to="/docs/prompts/prompt-all"
			title="🚀 AI Development Prompts - Quick Access"
			aria-label="AI Development Prompts"
		>
			🚀
		</FloatingPromptsButton>
	);
};

export default FloatingPrompts;
