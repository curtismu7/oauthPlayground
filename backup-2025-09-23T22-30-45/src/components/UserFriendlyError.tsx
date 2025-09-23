import React from 'react';
import styled from 'styled-components';
import { FiAlertCircle, FiRefreshCw, FiHome } from 'react-icons/fi';

interface UserFriendlyErrorProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
}

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  color: #dc3545;
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h2`
  color: #dc3545;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const ErrorMessage = styled.p`
  color: #6c757d;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  line-height: 1.5;
`;

const ErrorDetails = styled.details`
  margin-bottom: 2rem;
  text-align: left;
  width: 100%;
  
  summary {
    cursor: pointer;
    color: #6c757d;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
  
  pre {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 1rem;
    font-size: 0.8rem;
    overflow-x: auto;
    color: #495057;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const RetryButton = styled(Button)`
  background-color: #007bff;
  color: white;
  
  &:hover {
    background-color: #0056b3;
  }
`;

const HomeButton = styled(Button)`
  background-color: #6c757d;
  color: white;
  
  &:hover {
    background-color: #545b62;
  }
`;

export const UserFriendlyError: React.FC<UserFriendlyErrorProps> = ({
  title = 'Something went wrong',
  message,
  details,
  onRetry,
  onGoHome,
  showDetails = false
}) => {
  return (
    <ErrorContainer>
      <ErrorIcon>
        <FiAlertCircle />
      </ErrorIcon>
      
      <ErrorTitle>{title}</ErrorTitle>
      
      <ErrorMessage>{message}</ErrorMessage>
      
      {details && (
        <ErrorDetails open={showDetails}>
          <summary>Technical Details</summary>
          <pre>{details}</pre>
        </ErrorDetails>
      )}
      
      <ButtonGroup>
        {onRetry && (
          <RetryButton onClick={onRetry}>
            <FiRefreshCw />
            Try Again
          </RetryButton>
        )}
        
        {onGoHome && (
          <HomeButton onClick={onGoHome}>
            <FiHome />
            Go Home
          </HomeButton>
        )}
      </ButtonGroup>
    </ErrorContainer>
  );
};

export default UserFriendlyError;
