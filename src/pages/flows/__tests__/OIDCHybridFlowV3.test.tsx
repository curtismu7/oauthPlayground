// src/pages/flows/__tests__/OIDCHybridFlowV3.test.tsx

import { fireEvent, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OIDCHybridFlowV3 from "../OIDCHybridFlowV3";

// Mock the hooks and utilities
vi.mock("../../contexts/NewAuthContext", () => ({
	useAuth: () => ({
		config: {
			pingone: {
				environmentId: "test-env-id",
				clientId: "test-client-id",
				authEndpoint: "https://auth.pingone.com/test-env-id/as/authorize",
			},
		},
	}),
}));

vi.mock("../../utils/flowStepSystem", () => ({
	useFlowStepManager: () => ({
		currentStep: 0,
		setStep: vi.fn(),
		nextStep: vi.fn(),
		previousStep: vi.fn(),
	}),
}));

vi.mock("../../hooks/usePageScroll", () => ({
	useAuthorizationFlowScroll: () => ({
		scrollToTop: vi.fn(),
	}),
}));

vi.mock("../../utils/logger", () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
	},
}));

vi.mock("../../utils/clipboard", () => ({
	copyToClipboard: vi.fn(),
}));

vi.mock("../../utils/oauth", () => ({
	generateRandomString: vi.fn(() => "test-random-string"),
}));

vi.mock("../../utils/pkce", () => ({
	generatePKCEChallenge: vi.fn(() => Promise.resolve("test-code-challenge")),
}));

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
	value: localStorageMock,
});

const renderWithRouter = (component: React.ReactElement) => {
	return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("OIDCHybridFlowV3", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorageMock.getItem.mockReturnValue(null);
	});

	it("renders the hybrid flow component", () => {
		renderWithRouter(<OIDCHybridFlowV3 />);

		expect(screen.getByText("OIDC Hybrid Flow V3")).toBeInTheDocument();
		expect(
			screen.getByText(/OIDC 1.0 Hybrid Flow implementation/),
		).toBeInTheDocument();
	});

	it("displays configuration form fields", () => {
		renderWithRouter(<OIDCHybridFlowV3 />);

		expect(
			screen.getByLabelText(/Authorization Endpoint/i),
		).toBeInTheDocument();
		expect(screen.getByLabelText(/Client ID/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Redirect URI/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Scopes/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Response Type/i)).toBeInTheDocument();
	});

	it("has default values for required fields", () => {
		renderWithRouter(<OIDCHybridFlowV3 />);

		const redirectUriInput = screen.getByLabelText(
			/Redirect URI/i,
		) as HTMLInputElement;
		const scopesInput = screen.getByLabelText(/Scopes/i) as HTMLInputElement;
		const responseTypeSelect = screen.getByLabelText(
			/Response Type/i,
		) as HTMLSelectElement;

		expect(redirectUriInput.value).toContain("/hybrid-callback");
		expect(scopesInput.value).toBe("openid profile email");
		expect(responseTypeSelect.value).toBe("code id_token");
	});

	it("allows editing configuration fields", () => {
		renderWithRouter(<OIDCHybridFlowV3 />);

		const clientIdInput = screen.getByLabelText(
			/Client ID/i,
		) as HTMLInputElement;
		fireEvent.change(clientIdInput, { target: { value: "test-client-id" } });

		expect(clientIdInput.value).toBe("test-client-id");
	});

	it("shows save credentials button", () => {
		renderWithRouter(<OIDCHybridFlowV3 />);

		expect(screen.getByText("Save Credentials")).toBeInTheDocument();
	});

	it("displays educational content when expanded", () => {
		renderWithRouter(<OIDCHybridFlowV3 />);

		const educationalToggle = screen.getByText(
			"OIDC Hybrid Flow Educational Content",
		);
		fireEvent.click(educationalToggle);

		expect(screen.getByText("What is OIDC Hybrid Flow?")).toBeInTheDocument();
		expect(screen.getByText("Response Types:")).toBeInTheDocument();
		expect(screen.getByText("Security Features:")).toBeInTheDocument();
	});

	it("shows response type options", () => {
		renderWithRouter(<OIDCHybridFlowV3 />);

		const responseTypeSelect = screen.getByLabelText(
			/Response Type/i,
		) as HTMLSelectElement;

		expect(
			responseTypeSelect.querySelector('option[value="code id_token"]'),
		).toBeInTheDocument();
		expect(
			responseTypeSelect.querySelector('option[value="code token"]'),
		).toBeInTheDocument();
		expect(
			responseTypeSelect.querySelector('option[value="code id_token token"]'),
		).toBeInTheDocument();
	});
});

describe("OIDCHybridFlowV3 Integration", () => {
	it("handles form submission with valid data", async () => {
		renderWithRouter(<OIDCHybridFlowV3 />);

		// Fill in required fields
		const authEndpointInput = screen.getByLabelText(
			/Authorization Endpoint/i,
		) as HTMLInputElement;
		const clientIdInput = screen.getByLabelText(
			/Client ID/i,
		) as HTMLInputElement;

		fireEvent.change(authEndpointInput, {
			target: { value: "https://auth.pingone.com/test/as/authorize" },
		});
		fireEvent.change(clientIdInput, { target: { value: "test-client-id" } });

		// Click save button
		const saveButton = screen.getByText("Save Credentials");
		fireEvent.click(saveButton);

		// Verify localStorage was called
		expect(localStorageMock.setItem).toHaveBeenCalledWith(
			"oidc_hybrid_v3_credentials",
			expect.stringContaining("test-client-id"),
		);
	});

	it("disables save button when required fields are missing", () => {
		renderWithRouter(<OIDCHybridFlowV3 />);

		const saveButton = screen.getByText("Save Credentials");
		expect(saveButton).toBeDisabled();
	});
});
