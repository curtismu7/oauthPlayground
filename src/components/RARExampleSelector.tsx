// src/components/RARExampleSelector.tsx
// RAR Example Selector with pre-built templates including customer_information

import { FiCheckCircle, FiChevronDown, FiChevronUp, FiCode, FiCopy, FiEye } from '@icons';
import React, { useState } from 'react';
import styled from 'styled-components';
import RARService, { type AuthorizationDetail } from '../services/rarService';

interface RARExampleSelectorProps {
	onSelectExample: (details: AuthorizationDetail[]) => void;
	className?: string;
}

const Container = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  background: white;
  margin-bottom: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const Description = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
`;

const ExampleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
`;

const ExampleCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  background: white;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
`;

const ExampleHeader = styled.div`
  padding: 1rem;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;

const ExampleTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const ExampleSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const ExampleContent = styled.div`
  padding: 1rem;
`;

const ViewToggle = styled.div`
  display: flex;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
`;

const ViewButton = styled.button<{ active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: none;
  background: ${(props) => (props.active ? '#3b82f6' : 'white')};
  color: ${(props) => (props.active ? 'white' : '#6b7280')};
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.active ? '#2563eb' : '#f9fafb')};
  }
`;

const JsonDisplay = styled.pre`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.75rem;
  line-height: 1.4;
  overflow-x: auto;
  margin: 0 0 1rem 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
`;

const FormattedView = styled.div`
  margin-bottom: 1rem;
`;

const DetailItem = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
`;

const DetailType = styled.div`
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
`;

const DetailFields = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
  font-size: 0.75rem;
`;

const FieldItem = styled.div`
  color: #6b7280;
`;

const FieldLabel = styled.span`
  font-weight: 500;
  color: #374151;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }

  &.primary {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;

    &:hover {
      background: #2563eb;
    }
  }
`;

const CollapsibleSection = styled.div`
  margin-top: 1rem;
`;

const CollapsibleHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #374151;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
  }
`;

const CollapsibleContent = styled.div<{ isOpen: boolean }>`
  display: ${(props) => (props.isOpen ? 'block' : 'none')};
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 6px 6px;
  background: white;
`;

