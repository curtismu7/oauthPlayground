// src/components/ServiceDiscoveryBrowser.tsx
// Interactive service discovery and browsing component
// Helps developers find and understand available services

import React, { useCallback, useMemo, useState } from 'react';
import { FiBook, FiCode, FiGitBranch, FiInfo, FiSearch } from 'react-icons/fi';
import styled from 'styled-components';
import {
	FlowType,
	ServiceCategory,
	ServiceComplexity,
	ServiceDefinition,
	ServiceDiscoveryService,
	ServiceMaturity,
} from '../services/serviceDiscoveryService';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: #6b7280;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const SearchSection = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const SearchBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const SearchButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;

  &:hover {
    background: #2563eb;
  }
`;

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const FilterSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
`;

const ResultsSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
`;

const ServiceList = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  max-height: 600px;
  overflow-y: auto;
`;

const ServiceListTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const ServiceItem = styled.div<{ isSelected: boolean }>`
  padding: 1rem;
  border: 2px solid ${(props) => (props.isSelected ? '#3b82f6' : '#e5e7eb')};
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${(props) => (props.isSelected ? '#eff6ff' : 'white')};

  &:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }
`;

const ServiceName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const ServiceDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
  line-height: 1.4;
`;

const ServiceMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ServiceBadge = styled.span<{ variant: 'category' | 'complexity' | 'maturity' }>`
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;

  ${(props) => {
		switch (props.variant) {
			case 'category':
				return 'background: #dbeafe; color: #1e40af;';
			case 'complexity':
				return 'background: #fef3c7; color: #92400e;';
			case 'maturity':
				return 'background: #dcfce7; color: #166534;';
			default:
				return 'background: #e5e7eb; color: #374151;';
		}
	}}
`;

const ServiceDetail = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  max-height: 600px;
  overflow-y: auto;
`;

const DetailHeader = styled.div`
  margin-bottom: 1.5rem;
`;

const DetailTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const DetailDescription = styled.p`
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.6;
`;

const DetailSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureItem = styled.li`
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:last-child {
    border-bottom: none;
  }

  &::before {
    content: '✓';
    color: #10b981;
    font-weight: bold;
  }
`;

const CodeExample = styled.pre`
  background: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0.5rem 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const EmptyTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const StatisticsSection = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const StatCard = styled.div`
  text-align: center;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background: #f9fafb;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

interface ServiceDiscoveryBrowserProps {
	initialFlowType?: FlowType;
	showStatistics?: boolean;
}

