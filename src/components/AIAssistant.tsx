import React, { useEffect, useRef, useState } from 'react';
import { FiExternalLink, FiMessageCircle, FiSend, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { aiAgentService } from '../services/aiAgentService';

interface Message {
	id: string;
	type: 'user' | 'assistant';
	content: string;
	links?: Array<{
		title: string;
		path: string;
		type: string;
		external?: boolean;
	}>;
	timestamp: Date;
}

const AIAssistant: React.FC = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [includeApiDocs, setIncludeApiDocs] = useState(false);
	const [includeSpecs, setIncludeSpecs] = useState(false);
	const [includeWorkflows, setIncludeWorkflows] = useState(false);
	const [includeUserGuide, setIncludeUserGuide] = useState(false);
	const [messages, setMessages] = useState<Message[]>([
		{
			id: '1',
			type: 'assistant',
			content:
				"Hi! I'm your OAuth Playground assistant. I can help you:\n\n• Find the right OAuth flow for your needs\n• Explain OAuth and OIDC concepts\n• Guide you through configuration\n• Troubleshoot issues\n\nWhat would you like to know?",
			timestamp: new Date(),
		},
	]);
	const [input, setInput] = useState('');
	const [isTyping, setIsTyping] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();

	useEffect(() => {
		if (messages.length === 0) {
			return;
		}

		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const handleSend = async () => {
		if (!input.trim()) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			type: 'user',
			content: input,
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput('');
		setIsTyping(true);

		// Simulate slight delay for more natural feel
		setTimeout(() => {
			const { answer, relatedLinks } = aiAgentService.getAnswer(input, {
				includeApiDocs,
				includeSpecs,
				includeWorkflows,
				includeUserGuide,
			});

			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				type: 'assistant',
				content: answer,
				links: relatedLinks.map((link) => ({
					title: link.title,
					path: link.path,
					type: link.type,
					external: link.external,
				})),
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, assistantMessage]);
			setIsTyping(false);
		}, 500);
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleLinkClick = (path: string, external?: boolean) => {
		if (external) {
			window.open(path, '_blank', 'noopener,noreferrer');
		} else {
			navigate(path);
			setIsOpen(false);
		}
	};

	const quickQuestions = [
		'How do I configure Authorization Code flow?',
		"What's the difference between OAuth and OIDC?",
		'Which flow should I use?',
		'How do I test device flows?',
		'What is PKCE?',
	];

	return (
		<>
			{/* Floating Button */}
			{!isOpen && (
				<FloatingButton onClick={() => setIsOpen(true)} aria-label="Open AI Assistant">
					<FiMessageCircle size={24} />
					<Pulse />
				</FloatingButton>
			)}

			{/* Chat Window */}
			{isOpen && (
				<ChatWindow>
					<ChatHeader>
						<HeaderContent>
							<AssistantIcon>🤖</AssistantIcon>
							<HeaderText>
								<HeaderTitle>OAuth Assistant</HeaderTitle>
								<HeaderSubtitle>Ask me anything about OAuth & OIDC</HeaderSubtitle>
							</HeaderText>
						</HeaderContent>
						<HeaderActions>
							<ToggleContainer>
								<ToggleLabel>
									<ToggleCheckbox
										type="checkbox"
										checked={includeApiDocs}
										onChange={(e) => setIncludeApiDocs(e.target.checked)}
										aria-label="Include PingOne API docs"
									/>
									<ToggleText>APIs</ToggleText>
								</ToggleLabel>
							</ToggleContainer>
							<ToggleContainer>
								<ToggleLabel>
									<ToggleCheckbox
										type="checkbox"
										checked={includeSpecs}
										onChange={(e) => setIncludeSpecs(e.target.checked)}
										aria-label="Include OAuth/OIDC specifications"
									/>
									<ToggleText>Specs</ToggleText>
								</ToggleLabel>
							</ToggleContainer>
							<ToggleContainer>
								<ToggleLabel>
									<ToggleCheckbox
										type="checkbox"
										checked={includeWorkflows}
										onChange={(e) => setIncludeWorkflows(e.target.checked)}
										aria-label="Include PingOne workflows"
									/>
									<ToggleText>Workflows</ToggleText>
								</ToggleLabel>
							</ToggleContainer>
							<ToggleContainer>
								<ToggleLabel>
									<ToggleCheckbox
										type="checkbox"
										checked={includeUserGuide}
										onChange={(e) => setIncludeUserGuide(e.target.checked)}
										aria-label="Include User Guide"
									/>
									<ToggleText>Guide</ToggleText>
								</ToggleLabel>
							</ToggleContainer>
							<CloseButton onClick={() => setIsOpen(false)} aria-label="Close assistant">
								<FiX size={20} />
							</CloseButton>
						</HeaderActions>
					</ChatHeader>

					<MessagesContainer>
						{messages.map((message) => (
							<MessageWrapper key={message.id} $isUser={message.type === 'user'}>
								<MessageBubble $isUser={message.type === 'user'}>
									<MessageContent>{message.content}</MessageContent>
									{message.links && message.links.length > 0 && (
										<LinksContainer>
											<LinksTitle>Related Resources:</LinksTitle>
											{message.links.map((link, idx) => (
												<LinkItem
													key={idx}
													onClick={() => handleLinkClick(link.path, link.external)}
												>
													<LinkIcon $type={link.type}>
														{link.type === 'flow' && '🔄'}
														{link.type === 'feature' && '⚡'}
														{link.type === 'doc' && '📖'}
														{link.type === 'api' && '🔌'}
														{link.type === 'spec' && '📋'}
														{link.type === 'workflow' && '🔀'}
														{link.type === 'guide' && '📚'}
													</LinkIcon>
													<LinkText>{link.title}</LinkText>
													<FiExternalLink size={14} />
												</LinkItem>
											))}
										</LinksContainer>
									)}
								</MessageBubble>
							</MessageWrapper>
						))}

						{isTyping && (
							<MessageWrapper $isUser={false}>
								<MessageBubble $isUser={false}>
									<TypingIndicator>
										<Dot delay={0} />
										<Dot delay={0.2} />
										<Dot delay={0.4} />
									</TypingIndicator>
								</MessageBubble>
							</MessageWrapper>
						)}

						{messages.length === 1 && (
							<QuickQuestionsContainer>
								<QuickQuestionsTitle>Quick questions:</QuickQuestionsTitle>
								{quickQuestions.map((question, idx) => (
									<QuickQuestionButton
										key={idx}
										onClick={() => {
											setInput(question);
											setTimeout(() => handleSend(), 100);
										}}
									>
										{question}
									</QuickQuestionButton>
								))}
							</QuickQuestionsContainer>
						)}

						<div ref={messagesEndRef} />
					</MessagesContainer>

					<InputContainer>
						<Input
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyPress={handleKeyPress}
							placeholder="Ask about OAuth flows, features, or configuration..."
							aria-label="Message input"
						/>
						<SendButton onClick={handleSend} disabled={!input.trim()} aria-label="Send message">
							<FiSend size={18} />
						</SendButton>
					</InputContainer>
				</ChatWindow>
			)}
		</>
	);
};

// Styled Components
const FloatingButton = styled.button`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  z-index: 1000;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const Pulse = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.4);
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }
`;

const ChatWindow = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 400px;
  height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;

  @media (max-width: 768px) {
    width: calc(100vw - 32px);
    height: calc(100vh - 100px);
    bottom: 16px;
    right: 16px;
  }
`;

const ChatHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AssistantIcon = styled.div`
  font-size: 32px;
`;

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
`;

const HeaderTitle = styled.div`
  font-weight: 600;
  font-size: 16px;
`;

const HeaderSubtitle = styled.div`
  font-size: 12px;
  opacity: 0.9;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
`;

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
`;

const ToggleCheckbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: white;
`;

const ToggleText = styled.span`
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8f9fa;
`;

const MessageWrapper = styled.div<{ $isUser: boolean }>`
  display: flex;
  justify-content: ${(props) => (props.$isUser ? 'flex-end' : 'flex-start')};
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 16px;
  background: ${(props) =>
		props.$isUser ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'};
  color: ${(props) => (props.$isUser ? 'white' : '#333')};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const MessageContent = styled.div`
  line-height: 1.5;
  font-size: 14px;
`;

const LinksContainer = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
`;

const LinksTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
  opacity: 0.8;
`;

const LinkItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px;
  margin-bottom: 4px;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
`;

const LinkIcon = styled.span<{ $type: string }>`
  font-size: 16px;
`;

const LinkText = styled.span`
  flex: 1;
  font-size: 13px;
  color: inherit;
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 4px;
  padding: 4px 0;
`;

const Dot = styled.div<{ delay: number }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
  animation: bounce 1.4s infinite ease-in-out;
  animation-delay: ${(props) => props.delay}s;

  @keyframes bounce {
    0%, 80%, 100% {
      transform: scale(0);
    }
    40% {
      transform: scale(1);
    }
  }
`;

const QuickQuestionsContainer = styled.div`
  margin-top: 8px;
`;

const QuickQuestionsTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
`;

const QuickQuestionButton = styled.button`
  display: block;
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 6px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-align: left;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
    border-color: #667eea;
    transform: translateX(4px);
  }
`;

const InputContainer = styled.div`
  padding: 16px;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 8px;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #667eea;
  }

  &::placeholder {
    color: #999;
  }
`;

const SendButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default AIAssistant;