export const RARExampleSelector: React.FC<RARExampleSelectorProps> = ({
	onSelectExample,
	className,
}) => {
	const [viewModes, setViewModes] = useState<Record<string, 'json' | 'formatted'>>({});
	const [isExpanded, setIsExpanded] = useState(false);

	const examples = RARService.getExampleAuthorizationDetails();
	const templates = RARService.getTemplates();

	const exampleConfigs = [
		{
			id: 'customer_info',
			title: 'Customer Information Access',
			subtitle: 'Read and write customer contacts and photos',
			details: [templates.customerInformation],
			description:
				'Request access to specific customer data types with defined actions and API endpoints.',
		},
		{
			id: 'payment',
			title: 'Payment Initiation',
			subtitle: 'Authorize a specific payment transaction',
			details: [templates.paymentInitiation],
			description: 'Authorize a payment with specific amount, creditor, and account details.',
		},
		{
			id: 'account_info',
			title: 'Account Information',
			subtitle: 'Access account balances and transactions',
			details: [templates.accountInformation],
			description:
				'Request access to account information including balances and transaction history.',
		},
		{
			id: 'comprehensive',
			title: 'Comprehensive Example',
			subtitle: 'Multiple authorization types combined',
			details: examples,
			description:
				'A complete example showing multiple authorization detail types in a single request.',
		},
	];

	const toggleViewMode = (exampleId: string) => {
		setViewModes((prev) => ({
			...prev,
			[exampleId]: prev[exampleId] === 'json' ? 'formatted' : 'json',
		}));
	};

	const copyToClipboard = async (details: AuthorizationDetail[]) => {
		try {
			await navigator.clipboard.writeText(JSON.stringify(details, null, 2));
			// Could add a toast notification here
		} catch (error) {
			console.warn('Failed to copy to clipboard:', error);
		}
	};

	const renderFormattedView = (details: AuthorizationDetail[]) => (
		<FormattedView>
			{details.map((detail, index) => (
				<DetailItem key={index}>
					<DetailType>{detail.type}</DetailType>
					<DetailFields>
						{detail.type === 'customer_information' && (
							<>
								<FieldItem>
									<FieldLabel>Actions:</FieldLabel> {detail.actions?.join(', ')}
								</FieldItem>
								<FieldItem>
									<FieldLabel>Data Types:</FieldLabel> {detail.datatypes?.join(', ')}
								</FieldItem>
								<FieldItem>
									<FieldLabel>Locations:</FieldLabel> {detail.locations?.join(', ')}
								</FieldItem>
							</>
						)}
						{detail.type === 'payment_initiation' && (
							<>
								<FieldItem>
									<FieldLabel>Amount:</FieldLabel> {detail.instructedAmount?.currency}{' '}
									{detail.instructedAmount?.amount}
								</FieldItem>
								<FieldItem>
									<FieldLabel>Creditor:</FieldLabel> {detail.creditorName}
								</FieldItem>
								<FieldItem>
									<FieldLabel>IBAN:</FieldLabel> {detail.creditorAccount?.iban}
								</FieldItem>
							</>
						)}
						{detail.type === 'account_information' && (
							<>
								<FieldItem>
									<FieldLabel>Accounts:</FieldLabel> {detail.accounts?.join(', ') || 'All'}
								</FieldItem>
								<FieldItem>
									<FieldLabel>Balances:</FieldLabel> {detail.balances ? 'Yes' : 'No'}
								</FieldItem>
								<FieldItem>
									<FieldLabel>Transactions:</FieldLabel> {detail.transactions ? 'Yes' : 'No'}
								</FieldItem>
							</>
						)}
					</DetailFields>
				</DetailItem>
			))}
		</FormattedView>
	);

	const renderExample = (config: (typeof exampleConfigs)[0]) => {
		const viewMode = viewModes[config.id] || 'formatted';

		return (
			<ExampleCard key={config.id}>
				<ExampleHeader>
					<ExampleTitle>{config.title}</ExampleTitle>
					<ExampleSubtitle>{config.subtitle}</ExampleSubtitle>
				</ExampleHeader>
				<ExampleContent>
					<ViewToggle>
						<ViewButton active={viewMode === 'formatted'} onClick={() => toggleViewMode(config.id)}>
							<FiEye size={12} />
							Formatted
						</ViewButton>
						<ViewButton active={viewMode === 'json'} onClick={() => toggleViewMode(config.id)}>
							<FiCode size={12} />
							JSON
						</ViewButton>
					</ViewToggle>

					{viewMode === 'json' ? (
						<JsonDisplay>{JSON.stringify(config.details, null, 2)}</JsonDisplay>
					) : (
						renderFormattedView(config.details)
					)}

					<ActionButtons>
						<ActionButton onClick={() => copyToClipboard(config.details)}>
							<FiCopy size={12} />
							Copy
						</ActionButton>
						<ActionButton className="primary" onClick={() => onSelectExample(config.details)}>
							<FiCheckCircle size={12} />
							Use Example
						</ActionButton>
					</ActionButtons>
				</ExampleContent>
			</ExampleCard>
		);
	};

	return (
		<Container className={className}>
			<Header>
				<Title>RAR Authorization Examples</Title>
			</Header>

			<Description>
				Choose from pre-built authorization detail templates to get started quickly. These examples
				demonstrate different RAR use cases including the new customer_information type.
			</Description>

			<ExampleGrid>{exampleConfigs.slice(0, 2).map(renderExample)}</ExampleGrid>

			<CollapsibleSection>
				<CollapsibleHeader onClick={() => setIsExpanded(!isExpanded)}>
					<span>More Examples</span>
					{isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
				</CollapsibleHeader>
				<CollapsibleContent isOpen={isExpanded}>
					<ExampleGrid>{exampleConfigs.slice(2).map(renderExample)}</ExampleGrid>
				</CollapsibleContent>
			</CollapsibleSection>
		</Container>
	);
};

export default RARExampleSelector;
