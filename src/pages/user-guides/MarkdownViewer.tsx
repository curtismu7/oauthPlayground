import { FiArrowLeft } from '@icons';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { usePageScroll } from '../../hooks/usePageScroll';
import PageLayoutService from '../../services/pageLayoutService';

const MarkdownContent = styled.div`
  max-width: 960px;
  margin: 0 auto 4rem;
  padding: 2.5rem 3rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 1rem;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
  border: 1px solid ${({ theme }) => theme.colors.gray200};

  @media (max-width: 768px) {
    padding: 2rem;
  }

  h1 {
    font-size: clamp(2rem, 2.6vw, 2.4rem);
    margin-bottom: 1.25rem;
    color: ${({ theme }) => theme.colors.gray900};
    border-bottom: 3px solid ${({ theme }) => theme.colors.primary};
    padding-bottom: 0.75rem;
    letter-spacing: -0.01em;
  }

  h2 {
    font-size: clamp(1.6rem, 2.1vw, 1.9rem);
    margin-top: 2.5rem;
    margin-bottom: 1.25rem;
    color: ${({ theme }) => theme.colors.gray900};
  }

  h3 {
    font-size: clamp(1.25rem, 1.8vw, 1.5rem);
    margin-top: 2rem;
    margin-bottom: 0.85rem;
    color: ${({ theme }) => theme.colors.gray800};
  }

  p {
    line-height: 1.8;
    margin-bottom: 1.1rem;
    color: ${({ theme }) => theme.colors.gray700};
    font-size: 1rem;
  }

  ul,
  ol {
    margin: 1rem 0 1.25rem;
    padding-left: 1.75rem;
    line-height: 1.7;
    color: ${({ theme }) => theme.colors.gray700};

    li + li {
      margin-top: 0.35rem;
    }
  }

  li {
    margin-bottom: 0.35rem;
  }

  code {
    background: ${({ theme }) => theme.colors.gray100};
    padding: 0.2rem 0.45rem;
    border-radius: 0.35rem;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.primaryDark};
    border: 1px solid ${({ theme }) => theme.colors.gray200};
  }

  pre {
    background: #0f172a;
    color: #f8fafc;
    padding: 1.25rem;
    border-radius: 0.75rem;
    overflow-x: auto;
    margin: 1.5rem 0;
    border: 1px solid rgba(15, 23, 42, 0.3);

    code {
      background: transparent;
      color: inherit;
      padding: 0;
      border: 0;
    }
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    background: rgba(248, 250, 252, 0.6);
    border-radius: 0.75rem;
    overflow: hidden;

    th,
    td {
      border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
      padding: 0.9rem 1rem;
      text-align: left;
      font-size: 0.95rem;
    }

    th {
      background: ${({ theme }) => theme.colors.gray100};
      font-weight: 600;
      color: ${({ theme }) => theme.colors.gray900};
    }

    tr:last-child td {
      border-bottom: none;
    }
  }

  blockquote {
    border-left: 4px solid ${({ theme }) => theme.colors.primary};
    background: rgba(59, 130, 246, 0.08);
    padding: 1rem 1.25rem;
    margin: 1.75rem 0;
    color: ${({ theme }) => theme.colors.gray700};
    font-style: italic;
    border-radius: 0.5rem;
  }

  a {
    color: ${({ theme }) => theme.colors.primaryDark};
    font-weight: 600;
    text-decoration: none;
    box-shadow: inset 0 -2px 0 rgba(59, 130, 246, 0.2);
    transition: color 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      color: ${({ theme }) => theme.colors.primary};
      box-shadow: inset 0 -2px 0 ${({ theme }) => theme.colors.primary};
    }
  }

  img {
    max-width: 100%;
    border-radius: 0.75rem;
    margin: 1.5rem 0;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);
  }

  hr {
    border: none;
    border-top: 1px solid ${({ theme }) => theme.colors.gray200};
    margin: 2.5rem 0;
  }

  strong {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray900};
  }
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.8rem;
  background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
  color: #f8fafc;
  text-decoration: none;
  border-radius: 0.65rem;
  font-weight: 600;
  margin-bottom: 2.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 12px 28px rgba(29, 78, 216, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.12);

  &:hover {
    transform: translateX(-3px);
    box-shadow: 0 16px 32px rgba(29, 78, 216, 0.28);
  }

  &:focus-visible {
    outline: 3px solid rgba(29, 78, 216, 0.35);
    outline-offset: 2px;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${({ theme }) => theme.colors.gray600};
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1.5rem;
  color: #dc2626;
  margin: 2rem 0;
`;

interface MarkdownViewerProps {
	markdownPath: string;
	title: string;
	pageName: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ markdownPath, title, pageName }) => {
	const [content, setContent] = useState<string>('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	usePageScroll({ pageName, force: true });

	const pageConfig = {
		flowType: 'documentation' as const,
		theme: 'blue' as const,
		maxWidth: '72rem',
		showHeader: true,
		showFooter: false,
		responsive: true,
		flowId: `user-guide-${pageName}`,
	};

	const { PageContainer, ContentWrapper } = PageLayoutService.createPageLayout(pageConfig);

	useEffect(() => {
		const fetchMarkdown = async () => {
			try {
				setLoading(true);
				const response = await fetch(markdownPath);
				if (!response.ok) {
					throw new Error(`Failed to load documentation: ${response.statusText}`);
				}
				const text = await response.text();
				setContent(text);
				setError(null);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load documentation');
			} finally {
				setLoading(false);
			}
		};

		fetchMarkdown();
	}, [markdownPath]);

	// Simple markdown to HTML converter (basic implementation)
	const renderMarkdown = (markdown: string) => {
		return markdown
			.replace(/^### (.*$)/gim, '<h3>$1</h3>')
			.replace(/^## (.*$)/gim, '<h2>$1</h2>')
			.replace(/^# (.*$)/gim, '<h1>$1</h1>')
			.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
			.replace(/\*(.*)\*/gim, '<em>$1</em>')
			.replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" />')
			.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
			.replace(/\n\n/gim, '</p><p>')
			.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
			.replace(/`([^`]+)`/gim, '<code>$1</code>');
	};

	return (
		<PageContainer>
			<ContentWrapper>
				<BackButton to="/documentation">
					<FiArrowLeft /> Back to Documentation
				</BackButton>

				{loading && <LoadingMessage>Loading documentation...</LoadingMessage>}

				{error && (
					<ErrorMessage>
						<strong>Error:</strong> {error}
					</ErrorMessage>
				)}

				{!loading && !error && content && (
					<MarkdownContent dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
				)}
			</ContentWrapper>
		</PageContainer>
	);
};

export default MarkdownViewer;