const ServiceDiscoveryBrowser: React.FC<ServiceDiscoveryBrowserProps> = ({
	initialFlowType,
	showStatistics = true,
}) => {
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | ''>('');
	const [selectedComplexity, setSelectedComplexity] = useState<ServiceComplexity | ''>('');
	const [selectedMaturity, setSelectedMaturity] = useState<ServiceMaturity | ''>('');
	const [selectedService, setSelectedService] = useState<ServiceDefinition | null>(null);

	// Get recommendations for initial flow type
	const recommendations = useMemo(() => {
		if (initialFlowType) {
			return ServiceDiscoveryService.getServiceRecommendations(initialFlowType);
		}
		return [];
	}, [initialFlowType]);

	// Filter services based on search and filters
	const filteredServices = useMemo(() => {
		let services = ServiceDiscoveryService.getAllServices();

		// Apply search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			services = services.filter(
				(service) =>
					service.name.toLowerCase().includes(query) ||
					service.description.toLowerCase().includes(query) ||
					service.features.some((feature) => feature.toLowerCase().includes(query))
			);
		}

		// Apply filters
		if (selectedCategory) {
			services = services.filter((service) => service.category === selectedCategory);
		}

		if (selectedComplexity) {
			services = services.filter((service) => service.complexity === selectedComplexity);
		}

		if (selectedMaturity) {
			services = services.filter((service) => service.maturity === selectedMaturity);
		}

		return services;
	}, [searchQuery, selectedCategory, selectedComplexity, selectedMaturity]);

	const statistics = useMemo(() => {
		return ServiceDiscoveryService.getServiceStatistics();
	}, []);

	const handleServiceSelect = useCallback((service: ServiceDefinition) => {
		setSelectedService(service);
	}, []);

	const clearFilters = useCallback(() => {
		setSearchQuery('');
		setSelectedCategory('');
		setSelectedComplexity('');
		setSelectedMaturity('');
	}, []);

	return (
		<Container>
			<Header>
				<Title>🔍 Service Discovery</Title>
				<Subtitle>
					Discover and explore available services to build your OAuth and OIDC flows. Find the right
					tools for your implementation needs.
				</Subtitle>
			</Header>

			{showStatistics && (
				<StatisticsSection>
					<StatsGrid>
						<StatCard>
							<StatNumber>{statistics.totalServices}</StatNumber>
							<StatLabel>Total Services</StatLabel>
						</StatCard>
						<StatCard>
							<StatNumber>
								{Object.values(statistics.servicesByCategory).reduce((a, b) => a + b, 0)}
							</StatNumber>
							<StatLabel>Categories</StatLabel>
						</StatCard>
						<StatCard>
							<StatNumber>{statistics.servicesByMaturity.stable}</StatNumber>
							<StatLabel>Stable Services</StatLabel>
						</StatCard>
						<StatCard>
							<StatNumber>{statistics.servicesByComplexity.low}</StatNumber>
							<StatLabel>Easy to Use</StatLabel>
						</StatCard>
					</StatsGrid>
				</StatisticsSection>
			)}

			<SearchSection>
				<SearchBar>
					<SearchInput
						type="text"
						placeholder="Search services by name, description, or features..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					<SearchButton onClick={() => {}}>
						<FiSearch />
						Search
					</SearchButton>
				</SearchBar>

				<Filters>
					<FilterGroup>
						<FilterLabel>Category</FilterLabel>
						<FilterSelect
							value={selectedCategory}
							onChange={(e) => setSelectedCategory(e.target.value as ServiceCategory)}
						>
							<option value="">All Categories</option>
							{Object.values(ServiceCategory).map((category) => (
								<option key={category} value={category}>
									{category.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
								</option>
							))}
						</FilterSelect>
					</FilterGroup>

					<FilterGroup>
						<FilterLabel>Complexity</FilterLabel>
						<FilterSelect
							value={selectedComplexity}
							onChange={(e) => setSelectedComplexity(e.target.value as ServiceComplexity)}
						>
							<option value="">All Levels</option>
							<option value={ServiceComplexity.LOW}>Low</option>
							<option value={ServiceComplexity.MEDIUM}>Medium</option>
							<option value={ServiceComplexity.HIGH}>High</option>
						</FilterSelect>
					</FilterGroup>

					<FilterGroup>
						<FilterLabel>Maturity</FilterLabel>
						<FilterSelect
							value={selectedMaturity}
							onChange={(e) => setSelectedMaturity(e.target.value as ServiceMaturity)}
						>
							<option value="">All Status</option>
							<option value={ServiceMaturity.STABLE}>Stable</option>
							<option value={ServiceMaturity.EXPERIMENTAL}>Experimental</option>
							<option value={ServiceMaturity.LEGACY}>Legacy</option>
						</FilterSelect>
					</FilterGroup>

					<FilterGroup style={{ justifyContent: 'flex-end' }}>
						<SearchButton onClick={clearFilters} style={{ background: '#6b7280' }}>
							Clear Filters
						</SearchButton>
					</FilterGroup>
				</Filters>
			</SearchSection>

			<ResultsSection>
				<ServiceList>
					<ServiceListTitle>
						{initialFlowType ? `Recommended for ${initialFlowType}` : 'Available Services'}
					</ServiceListTitle>

					{recommendations.length > 0 && initialFlowType
						? recommendations.map((rec) => (
								<ServiceItem
									key={rec.service.name}
									isSelected={selectedService?.name === rec.service.name}
									onClick={() => handleServiceSelect(rec.service)}
								>
									<ServiceName>{rec.service.name}</ServiceName>
									<ServiceDescription>{rec.service.description}</ServiceDescription>
									<div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#059669' }}>
										🎯 {rec.relevance}% relevant - {rec.rationale}
									</div>
									<ServiceMeta>
										<ServiceBadge variant="category">{rec.service.category}</ServiceBadge>
										<ServiceBadge variant="complexity">{rec.service.complexity}</ServiceBadge>
										<ServiceBadge variant="maturity">{rec.service.maturity}</ServiceBadge>
									</ServiceMeta>
								</ServiceItem>
							))
						: filteredServices.map((service) => (
								<ServiceItem
									key={service.name}
									isSelected={selectedService?.name === service.name}
									onClick={() => handleServiceSelect(service)}
								>
									<ServiceName>{service.name}</ServiceName>
									<ServiceDescription>{service.description}</ServiceDescription>
									<ServiceMeta>
										<ServiceBadge variant="category">{service.category}</ServiceBadge>
										<ServiceBadge variant="complexity">{service.complexity}</ServiceBadge>
										<ServiceBadge variant="maturity">{service.maturity}</ServiceBadge>
									</ServiceMeta>
								</ServiceItem>
							))}

					{filteredServices.length === 0 && (
						<EmptyState>
							<EmptyIcon>🔍</EmptyIcon>
							<EmptyTitle>No services found</EmptyTitle>
							<p>Try adjusting your search criteria or filters.</p>
						</EmptyState>
					)}
				</ServiceList>

				<ServiceDetail>
					{selectedService ? (
						<>
							<DetailHeader>
								<DetailTitle>{selectedService.name}</DetailTitle>
								<DetailDescription>{selectedService.description}</DetailDescription>
							</DetailHeader>

							<DetailSection>
								<SectionTitle>
									<FiInfo />
									Key Features
								</SectionTitle>
								<FeatureList>
									{selectedService.features.map((feature, index) => (
										<FeatureItem key={index}>{feature}</FeatureItem>
									))}
								</FeatureList>
							</DetailSection>

							{selectedService.usageExamples.length > 0 && (
								<DetailSection>
									<SectionTitle>
										<FiCode />
										Usage Examples
									</SectionTitle>
									{selectedService.usageExamples.map((example, index) => (
										<div key={index} style={{ marginBottom: '1rem' }}>
											<h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600 }}>
												{example.title}
											</h4>
											<p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
												{example.description}
											</p>
											<CodeExample>{example.code.trim()}</CodeExample>
										</div>
									))}
								</DetailSection>
							)}

							<DetailSection>
								<SectionTitle>
									<FiBook />
									Best Practices
								</SectionTitle>
								<ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
									{selectedService.bestPractices.map((practice, index) => (
										<li key={index} style={{ marginBottom: '0.5rem', color: '#374151' }}>
											{practice}
										</li>
									))}
								</ul>
							</DetailSection>

							{selectedService.relatedServices.length > 0 && (
								<DetailSection>
									<SectionTitle>
										<FiGitBranch />
										Related Services
									</SectionTitle>
									<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
										{selectedService.relatedServices.map((service, index) => (
											<ServiceBadge key={index} variant="category" style={{ cursor: 'pointer' }}>
												{service}
											</ServiceBadge>
										))}
									</div>
								</DetailSection>
							)}
						</>
					) : (
						<EmptyState>
							<EmptyIcon>📋</EmptyIcon>
							<EmptyTitle>Select a service</EmptyTitle>
							<p>Choose a service from the list to view detailed information and usage examples.</p>
						</EmptyState>
					)}
				</ServiceDetail>
			</ResultsSection>
		</Container>
	);
};

export default ServiceDiscoveryBrowser;
