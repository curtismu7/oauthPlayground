// src/flows2/framework/__tests__/SpecVsPingOne.test.tsx

import { render, screen } from '@testing-library/react';
import { SpecVsPingOne, SpecVsPingOneList } from '../SpecVsPingOne';
import type { SpecVsPingOneEntry } from '../SpecVsPingOne';

const baseEntry: SpecVsPingOneEntry = {
	id: 'redirect-uri',
	topic: 'redirect_uri matching',
	spec: 'The authorization server compares the redirect_uri against the registered value.',
	specRef: 'RFC 6749 §3.1.2',
	pingone: 'PingOne requires an exact string match — no wildcards or path matching.',
	note: 'A trailing slash difference will fail.',
};

describe('SpecVsPingOne', () => {
	it('renders the topic, spec text, specRef badge, and pingone text', () => {
		render(<SpecVsPingOne entry={baseEntry} />);

		expect(screen.getByText('redirect_uri matching')).toBeInTheDocument();
		expect(
			screen.getByText(/authorization server compares the redirect_uri/i)
		).toBeInTheDocument();
		expect(screen.getByText('RFC 6749 §3.1.2')).toBeInTheDocument();
		expect(screen.getByText(/PingOne requires an exact string match/i)).toBeInTheDocument();
	});

	it('labels the SPEC and PINGONE columns', () => {
		render(<SpecVsPingOne entry={baseEntry} />);

		expect(screen.getByText('Spec')).toBeInTheDocument();
		expect(screen.getByText('PingOne')).toBeInTheDocument();
	});

	it('renders the note when present', () => {
		render(<SpecVsPingOne entry={baseEntry} />);

		expect(screen.getByText('A trailing slash difference will fail.')).toBeInTheDocument();
	});

	it('omits the note when it is not provided', () => {
		const { note: _note, ...withoutNote } = baseEntry;
		render(<SpecVsPingOne entry={withoutNote} />);

		expect(screen.queryByText('A trailing slash difference will fail.')).not.toBeInTheDocument();
	});

	it('omits the specRef badge when it is not provided', () => {
		const { specRef: _specRef, ...withoutRef } = baseEntry;
		render(<SpecVsPingOne entry={withoutRef} />);

		expect(screen.queryByText('RFC 6749 §3.1.2')).not.toBeInTheDocument();
	});
});

describe('SpecVsPingOneList', () => {
	const entries: SpecVsPingOneEntry[] = [
		baseEntry,
		{
			id: 'pkce',
			topic: 'PKCE',
			spec: 'RFC 7636 recommends PKCE for public clients.',
			specRef: 'RFC 7636 §4',
			pingone: 'PingOne supports S256 and can require PKCE per application.',
		},
	];

	it('renders an optional title', () => {
		render(<SpecVsPingOneList entries={entries} title="Spec vs PingOne" />);

		expect(screen.getByText('Spec vs PingOne')).toBeInTheDocument();
	});

	it('renders one card per entry', () => {
		render(<SpecVsPingOneList entries={entries} />);

		expect(screen.getByText('redirect_uri matching')).toBeInTheDocument();
		expect(screen.getByText('PKCE')).toBeInTheDocument();
	});
});
