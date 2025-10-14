import { Link, Outlet } from 'react-router-dom';
import styled from 'styled-components';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 1.75rem;
`;

const Sub = styled.p`
  color: ${({ theme }) => theme.colors.gray600};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const CardTitle = styled.h2`
  font-size: 1.2rem;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ButtonLink = styled(Link)`
  display: inline-block;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  font-weight: 600;
  border: 1px solid ${({ theme }) => theme.colors.primaryDark};
  transition: background 0.15s ease;

  &:hover { background: ${({ theme }) => theme.colors.primaryLight}; text-decoration: none; }
`;

const SecondaryLink = styled(Link)`
  display: inline-block;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.gray200};
  color: ${({ theme }) => theme.colors.gray900};
  font-weight: 600;
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  transition: background 0.15s ease;

  &:hover { background: ${({ theme }) => theme.colors.gray300}; text-decoration: none; }
`;

const Flows = () => {
	return (
		<Page>
			<Header>
				<div>
					<Title>Flows</Title>
					<Sub>
						Explore OAuth 2.0 and OpenID Connect flows. Defaults are secure-by-default (Auth Code
						with PKCE).
					</Sub>
				</div>
			</Header>

			<Grid>
				<Card>
					<CardTitle>OAuth 2.0</CardTitle>
					<Sub>
						Standards-based authorization flows. Recommended: Authorization Code (with PKCE for
						public clients).
					</Sub>
					<Actions>
						<ButtonLink to="/flows/authorization-code">Authorization Code</ButtonLink>

						<SecondaryLink to="/flows/client-credentials">Client Credentials</SecondaryLink>
						<SecondaryLink to="/flows/device-code">Device Code</SecondaryLink>
						<SecondaryLink to="/flows/implicit">Implicit (legacy)</SecondaryLink>
					</Actions>
				</Card>

				<Card>
					<CardTitle>OpenID Connect</CardTitle>
					<Sub>Identity layer on top of OAuth 2.0.</Sub>
					<Actions>
						<ButtonLink to="/oidc/id-tokens">ID Tokens</ButtonLink>
						<SecondaryLink to="/oidc/userinfo">UserInfo</SecondaryLink>
					</Actions>
				</Card>
			</Grid>

			{/* Nested routes render here */}
			<Outlet />
		</Page>
	);
};

export default Flows;
