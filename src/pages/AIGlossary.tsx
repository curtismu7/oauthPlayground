import React, { useEffect, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import styled from 'styled-components';
import { FlowHeader } from '../services/flowHeaderService';
import { CollapsibleHeader } from '../services/collapsibleHeaderService';

const PageContainer = styled.main`
	min-height: 100vh;
	background: var(--app-background, #f8f9fa);
	padding: clamp(1.5rem, 4vw, 3rem);
`;

const PageContent = styled.div`
	max-width: 1400px;
	margin: 0 auto;
	display: grid;
	gap: clamp(1.5rem, 3.5vw, 2.5rem);
`;

const SearchBar = styled.div`
	position: relative;
	display: flex;
	align-items: center;
`;

const SearchInput = styled.input`
	width: 100%;
	padding: 1.1rem 3.25rem 1.1rem 3.5rem;
	border-radius: 18px;
	border: 2px solid var(--border-subtle, #e5e7eb);
	font-size: 1rem;
	background: var(--surface-color, #ffffff);
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
	transition: border-color 0.2s ease, box-shadow 0.2s ease;

	&:focus {
		outline: none;
		border-color: var(--primary-color, #4f46e5);
		box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.18);
	}
`;

const SearchIcon = styled(FiSearch)`
	position: absolute;
	left: 1.25rem;
	width: 1.25rem;
	height: 1.25rem;
	color: #9ca3af;
`;

const ClearButton = styled.button<{ $inactive?: boolean }>`
	position: absolute;
	right: 1rem;
	background: transparent;
	border: none;
	color: #9ca3af;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.75rem;
	height: 1.75rem;
	border-radius: 999px;
	cursor: pointer;
	opacity: ${({ $inactive }) => ($inactive ? 0.4 : 1)};
	pointer-events: ${({ $inactive }) => ($inactive ? 'none' : 'auto')};
	transition: color 0.2s ease, background 0.2s ease, opacity 0.2s ease;

	&:hover {
		color: #374151;
		background: rgba(156, 163, 175, 0.12);
	}

	&:focus-visible {
		outline: 2px solid var(--primary-color, #4f46e5);
		outline-offset: 2px;
	}
`;

const CategoryList = styled.section`
	display: grid;
	gap: clamp(1.25rem, 3vw, 1.75rem);
`;

const TermsList = styled.div`
	padding: 0;
	background: rgba(248, 250, 252, 0.65);
`;

const TermsGrid = styled.div`
	display: grid;
	gap: clamp(1rem, 2.5vw, 1.4rem);
	padding: clamp(1.25rem, 3vw, 1.75rem);
`;

const TermItem = styled.div`
	border-left: 4px solid rgba(79, 70, 229, 0.4);
	padding-left: clamp(1rem, 2.5vw, 1.25rem);
	display: grid;
	gap: 0.6rem;
`;

const TermExample = styled.div`
	margin-top: 0.35rem;
	background: rgba(248, 250, 252, 0.9);
	border-radius: 0.6rem;
	padding: 0.85rem 1rem;
	display: grid;
	gap: 0.4rem;
	font-size: 0.95rem;
	color: var(--color-text-secondary, #475569);

	strong {
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #334155;
	}
`;

const CategoryIcon = styled.span`
	font-size: 1.5rem;
`;

const TermTitle = styled.h3`
	margin: 0;
	font-size: clamp(1.05rem, 2.4vw, 1.2rem);
	font-weight: 600;
	color: var(--color-text-primary, #111827);
`;

const TermDefinition = styled.p`
	margin: 0;
	color: var(--color-text-secondary, #475569);
	line-height: 1.7;
	font-size: clamp(0.95rem, 2.2vw, 1.05rem);
`;

const RelatedTerms = styled.div`
	display: inline-flex;
	flex-wrap: wrap;
	gap: 0.4rem;

	span {
		background: rgba(79, 70, 229, 0.15);
		color: var(--primary-color, #4f46e5);
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		font-size: 0.85rem;
	}
`;

const NoResults = styled.div`
	padding: clamp(1.8rem, 4vw, 2.25rem);
	border-radius: 1rem;
	background: rgba(248, 250, 252, 0.85);
	border: 1px dashed rgba(148, 163, 184, 0.6);
	text-align: center;
	display: grid;
	gap: 0.8rem;

	h3 {
		margin: 0;
		size: 1.2rem;
		color: var(--color-text-primary, #111827);
	}

	p {
		margin: 0;
		color: var(--color-text-secondary, #475569);
		font-size: 0.98rem;
	}
`;

const Footer = styled.footer`
	text-align: center;
	color: var(--color-text-muted, #6b7280);
	font-size: 0.95rem;
	padding: 0.5rem 0 1rem;
`;

interface GlossaryTerm {
	term: string;
	definition: string;
	example?: string;
	relatedTerms?: string[];
}

interface GlossaryCategory {
	category: string;
	icon: string;
	terms: GlossaryTerm[];
}

const AIGlossary: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('');

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, []);

	const glossaryData: GlossaryCategory[] = [
		{
			category: 'Core AI Concepts',
			icon: '🧠',
			terms: [
				{
					term: 'Artificial Intelligence (AI)',
					definition:
						'The simulation of human intelligence processes by computer systems, including learning, reasoning, problem-solving, perception, and language understanding. AI systems can analyze data, recognize patterns, make decisions, and adapt to new situations.',
					example:
						'Virtual assistants like Siri and Alexa, recommendation systems on Netflix and Spotify, autonomous vehicles, medical diagnosis systems, and chatbots like ChatGPT.',
					relatedTerms: ['Machine Learning', 'Deep Learning', 'Neural Network'],
				},
				{
					term: 'Machine Learning (ML)',
					definition:
						'A subset of AI that enables systems to automatically learn and improve from experience without being explicitly programmed. ML algorithms build mathematical models based on sample data (training data) to make predictions or decisions.',
					example:
						'Email spam filters that learn to identify spam, fraud detection systems in banking, product recommendations on e-commerce sites, and image recognition in photos apps.',
					relatedTerms: ['Supervised Learning', 'Unsupervised Learning', 'Deep Learning'],
				},
				{
					term: 'Deep Learning',
					definition:
						'A subset of machine learning that uses artificial neural networks with multiple layers (deep neural networks) to progressively extract higher-level features from raw input. Each layer learns to transform its input data into a slightly more abstract representation.',
					example:
						'Image recognition (identifying objects in photos), natural language processing (understanding and generating text), speech recognition (converting speech to text), and autonomous driving systems.',
					relatedTerms: ['Neural Network', 'Transformer', 'CNN'],
				},
				{
					term: 'Neural Network',
					definition:
						'A computing system inspired by biological neural networks, consisting of interconnected nodes (neurons) that process information.',
				},
				{
					term: 'Algorithm',
					definition:
						'A step-by-step procedure or formula for solving a problem or completing a task.',
				},
			],
		},
		{
			category: 'Model Types & Architectures',
			icon: '🏗️',
			terms: [
				{
					term: 'Large Language Model (LLM)',
					definition:
						'AI models with billions of parameters trained on massive text datasets to understand context, generate coherent text, answer questions, translate languages, write code, and perform various language tasks. LLMs use transformer architecture and can be fine-tuned for specific applications.',
					example:
						'GPT-4 (OpenAI), Claude (Anthropic), Gemini (Google), LLaMA (Meta). Used for chatbots, content generation, code completion, translation, summarization, and question answering.',
					relatedTerms: ['Transformer', 'Fine-tuning', 'Prompt Engineering'],
				},
				{
					term: 'Transformer',
					definition:
						"A revolutionary neural network architecture introduced in 2017 ('Attention is All You Need' paper) that uses self-attention mechanisms to process sequential data in parallel rather than sequentially. Transformers can capture long-range dependencies and are the foundation of modern LLMs, enabling breakthrough performance in NLP.",
					example:
						'BERT, GPT series, T5, and virtually all modern LLMs use transformer architecture. Key innovation: attention mechanism allows the model to focus on relevant parts of input regardless of distance, unlike RNNs that process sequentially.',
					relatedTerms: ['Attention Mechanism', 'LLM', 'BERT'],
				},
				{
					term: 'Generative AI',
					definition:
						'AI systems that create new content (text, images, audio, video) based on training data.',
				},
				{
					term: 'Diffusion Model',
					definition:
						'A type of generative model that creates images by gradually removing noise from random data (e.g., DALL-E, Stable Diffusion).',
				},
				{
					term: 'Multimodal Model',
					definition:
						'AI systems that can process and generate multiple types of data (text, images, audio, video) simultaneously.',
				},
				{
					term: 'Foundation Model',
					definition:
						'Large-scale pre-trained models that can be adapted for various downstream tasks.',
				},
				{
					term: 'Embedding',
					definition:
						'A numerical representation of data (text, images) in a high-dimensional space where similar items are closer together.',
				},
			],
		},
		{
			category: 'Training & Fine-Tuning',
			icon: '🎯',
			terms: [
				{
					term: 'Training',
					definition:
						'The process of teaching an AI model by feeding it data and adjusting its parameters to minimize errors.',
				},
				{
					term: 'Pre-training',
					definition:
						'Initial training phase where a model learns general patterns from large datasets.',
				},
				{
					term: 'Fine-tuning',
					definition:
						"The process of taking a pre-trained model and continuing its training on a smaller, task-specific dataset to adapt it for particular applications. Fine-tuning adjusts the model's weights to specialize in specific domains, styles, or tasks while retaining general knowledge.",
					example:
						'Training GPT on medical literature for healthcare applications, adapting a model to write in a specific brand voice, customizing an image model for a particular art style, or specializing a model for legal document analysis.',
					relatedTerms: ['Transfer Learning', 'Pre-training', 'RLHF'],
				},
				{
					term: 'Transfer Learning',
					definition:
						'Using knowledge gained from one task to improve performance on a different but related task.',
				},
				{
					term: 'Reinforcement Learning (RL)',
					definition:
						'Training method where models learn through trial and error, receiving rewards for desired behaviors.',
				},
				{
					term: 'RLHF (Reinforcement Learning from Human Feedback)',
					definition:
						'A training technique where human evaluators rank or rate model outputs, and this feedback is used to train a reward model that guides the AI to generate more helpful, harmless, and honest responses. RLHF is crucial for aligning AI behavior with human preferences and values.',
					example:
						'Used to train ChatGPT and Claude to be more helpful and less harmful. Humans rate different responses to the same prompt, and the model learns to prefer responses that humans rate higher. Essential for reducing toxic outputs and improving instruction-following.',
					relatedTerms: ['Alignment', 'Reinforcement Learning', 'Constitutional AI'],
				},
				{
					term: 'Supervised Learning',
					definition: 'Training with labeled data where the model learns from input-output pairs.',
				},
				{
					term: 'Unsupervised Learning',
					definition:
						'Training with unlabeled data where the model discovers patterns independently.',
				},
				{
					term: 'Overfitting',
					definition:
						'When a model learns training data too well, performing poorly on new, unseen data.',
				},
				{ term: 'Epoch', definition: 'One complete pass through the entire training dataset.' },
			],
		},
		{
			category: 'Model Behavior & Capabilities',
			icon: '⚡',
			terms: [
				{
					term: 'Inference',
					definition:
						'The process of using a trained model to make predictions or generate outputs.',
				},
				{
					term: 'Context Window',
					definition:
						'The maximum amount of text (measured in tokens) that a model can process and remember at once. Everything within the context window is considered when generating responses. Larger context windows allow for processing longer documents and maintaining longer conversations.',
					example:
						"GPT-4 has a 128K token context window (~96,000 words), allowing it to process entire books. Claude 3 supports 200K tokens. Smaller windows (4K-8K) require chunking long documents. Context windows determine how much conversation history or document content the model can 'remember'.",
					relatedTerms: ['Token', 'Attention Mechanism', 'Memory'],
				},
				{
					term: 'Token',
					definition: 'A unit of text (words, subwords, or characters) that models process.',
				},
				{
					term: 'Prompt',
					definition: 'The input text or instructions given to an AI model to generate a response.',
				},
				{
					term: 'Prompt Engineering',
					definition:
						'The art and science of designing and refining input prompts to elicit optimal responses from AI models. Involves understanding model capabilities, using clear instructions, providing examples, setting context, and iteratively improving prompts based on outputs.',
					example:
						"Adding 'Think step by step' for better reasoning, providing few-shot examples, using role-playing ('You are an expert...'), specifying output format, and breaking complex tasks into smaller prompts.",
					relatedTerms: ['Few-shot Learning', 'Chain-of-Thought', 'In-context Learning'],
				},
				{
					term: 'Zero-shot Learning',
					definition: "A model's ability to perform tasks without specific training examples.",
				},
				{
					term: 'Few-shot Learning',
					definition:
						'Providing a model with a few examples to help it understand and perform a task.',
				},
				{
					term: 'In-context Learning',
					definition: "A model's ability to learn from examples provided within the prompt itself.",
				},
				{
					term: 'Chain-of-Thought (CoT)',
					definition:
						"A prompting technique that encourages models to break down complex problems into intermediate reasoning steps before arriving at a final answer. By 'thinking out by step', models can solve more complex problems and provide more accurate results, especially for math, logic, and multi-step reasoning tasks.",
					example:
						"Adding 'Let's think step by step' or 'Show your work' to prompts. For math: 'First, identify what we know... Then, calculate... Finally, verify...'. Dramatically improves performance on reasoning tasks compared to direct answers.",
					relatedTerms: ['Prompt Engineering', 'Reasoning', 'Few-shot Learning'],
				},
				{
					term: 'Reasoning',
					definition:
						'The ability of AI to draw conclusions, make inferences, and solve complex problems.',
				},
			],
		},
		{
			category: 'AI Agents & Applications',
			icon: '🤖',
			terms: [
				{
					term: 'AI Agent',
					definition:
						'An autonomous system that perceives its environment through sensors or data inputs, makes decisions based on that information, and takes actions to achieve specific goals. Agents can operate independently, learn from experience, and adapt their behavior over time.',
					example:
						'Customer service chatbots that handle inquiries autonomously, trading bots that make investment decisions, smart home systems that adjust temperature and lighting, and game-playing AI like AlphaGo.',
					relatedTerms: ['Agentic AI', 'RAG', 'Tool Use'],
				},
				{
					term: 'RAG (Retrieval-Augmented Generation)',
					definition:
						'A technique that enhances LLM responses by first retrieving relevant information from external knowledge bases, databases, or documents, then using that context to generate more accurate and up-to-date answers. RAG combines the power of information retrieval with generative AI.',
					example:
						'Enterprise chatbots that access company documents, customer support systems that reference product manuals, research assistants that cite academic papers, and AI systems that need access to current information beyond their training data.',
					relatedTerms: ['Vector Database', 'Semantic Search', 'Embedding'],
				},
				{
					term: 'Vector Database',
					definition:
						'A specialized database designed to store, index, and query high-dimensional vector embeddings efficiently. Unlike traditional databases that search for exact matches, vector databases find semantically similar items using distance metrics like cosine similarity or euclidean distance.',
					example:
						'Pinecone, Weaviate, Milvus, and Chroma are popular vector databases. Used for semantic search, recommendation systems, RAG applications, image similarity search, and finding related documents based on meaning rather than keywords.',
					relatedTerms: ['Embedding', 'Semantic Search', 'RAG'],
				},
				{
					term: 'Semantic Search',
					definition: 'Search based on meaning and context rather than exact keyword matching.',
				},
				{
					term: 'Tool Use / Function Calling',
					definition: 'The ability of AI models to use external tools or APIs to complete tasks.',
				},
				{
					term: 'Agentic AI',
					definition:
						'AI systems that can autonomously plan, reason, make decisions, and execute actions over extended periods without continuous human supervision. Agentic AI goes beyond reactive systems by maintaining goals, adapting to changing conditions, learning from outcomes, and coordinating multiple capabilities to achieve complex objectives. These systems exhibit agency - the ability to act independently while being accountable for their actions.',
					example:
						'Autonomous research assistants that plan experiments, gather data, analyze results, and write reports; AI software developers that understand requirements, design architectures, write code, test implementations, and deploy applications; or AI traders that monitor markets, assess risks, execute trades, and manage portfolios across multiple time zones.',
					relatedTerms: [
						'AI Agent',
						'Autonomous Systems',
						'Planning',
						'Tool Use',
						'Multi-Agent Systems',
					],
				},
			],
		},
		{
			category: 'Performance & Evaluation',
			icon: '📊',
			terms: [
				{
					term: 'Benchmark',
					definition: 'Standardized tests used to evaluate and compare AI model performance.',
				},
				{ term: 'Accuracy', definition: 'The percentage of correct predictions made by a model.' },
				{
					term: 'Hallucination',
					definition:
						'When AI models generate information that is factually incorrect, nonsensical, or not grounded in their training data, yet present it confidently as truth. This occurs because models predict plausible-sounding text rather than retrieving verified facts.',
					example:
						'An AI citing non-existent research papers, making up statistics, creating fake historical events, inventing product features, or providing incorrect medical advice. Common in creative tasks where the model fills gaps with plausible but false information.',
					relatedTerms: ['RAG', 'Grounding', 'Fact-checking'],
				},
				{
					term: 'Bias',
					definition:
						'Systematic errors or unfair outcomes in AI systems, often reflecting biases in training data.',
				},
				{ term: 'Latency', definition: 'The time delay between input and output in AI systems.' },
				{
					term: 'Throughput',
					definition: 'The amount of data or requests an AI system can process in a given time.',
				},
				{
					term: 'Perplexity',
					definition: 'A measurement of how well a model predicts text; lower is better.',
				},
			],
		},
		{
			category: 'Safety & Ethics',
			icon: '🛡️',
			terms: [
				{
					term: 'Alignment',
					definition:
						'The challenge of ensuring AI systems understand and act according to human values, intentions, and ethical principles. Alignment research focuses on making AI helpful, harmless, and honest, preventing unintended behaviors, and ensuring AI goals match human goals even as systems become more capable.',
					example:
						"Training models to refuse harmful requests, ensuring AI assistants don't manipulate users, preventing bias in decision-making systems, and developing AI that remains beneficial as it becomes more powerful. RLHF is a key alignment technique.",
					relatedTerms: ['RLHF', 'AI Safety', 'Constitutional AI'],
				},
				{
					term: 'Red Teaming',
					definition:
						'Testing AI systems by deliberately trying to make them produce harmful outputs.',
				},
				{ term: 'Jailbreaking', definition: 'Attempts to bypass safety guardrails in AI systems.' },
				{
					term: 'Constitutional AI',
					definition: 'Training approach that uses principles and rules to guide model behavior.',
				},
				{
					term: 'AI Safety',
					definition:
						'Research and practices aimed at making AI systems reliable, secure, and beneficial.',
				},
				{
					term: 'Explainable AI (XAI)',
					definition: 'Methods to make AI decision-making processes transparent and interpretable.',
				},
			],
		},
		{
			category: 'Technical Components',
			icon: '⚙️',
			terms: [
				{
					term: 'Parameter',
					definition:
						"Numerical values in a model that are learned during training (e.g., 'GPT-4 has billions of parameters').",
				},
				{
					term: 'Weights',
					definition:
						'The parameters that determine the strength of connections in neural networks.',
				},
				{
					term: 'Activation Function',
					definition: 'Mathematical function that determines whether a neuron should be activated.',
				},
				{
					term: 'Attention Mechanism',
					definition: 'Component allowing models to focus on relevant parts of input data.',
				},
				{
					term: 'Temperature',
					definition:
						'A parameter (typically 0.0 to 2.0) that controls the randomness and creativity of AI-generated outputs. Lower temperatures make the model more focused and deterministic (choosing the most likely next token), while higher temperatures increase randomness and creativity but may reduce coherence.',
					example:
						'Temperature 0.0-0.3: Factual tasks, code generation, data extraction. Temperature 0.7-1.0: General conversation, balanced creativity. Temperature 1.5-2.0: Creative writing, brainstorming, poetry. Setting temperature to 0 makes outputs reproducible.',
					relatedTerms: ['Top-p Sampling', 'Inference', 'Token'],
				},
				{
					term: 'Top-p Sampling',
					definition: 'Technique for generating text by sampling from the most probable tokens.',
				},
				{
					term: 'Gradient Descent',
					definition: 'Optimization algorithm used to minimize errors during training.',
				},
				{
					term: 'Backpropagation',
					definition:
						'Method for calculating gradients and updating model weights during training.',
				},
			],
		},
		{
			category: 'Emerging Concepts',
			icon: '🚀',
			terms: [
				{
					term: 'Mixture of Experts (MoE)',
					definition:
						'Architecture where multiple specialized sub-models (experts) handle different types of inputs.',
				},
				{
					term: 'Quantization',
					definition:
						'A technique for reducing model size and computational requirements by representing weights and activations with lower-precision numbers (e.g., 8-bit or 4-bit integers instead of 32-bit floating point). This makes models faster and more memory-efficient with minimal accuracy loss.',
					example:
						'Reducing a 70B parameter model from 140GB (16-bit) to 35GB (4-bit), enabling it to run on consumer GPUs. GGUF and GPTQ are popular quantization formats. Essential for deploying large models on edge devices and reducing inference costs.',
					relatedTerms: ['Model Compression', 'Edge AI', 'Distillation'],
				},
				{
					term: 'Distillation',
					definition: "Creating smaller, faster models that mimic larger models' behavior.",
				},
				{
					term: 'Synthetic Data',
					definition:
						'Artificially generated data used for training when real data is scarce or sensitive.',
				},
				{
					term: 'Federated Learning',
					definition: 'Training models across decentralized devices while keeping data local.',
				},
				{
					term: 'Edge AI',
					definition: 'Running AI models on local devices rather than cloud servers.',
				},
				{
					term: 'Model Compression',
					definition: 'Techniques to reduce model size while maintaining performance.',
				},
			],
		},
		{
			category: 'Specific Applications',
			icon: '💡',
			terms: [
				{
					term: 'Computer Vision',
					definition: 'AI field focused on enabling machines to interpret visual information.',
				},
				{
					term: 'Natural Language Processing (NLP)',
					definition: 'AI field focused on understanding and generating human language.',
				},
				{ term: 'Speech Recognition', definition: 'Converting spoken language into text.' },
				{ term: 'Text-to-Speech (TTS)', definition: 'Converting written text into spoken audio.' },
				{
					term: 'Sentiment Analysis',
					definition: 'Determining emotional tone in text.',
				},
				{
					term: 'Named Entity Recognition (NER)',
					definition:
						'Identifying and classifying named entities (people, places, organizations) in text.',
				},
				{
					term: 'Object Detection',
					definition: 'Identifying and locating objects within images or video.',
				},
				{
					term: 'Autonomous Systems',
					definition:
						'Self-governing systems that make decisions without human intervention (e.g., self-driving cars).',
				},
			],
		},
		{
			category: 'OAuth & Authentication Protocols',
			icon: '🔐',
			terms: [
				{
					term: 'OAuth 2.0',
					definition:
						'An open standard for access delegation commonly used for token-based authentication and authorization on the internet. OAuth 2.0 enables third-party applications to obtain limited access to an HTTP service, either on behalf of a resource owner or by allowing the third-party application to obtain access on its own behalf.',
					example:
						'When you log into a website using your Google account, OAuth 2.0 is the protocol that allows the website to access your Google profile information without you sharing your Google password directly.',
					relatedTerms: [
						'Authorization Code Flow',
						'Client Credentials Flow',
						'OpenID Connect',
						'JWT',
					],
				},
				{
					term: 'OpenID Connect (OIDC)',
					definition:
						'A simple identity layer on top of the OAuth 2.0 protocol that allows clients to verify the identity of end-users based on authentication performed by an authorization server. OIDC extends OAuth 2.0 to provide identity information (ID tokens) in addition to access tokens.',
					example:
						'Single sign-on (SSO) systems where logging into one application automatically logs you into others, or identity verification for banking apps that need to confirm your identity through a trusted identity provider.',
					relatedTerms: ['OAuth 2.0', 'ID Token', 'Identity Provider', 'SSO'],
				},
				{
					term: 'JSON Web Token (JWT)',
					definition:
						'An open standard (RFC 7519) for securely transmitting information between parties as a JSON object. JWTs are commonly used for authentication and information exchange, containing claims about an entity (user) and additional metadata. JWTs are digitally signed and can be encrypted.',
					example:
						'Access tokens in OAuth flows that contain user identity information and permissions, session tokens that maintain user login state across requests, or API keys that include expiration times and access scopes.',
					relatedTerms: ['Access Token', 'ID Token', 'Claims', 'Digital Signature'],
				},
				{
					term: 'Authorization Code Flow',
					definition:
						'The most common and secure OAuth 2.0 flow for web applications. The client redirects the user to the authorization server, which authenticates the user and returns an authorization code. The client then exchanges this code for access and refresh tokens.',
					example:
						'Web applications like GitHub or Facebook login integrations where users are redirected to authenticate and then returned to the original application with a secure authorization code.',
					relatedTerms: ['OAuth 2.0', 'Authorization Code', 'PKCE', 'Refresh Token'],
				},
				{
					term: 'Client Credentials Flow',
					definition:
						'An OAuth 2.0 flow used for machine-to-machine authentication where the client application itself is the resource owner. No user interaction is required - the client authenticates directly with the authorization server using its client ID and secret to obtain an access token.',
					example:
						'API services that need to communicate with each other, such as a payment processor calling a banking API, or microservices in a server-to-server architecture accessing shared resources.',
					relatedTerms: ['OAuth 2.0', 'Machine-to-Machine', 'Client Secret', 'Service Account'],
				},
				{
					term: 'Device Code Flow',
					definition:
						'An OAuth 2.0 extension (RFC 8628) designed for devices with limited input capabilities, such as smart TVs, gaming consoles, or IoT devices. The device displays a code that users enter on a separate device (phone/computer) to complete authentication.',
					example:
						'Smart TV apps that display a code for you to enter on your phone, gaming consoles that require authentication through a web browser, or IoT devices that need user authorization without keyboards.',
					relatedTerms: [
						'OAuth 2.0',
						'Device Authorization',
						'Input-Constrained Devices',
						'Polling',
					],
				},
				{
					term: 'Implicit Flow',
					definition:
						'A simplified OAuth 2.0 flow for public clients (SPAs, mobile apps) where access tokens are returned directly in the redirect URI fragment. While simpler, it has security limitations and is being phased out in favor of Authorization Code Flow with PKCE.',
					example:
						'Legacy single-page applications that needed quick token access, though modern applications now use Authorization Code Flow with PKCE for better security.',
					relatedTerms: ['OAuth 2.0', 'SPA', 'PKCE', 'Security'],
				},
				{
					term: 'PKCE (Proof Key for Code Exchange)',
					definition:
						'A security extension to OAuth 2.0 Authorization Code Flow that prevents authorization code interception attacks. PKCE uses a cryptographically random code verifier and its hash (code challenge) to ensure only the legitimate client can exchange the authorization code for tokens.',
					example:
						'Mobile apps and single-page applications that store client secrets in potentially insecure environments, requiring additional protection against code interception attacks.',
					relatedTerms: ['Authorization Code Flow', 'Code Challenge', 'Code Verifier', 'Security'],
				},
				{
					term: 'Refresh Token',
					definition:
						'A long-lived credential used to obtain new access tokens without requiring user re-authentication. Refresh tokens are issued alongside access tokens and have longer expiration times, enabling seamless user experiences while maintaining security.',
					example:
						'Mobile apps that stay logged in for extended periods, web applications that maintain user sessions across browser restarts, or APIs that need continuous access to user resources.',
					relatedTerms: ['Access Token', 'Token Rotation', 'Session Management', 'Security'],
				},
				{
					term: 'Access Token',
					definition:
						'A short-lived credential that grants access to protected resources. Access tokens are presented to resource servers to prove authorization and are typically JWTs containing user identity, permissions (scopes), and expiration information.',
					example:
						'Bearer tokens sent in HTTP Authorization headers to access APIs, session cookies that prove user authentication, or temporary credentials for cloud service access.',
					relatedTerms: ['JWT', 'Bearer Token', 'Scopes', 'Authorization'],
				},
				{
					term: 'ID Token',
					definition:
						'A JWT issued by the OpenID Connect provider containing user identity information (claims) such as name, email, and unique identifier. ID tokens are consumed by the client application and not sent to resource servers.',
					example:
						'User profile information displayed after login, identity verification for regulatory compliance, or user attributes used for personalization in applications.',
					relatedTerms: ['OpenID Connect', 'JWT', 'Claims', 'UserInfo'],
				},
				{
					term: 'Scopes',
					definition:
						'Permissions or access levels that define what resources an application can access on behalf of a user. Scopes limit the authorization granted to applications, following the principle of least privilege.',
					example:
						"'read:profile' scope allowing access to basic user information, 'write:posts' scope for social media posting, or 'admin:users' scope for user management in enterprise applications.",
					relatedTerms: ['Authorization', 'Least Privilege', 'Permissions', 'OAuth 2.0'],
				},
				{
					term: 'Identity Provider (IdP)',
					definition:
						'A service that creates, maintains, and manages identity information while providing authentication services to relying applications. IdPs verify user identities and issue tokens containing identity claims.',
					example:
						'Google, Microsoft Azure AD, Auth0, or Okta as identity providers for applications, corporate Active Directory for employee authentication, or social login providers like Facebook and Twitter.',
					relatedTerms: ['OpenID Connect', 'Authentication', 'SSO', 'Federation'],
				},
				{
					term: 'Resource Server',
					definition:
						'An API or service that hosts protected resources and requires valid access tokens for authorization. Resource servers validate tokens and enforce access policies based on token claims and scopes.',
					example:
						'REST APIs serving user data, cloud storage services like Google Drive, or microservices in a distributed architecture that require authenticated access.',
					relatedTerms: ['Access Token', 'Authorization', 'API', 'Token Validation'],
				},
				{
					term: 'Client Application',
					definition:
						'The application requesting access to resources on behalf of a user or itself. Clients can be web applications, mobile apps, SPAs, or server-side applications, each with different security considerations and OAuth flows.',
					example:
						'Web browsers accessing Gmail, mobile apps connecting to banking services, server applications calling payment processors, or IoT devices requesting cloud service access.',
					relatedTerms: ['OAuth 2.0', 'Client Types', 'Confidential Client', 'Public Client'],
				},
				{
					term: 'Authorization Server',
					definition:
						'The server that issues access tokens and refresh tokens after successfully authenticating the resource owner and obtaining authorization. The authorization server is the central component that orchestrates the OAuth dance.',
					example:
						'Google OAuth servers, Azure AD authorization endpoints, or custom OAuth servers in enterprise environments that handle the complex token issuance and validation logic.',
					relatedTerms: ['OAuth 2.0', 'Token Issuance', 'Authentication', 'Authorization'],
				},
			],
		},
		{
			category: 'Agentic Frameworks & Tools',
			icon: '🔧',
			terms: [
				{
					term: 'OpenAI Swarm',
					definition:
						'Experimental educational framework from OpenAI for building lightweight multi-agent systems using two primitives: Agents (with instructions and tools) and handoffs (transfers between agents). Stateless and powered by Chat Completions API.',
					example:
						'Building a customer service system where a routing agent hands off to a billing specialist agent, which then hands off to a technical support agent based on query complexity and customer needs.',
					relatedTerms: ['Agent Handoff', 'Multi-Agent Systems', 'Workflow Orchestration'],
				},
				{
					term: 'OpenAI Agents SDK',
					definition:
						'Production-ready upgrade of Swarm featuring automatic conversation history management (Sessions), guardrails for validation, built-in tracing, and support for complex multi-agent workflows.',
					example:
						'Enterprise customer support system with automatic session tracking, compliance guardrails preventing sharing of sensitive data, and detailed audit trails for regulatory requirements.',
					relatedTerms: ['OpenAI Swarm', 'Sessions', 'Guardrails', 'Tracing'],
				},
				{
					term: 'LangChain',
					definition:
						'Popular framework for building applications with LLMs, providing tools for chaining prompts, memory management, agent creation, and integration with various data sources and APIs.',
					example:
						'Building a research assistant that chains together web search, document analysis, and report generation. LangChain handles the workflow: search for papers → extract key insights → synthesize findings → generate summary report.',
					relatedTerms: ['RAG', 'Vector Database', 'Chain-of-Thought', 'Tool Use'],
				},
				{
					term: 'CrewAI',
					definition:
						'Framework for orchestrating role-playing autonomous AI agents, enabling them to work together as a crew to accomplish complex tasks through collaboration and delegation.',
					example:
						'Marketing campaign crew: Research Agent gathers market data, Creative Agent generates content ideas, Copywriter Agent creates ad copy, and Analytics Agent tracks performance metrics. They collaborate to produce a complete campaign strategy.',
					relatedTerms: ['Multi-Agent Systems', 'Role-playing', 'Delegation', 'Collaboration'],
				},
				{
					term: 'AutoGen',
					definition:
						"Microsoft's open-source framework for building multi-agent conversational systems, supporting complex agent interactions, code execution, and human-in-the-loop workflows.",
					example:
						'Software development team simulation: Product Manager agent defines requirements, Architect agent designs system, Developer agent writes code, Tester agent validates functionality, and Code Reviewer agent ensures quality standards.',
					relatedTerms: [
						'Human-in-the-Loop',
						'Code Execution',
						'Conversational AI',
						'Multi-Agent Systems',
					],
				},
				{
					term: 'LlamaIndex',
					definition:
						'Framework (formerly GPT Index) specialized in connecting LLMs with external data sources, offering advanced indexing and retrieval capabilities for building context-aware AI applications.',
					example:
						'Corporate knowledge base assistant that indexes internal documents, emails, and wikis. When employees ask questions, LlamaIndex retrieves relevant context from multiple sources to provide comprehensive, up-to-date answers.',
					relatedTerms: ['RAG', 'Vector Database', 'Semantic Search', 'Indexing'],
				},
				{
					term: 'Langroid',
					definition:
						'Multi-agent framework from CMU and UW-Madison researchers, known for mature orchestration mechanisms and broad LLM compatibility beyond OpenAI models.',
					example:
						'Academic research assistant using Claude, GPT-4, and local models. Langroid orchestrates different models for different tasks: Claude for analysis, GPT-4 for synthesis, and local models for privacy-sensitive operations.',
					relatedTerms: [
						'Multi-Agent Systems',
						'LLM Compatibility',
						'Orchestration',
						'Model Selection',
					],
				},
				{
					term: 'n8n',
					definition:
						'Visual workflow automation platform that combines AI capabilities with business process automation, allowing users to build AI agents and agentic workflows through drag-and-drop interface or code. Supports 400+ integrations, multiple LLMs, and both cloud and self-hosted deployment.',
					example:
						'E-commerce automation: Customer inquiry triggers AI analysis, routes to appropriate department, generates personalized response, updates CRM, and schedules follow-up. All orchestrated visually without coding.',
					relatedTerms: [
						'Workflow Automation',
						'No-code',
						'Business Process Automation',
						'Integration',
					],
				},
				{
					term: 'Zapier',
					definition:
						'No-code automation platform connecting web applications, increasingly incorporating AI capabilities for intelligent workflow automation.',
					example:
						'Lead qualification automation: New form submission triggers AI analysis of lead quality, routes high-value leads to sales team, sends nurturing emails to others, and updates multiple CRM systems automatically.',
					relatedTerms: ['No-code', 'Workflow Automation', 'Integration', 'Business Automation'],
				},
				{
					term: 'Make (formerly Integromat)',
					definition:
						'Visual automation platform for connecting apps and services, featuring advanced scenario building with AI integration capabilities.',
					example:
						'Content marketing automation: AI analyzes trending topics, generates content ideas, creates social media posts, schedules publication across platforms, and tracks engagement metrics in a unified dashboard.',
					relatedTerms: [
						'Visual Programming',
						'AI Integration',
						'Content Automation',
						'Scenario Building',
					],
				},
				{
					term: 'Agent Handoff',
					definition:
						'The process where one AI agent transfers control or delegates tasks to another specialized agent, enabling multi-agent collaboration and workflow orchestration.',
					example:
						'Customer service escalation: Initial support agent handles basic queries, hands off complex technical issues to specialist agent, which then hands off billing disputes to finance agent, ensuring each query reaches the most qualified handler.',
					relatedTerms: [
						'Multi-Agent Systems',
						'Delegation',
						'Workflow Orchestration',
						'Specialization',
					],
				},
				{
					term: 'Human-in-the-Loop (HITL)',
					definition:
						'Design pattern where human oversight, approval, or intervention is required at critical points in AI agent workflows before actions are executed.',
					example:
						'Financial trading system where AI agents analyze markets and suggest trades, but human traders must approve transactions over $10,000 before execution, ensuring human oversight for high-value decisions.',
					relatedTerms: ['Workflow Orchestration', 'Approval Gates', 'Human Oversight', 'Safety'],
				},
				{
					term: 'Workflow Orchestration',
					definition:
						'The coordination and management of complex multi-step processes involving AI agents, tools, APIs, and human interventions in automated systems.',
					example:
						'Insurance claim processing: Document analysis agent extracts information, fraud detection agent assesses risk, pricing agent calculates settlement, human adjuster reviews complex cases, and notification agent updates all parties.',
					relatedTerms: ['Multi-Agent Systems', 'Process Management', 'Automation', 'Coordination'],
				},
			],
		},
		{
			category: 'Apple AI/ML Frameworks',
			icon: '🍎',
			terms: [
				{
					term: 'Core ML',
					definition:
						"Apple's primary framework for integrating machine learning models into iOS, macOS, watchOS, and tvOS apps, offering Swift APIs for loading and running ML models with on-device processing.",
					example:
						"Photo app using Core ML to run an image classification model locally, identifying objects in photos without sending data to servers. The model runs efficiently on the device's Neural Engine for real-time processing.",
					relatedTerms: ['On-device AI', 'Neural Engine', 'Model Optimization', 'Privacy'],
				},
				{
					term: 'Foundation Models Framework',
					definition:
						"Apple's newest framework providing direct access to on-device foundation models at the core of Apple Intelligence, with native Swift support enabling features with minimal code.",
					example:
						'Developer building a note-taking app that uses the Foundation Models Framework to automatically summarize meeting notes, extract action items, and suggest follow-up questions, all running locally on the device.',
					relatedTerms: ['Apple Intelligence', 'On-device AI', 'Foundation Models', 'Swift'],
				},
				{
					term: 'Create ML',
					definition:
						"Apple's tool for training custom machine learning models using Swift and Xcode's graphical interface, enabling developers to create models without deep ML expertise.",
					example:
						"Fitness app developer uses Create ML to train a custom model that recognizes different workout movements using iPhone's motion sensors, then deploys it to the app for real-time exercise tracking and form analysis.",
					relatedTerms: ['Model Training', 'Swift', 'Xcode', 'Custom Models'],
				},
				{
					term: 'MLX',
					definition:
						'Efficient array framework for numerical computing and machine learning on Apple silicon, allowing developers to experiment, train, and fine-tune models on Mac with unified memory.',
					example:
						'Researcher fine-tuning a language model for medical applications using MLX on Mac Studio, leveraging the unified memory architecture to train larger models than possible on traditional GPUs with separate VRAM.',
					relatedTerms: [
						'Apple Silicon',
						'Unified Memory',
						'Model Fine-tuning',
						'Numerical Computing',
					],
				},
				{
					term: 'Vision Framework',
					definition:
						'Apple framework offering APIs for computer vision tasks including image analysis, face detection, text recognition, object detection, and barcode scanning.',
					example:
						'Shopping app using Vision Framework to scan product barcodes, recognize text on packaging for nutritional information, and detect faces for personalized recommendations, all processed locally on device.',
					relatedTerms: [
						'Computer Vision',
						'Face Detection',
						'Text Recognition',
						'Object Detection',
					],
				},
				{
					term: 'Natural Language Framework',
					definition:
						'Apple framework providing APIs for natural language processing tasks such as tokenization, language identification, sentiment analysis, and named entity recognition.',
					example:
						'News app using Natural Language Framework to automatically detect article language, extract key entities (people, places, organizations), analyze sentiment, and categorize articles by topic for better user organization.',
					relatedTerms: ['NLP', 'Tokenization', 'Sentiment Analysis', 'Named Entity Recognition'],
				},
				{
					term: 'Speech Framework',
					definition:
						'Apple framework for speech recognition and audio analysis, enabling apps to transcribe speech to text.',
					example:
						'Accessibility app using Speech Framework to provide real-time captioning for deaf users during video calls, transcribing speech with high accuracy and supporting multiple languages.',
					relatedTerms: ['Speech Recognition', 'Audio Analysis', 'Accessibility', 'Transcription'],
				},
				{
					term: 'Sound Analysis Framework',
					definition:
						'Apple framework for analyzing and identifying specific sounds within audio content, recognizing over 300 types of sounds.',
					example:
						'Smart home app using Sound Analysis Framework to detect smoke alarms, doorbells, baby cries, or breaking glass, triggering appropriate alerts and automations based on recognized sounds.',
					relatedTerms: ['Audio Analysis', 'Sound Classification', 'Smart Home', 'Event Detection'],
				},
			],
		},
		{
			category: 'Enhanced AI Terms',
			icon: '🚀',
			terms: [
				{
					term: 'Agentic AI',
					definition:
						'AI systems that can autonomously plan, execute, and adapt their actions to achieve complex goals without constant human intervention, representing a significant advancement in AI capabilities.',
					example:
						'An AI assistant that can autonomously research a topic, gather information from multiple sources, analyze the data, and present a comprehensive report without human oversight.',
					relatedTerms: ['Autonomous AI', 'Goal-oriented AI', 'Self-directed AI', 'AI Agents'],
				},
				{
					term: 'Retrieval-Augmented Generation (RAG)',
					definition:
						'A technique that combines information retrieval with text generation, allowing AI models to access and incorporate external knowledge sources to provide more accurate and up-to-date responses.',
					example:
						'A customer service chatbot that retrieves relevant product information from a knowledge base and uses it to generate accurate, contextual responses to customer inquiries.',
					relatedTerms: ['Information Retrieval', 'Knowledge Base', 'Context-aware AI', 'External Knowledge'],
				},
				{
					term: 'Few-shot Learning',
					definition:
						'The ability of AI models to learn new tasks or concepts from just a few examples, demonstrating rapid adaptation and generalization capabilities.',
					example:
						'A language model that can learn to translate between two new languages after seeing only a few example sentence pairs, without extensive retraining.',
					relatedTerms: ['Zero-shot Learning', 'Meta-learning', 'Adaptation', 'Generalization'],
				},
				{
					term: 'Chain-of-Thought (CoT)',
					definition:
						'A prompting technique that encourages AI models to show their reasoning process step-by-step, leading to more accurate and interpretable results.',
					example:
						'Asking an AI to solve a math problem by showing each step of calculation, making the reasoning process transparent and allowing for verification of the logic.',
					relatedTerms: ['Reasoning', 'Interpretability', 'Step-by-step Processing', 'Transparency'],
				},
				{
					term: 'Multimodal AI',
					definition:
						'AI systems that can process and understand multiple types of data simultaneously, such as text, images, audio, and video, enabling more comprehensive understanding.',
					example:
						'An AI system that can analyze a video to understand both the visual content and spoken dialogue, then generate a summary that incorporates both visual and auditory information.',
					relatedTerms: ['Cross-modal Learning', 'Multimedia AI', 'Sensory Integration', 'Unified Processing'],
				},
				{
					term: 'Constitutional AI',
					definition:
						'An approach to AI alignment that trains models to follow a set of principles or "constitution" that defines acceptable behavior, helping ensure AI systems act in accordance with human values.',
					example:
						'An AI assistant trained with constitutional principles that prevent it from generating harmful content, respecting privacy, and maintaining helpfulness while avoiding bias.',
					relatedTerms: ['AI Alignment', 'Ethical AI', 'Value Alignment', 'Safety Principles'],
				},
				{
					term: 'In-context Learning',
					definition:
						'The ability of large language models to learn new tasks or adapt their behavior based on examples provided within the input context, without requiring model updates.',
					example:
						'Providing a few examples of a specific writing style in the prompt, and the AI model adapts its output to match that style for subsequent requests.',
					relatedTerms: ['Context Adaptation', 'Prompt Engineering', 'Dynamic Learning', 'Task Adaptation'],
				},
				{
					term: 'Reinforcement Learning from Human Feedback (RLHF)',
					definition:
						'A training method that uses human preferences to guide AI model behavior, allowing models to learn complex behaviors that are difficult to specify directly.',
					example:
						'Training a chatbot by having humans rate different responses, then using these ratings to fine-tune the model to generate more helpful and appropriate responses.',
					relatedTerms: ['Human Feedback', 'Preference Learning', 'Model Alignment', 'Behavioral Training'],
				},
				{
					term: 'Emergent Capabilities',
					definition:
						'Abilities that appear in AI models as they scale up, often unexpectedly, representing behaviors or skills that weren\'t explicitly trained for.',
					example:
						'A language model that suddenly demonstrates mathematical reasoning abilities or code generation skills that weren\'t part of its original training objectives.',
					relatedTerms: ['Scaling Laws', 'Unexpected Behaviors', 'Model Scaling', 'Capability Emergence'],
				},
				{
					term: 'Tool Use (AI)',
					definition:
						'The ability of AI systems to interact with external tools, APIs, and systems to accomplish tasks that require capabilities beyond text generation.',
					example:
						'An AI assistant that can search the web for current information, use a calculator for complex computations, and interact with databases to provide comprehensive answers.',
					relatedTerms: ['API Integration', 'External Tools', 'Function Calling', 'System Interaction'],
				},
				{
					term: 'Hallucination (AI)',
					definition:
						'The tendency of AI models to generate plausible-sounding but factually incorrect or nonsensical information, often with high confidence.',
					example:
						'An AI model confidently stating that a fictional character won a real Nobel Prize, or providing detailed but completely fabricated historical events.',
					relatedTerms: ['Factual Accuracy', 'Confidence Calibration', 'Truthfulness', 'Reliability'],
				},
				{
					term: 'Prompt Engineering',
					definition:
						'The practice of designing and optimizing input prompts to achieve desired outputs from AI models, involving careful crafting of instructions, examples, and context.',
					example:
						'Crafting a prompt that includes specific instructions, examples, and formatting requirements to get an AI to generate a professional email in a particular tone and style.',
					relatedTerms: ['Input Optimization', 'Instruction Design', 'Context Crafting', 'Output Control'],
				},
				{
					term: 'Parameter-Efficient Fine-tuning',
					definition:
						'Methods for adapting large language models to specific tasks while updating only a small fraction of the model parameters, making fine-tuning more efficient and accessible.',
					example:
						'Using LoRA (Low-Rank Adaptation) to fine-tune a large language model for medical text analysis by updating only 1% of the model parameters instead of retraining the entire model.',
					relatedTerms: ['LoRA', 'Adapter Layers', 'Efficient Training', 'Model Adaptation'],
				},
				{
					term: 'AI Safety',
					definition:
						'The field focused on ensuring AI systems are beneficial, controllable, and aligned with human values, addressing risks from misaligned AI behavior.',
					example:
						'Research into making AI systems that can be reliably shut down, that won\'t pursue unintended goals, and that can be aligned with complex human values and preferences.',
					relatedTerms: ['AI Alignment', 'Robustness', 'Controllability', 'Value Alignment'],
				},
				{
					term: 'Interpretability',
					definition:
						'The ability to understand and explain how AI models make decisions, including which features or inputs most influence the model\'s outputs.',
					example:
						'Using attention visualization to see which words in a sentence a language model focuses on when making a classification decision, helping understand the model\'s reasoning process.',
					relatedTerms: ['Explainability', 'Transparency', 'Model Understanding', 'Decision Analysis'],
				},
				{
					term: 'Federated Learning',
					definition:
						'A distributed machine learning approach where models are trained across multiple decentralized devices or servers while keeping data localized and private.',
					example:
						'Training a predictive text model across millions of smartphones without ever collecting the actual text data, instead sending only model updates to a central server.',
					relatedTerms: ['Privacy-preserving ML', 'Distributed Training', 'Data Privacy', 'Decentralized Learning'],
				},
				{
					term: 'Transfer Learning',
					definition:
						'The practice of applying knowledge gained from one task to improve performance on a related but different task, leveraging pre-trained models.',
					example:
						'Using a model pre-trained on general language understanding to quickly adapt to medical text analysis, requiring much less training data than starting from scratch.',
					relatedTerms: ['Pre-trained Models', 'Domain Adaptation', 'Knowledge Transfer', 'Model Reuse'],
				},
				{
					term: 'Adversarial Examples',
					definition:
						'Inputs designed to fool AI models by making small, often imperceptible changes that cause the model to make incorrect predictions.',
					example:
						'Adding subtle noise to an image that makes a computer vision model misclassify a stop sign as a speed limit sign, despite the image looking normal to humans.',
					relatedTerms: ['Robustness', 'Security', 'Model Vulnerabilities', 'Attack Resistance'],
				},
				{
					term: 'Continual Learning',
					definition:
						'The ability of AI systems to learn new tasks or information over time without forgetting previously learned knowledge, mimicking human learning.',
					example:
						'An AI system that learns to recognize new types of objects in images while maintaining its ability to recognize previously learned object categories.',
					relatedTerms: ['Lifelong Learning', 'Catastrophic Forgetting', 'Incremental Learning', 'Knowledge Retention'],
				},
				{
					term: 'Neural Architecture Search (NAS)',
					definition:
						'Automated methods for designing optimal neural network architectures, using AI to design AI models for specific tasks.',
					example:
						'Using automated search algorithms to discover the most efficient neural network structure for image classification on mobile devices, balancing accuracy and computational requirements.',
					relatedTerms: ['Automated ML', 'Architecture Optimization', 'Model Design', 'Efficiency Search'],
				},
			],
		},
		{
			category: 'Enhanced Professional Edition',
			icon: '📋',
			terms: [
				{
					term: 'AI (Artificial Intelligence)',
					definition:
						'Systems capable of performing tasks that normally require human intelligence, such as reasoning, planning, perception, or decision-making. AI enables machines to adapt to new inputs and perform human-like activities in domains ranging from automation to predictive analytics.',
					example:
						'An AI system that analyzes medical images to detect cancer, makes investment decisions based on market data, or processes natural language to provide customer support.',
					relatedTerms: ['Machine Learning', 'Deep Learning', 'Neural Networks', 'Automation'],
				},
				{
					term: 'LLM (Large Language Model)',
					definition:
						'A category of AI models trained on massive text datasets to process, understand, and generate human language. LLMs are the foundation of modern conversational AI, enabling natural interactions, summarization, translation, and code generation.',
					example:
						'ChatGPT, Claude, or GPT-4 analyzing a legal document, translating between languages, writing code, or engaging in natural conversation with users.',
					relatedTerms: ['Transformer Architecture', 'Natural Language Processing', 'Generative AI', 'Conversational AI'],
				},
				{
					term: 'RAG (Retrieval Augmented Generation)',
					definition:
						'A hybrid approach in which an LLM retrieves information from external knowledge sources before generating responses. This method improves factual accuracy, reduces hallucinations, and is widely used in enterprise knowledge bases and secure AI assistants.',
					example:
						'A customer service chatbot that searches a company\'s knowledge base for relevant product information before generating a response, ensuring accurate and up-to-date answers.',
					relatedTerms: ['Information Retrieval', 'Knowledge Base', 'Hallucination Reduction', 'Enterprise AI'],
				},
				{
					term: 'HITL (Human-in-the-Loop)',
					definition:
						'A governance model requiring explicit human validation before an AI system performs sensitive actions. HITL is critical for compliance-heavy industries such as healthcare, banking, and government, ensuring accountability and oversight.',
					example:
						'A medical AI system that suggests a diagnosis but requires a doctor to review and approve the recommendation before it\'s communicated to the patient.',
					relatedTerms: ['AI Governance', 'Compliance', 'Human Oversight', 'Risk Management'],
				},
				{
					term: 'Agentic AI',
					definition:
						'AI systems that operate autonomously or semi-autonomously, capable of making independent decisions and pursuing goals with minimal supervision. These agents adapt dynamically to changing environments, representing the future of enterprise automation.',
					example:
						'An AI agent that autonomously manages inventory, places orders with suppliers, negotiates prices, and adjusts strategies based on market conditions without human intervention.',
					relatedTerms: ['Autonomous AI', 'AI Agents', 'Goal-oriented AI', 'Enterprise Automation'],
				},
				{
					term: 'AI Gateway',
					definition:
						'A middleware service that improves scalability, security, and performance for AI applications by providing rate limiting, caching, monitoring, and analytics. Gateways help enterprises safely integrate AI models into production environments.',
					example:
						'A company using an AI gateway to manage access to multiple LLM providers, implement usage quotas, cache responses for efficiency, and monitor API costs across different AI services.',
					relatedTerms: ['API Management', 'Middleware', 'Enterprise Integration', 'AI Infrastructure'],
				},
				{
					term: 'NIST AI RMF',
					definition:
						'The National Institute of Standards and Technology\'s Artificial Intelligence Risk Management Framework. It provides structured guidelines for organizations to identify, measure, and mitigate risks related to AI adoption.',
					example:
						'A financial institution using the NIST AI RMF to assess risks in their AI-powered fraud detection system, ensuring compliance with regulatory requirements and maintaining customer trust.',
					relatedTerms: ['Risk Management', 'AI Governance', 'Compliance', 'Standards'],
				},
				{
					term: 'OWASP Top 10 for LLMs',
					definition:
						'An industry-standard security list highlighting the ten most critical vulnerabilities specific to Large Language Model applications. It serves as a guideline for developers and enterprises to secure AI systems against threats like prompt injection and data leakage.',
					example:
						'A development team using the OWASP Top 10 for LLMs checklist to secure their customer service chatbot, implementing protections against prompt injection attacks and ensuring sensitive data isn\'t leaked in responses.',
					relatedTerms: ['AI Security', 'Vulnerability Assessment', 'Prompt Injection', 'Data Protection'],
				},
				{
					term: 'MAESTRO Framework',
					definition:
						'Cloud Security Alliance\'s threat modeling framework for agentic AI systems. It defines adversarial tactics such as overriding safeguards, misusing tools, and evading monitoring to help security teams model and mitigate risks.',
					example:
						'A security team using the MAESTRO framework to identify potential attack vectors in their autonomous AI trading system, ensuring the AI can\'t be manipulated to make unauthorized trades or bypass safety controls.',
					relatedTerms: ['Threat Modeling', 'AI Security', 'Adversarial Attacks', 'Risk Assessment'],
				},
				{
					term: 'BYOA (Bring Your Own Agent)',
					definition:
						'A concept where individuals introduce and operate their own AI agents, typically on personal devices. BYOA raises governance and security considerations, especially in corporate and regulated environments.',
					example:
						'An employee using their personal AI assistant to help with work tasks, requiring IT policies to manage data access, security controls, and compliance with corporate data handling requirements.',
					relatedTerms: ['BYOD', 'AI Governance', 'Personal AI', 'Corporate Security'],
				},
			],
		},
		{
			category: 'Emerging Standards',
			icon: '🔐',
			terms: [
				{
					term: 'Dynamic Client Registration (DCR)',
					definition:
						'Defines how OAuth clients register with authorization servers at runtime rather than through manual provisioning. While foundational for many integrations, DCR assumes a pre-existing trust relationship and approval workflow between client and server, which becomes challenging for autonomous AI agents that must connect to new services on demand.',
					example:
						'A personal AI assistant attempting to connect to an enterprise API may stall if the API requires manual DCR approval, preventing spontaneous agent-to-service collaboration.',
					relatedTerms: ['Client Metadata', 'OAuth 2.1'],
				},
				{
					term: 'Client ID Metadata Document (CIMD)',
					definition:
						'An emerging IETF OAuth Working Group draft that lets authorization servers resolve a client_id as an HTTPS URL pointing to rich metadata. Instead of pre-registering every agent, servers can fetch the metadata document when needed, enabling open ecosystems. Read the draft at <a href="https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document" target="_blank" rel="noopener noreferrer">draft-ietf-oauth-client-id-metadata-document</a>.',
					example:
						'An AI agent presents its client_id as https://agent.example/metadata.json; the resource server downloads the document to learn scopes, redirect URIs, and keys before issuing tokens.',
					relatedTerms: ['Dynamic Client Registration', 'MCP'],
				},
				{
					term: 'Identity Assertion Authorization Grant (ID-JAG)',
					definition:
						'A proposed OAuth grant that allows applications to present an identity assertion from a trusted enterprise identity provider and exchange it for API access tokens. It builds on RFC 8693 Token Exchange and the JWT Profile for OAuth 2.0 Authorization Grants to support cross-application delegation for AI agents. Draft available at <a href="https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant" target="_blank" rel="noopener noreferrer">draft-ietf-oauth-identity-assertion-authz-grant</a>.',
					example:
						'An enterprise AI copilot receives a signed assertion from the corporate IdP and trades it for an access token to call a partner SaaS API on behalf of an employee.',
					relatedTerms: ['Token Exchange', 'JWT Profile'],
				},
				{
					term: 'OAuth Identity and Authorization Chaining',
					definition:
						'An IETF draft that preserves authoritative identity and authorization context as tokens move across multiple trust domains. Chaining ensures downstream services can verify who initiated a request and under which policy. Read more at <a href="https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-chaining" target="_blank" rel="noopener noreferrer">draft-ietf-oauth-identity-chaining</a>.',
					example:
						'A workflow where an AI agent triggers a downstream automation, and each hop maintains the original user identity and consent, enabling auditable delegated actions.',
					relatedTerms: ['ID-JAG', 'Token Exchange'],
				},
				{
					term: 'Model Context Protocol (MCP)',
					definition:
						'An open protocol for connecting AI clients and servers. The community is evaluating CIMD as an alternative to traditional DCR so personal agents can register on the fly. Background and analysis can be found at <a href="https://blog.modelcontextprotocol.io/posts/client_registration" target="_blank" rel="noopener noreferrer">Evolving OAuth Client Registration in the Model Context Protocol</a>.',
					example:
						'MCP clients broadcast their capabilities and use CIMD-based client identifiers so any compliant server can fetch metadata and establish trust without manual onboarding.',
					relatedTerms: ['CIMD', 'Dynamic Client Registration'],
				},
			],
		},
	];
	const normalizedSearch = searchTerm.trim().toLowerCase();

	const filteredData = glossaryData
		.map((category) => {
			if (!normalizedSearch) {
				return category;
			}

			const categoryMatches = category.category.toLowerCase().includes(normalizedSearch);
			const termMatches = category.terms.filter((item) => {
				const definitionText = item.definition.toLowerCase();
				const exampleText = item.example?.toLowerCase() ?? '';
				const relatedMatches = item.relatedTerms?.some((related) =>
					related.toLowerCase().includes(normalizedSearch)
				);
				return (
					item.term.toLowerCase().includes(normalizedSearch) ||
					definitionText.includes(normalizedSearch) ||
					exampleText.includes(normalizedSearch) ||
					relatedMatches
				);
			});

			return {
				...category,
				terms: categoryMatches ? category.terms : termMatches,
			};
		})
 		.filter((category) => category.terms.length > 0);

	const hasResults = filteredData.length > 0;

	return (
		<PageContainer>
			<PageContent>
				<FlowHeader flowId="ai-glossary" />

				<SearchBar>
					<SearchInput
						type="text"
						placeholder="Search AI terms, standards, or concepts..."
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
					/>
					<SearchIcon />
					<ClearButton
						type="button"
						onClick={() => searchTerm && setSearchTerm('')}
						title="Clear search"
						$inactive={!searchTerm}
					>
						<FiX />
					</ClearButton>
				</SearchBar>

				{!hasResults ? (
					<NoResults>
						<h3>No matching terms found</h3>
						<p>Try different keywords or clear the search to browse all glossary entries.</p>
					</NoResults>
				) : (
					<CategoryList>
						{filteredData.map((category, categoryIndex) => (
							<CollapsibleHeader
								key={categoryIndex}
								title={category.category}
								subtitle={`${category.terms.length} terms`}
								icon={<CategoryIcon>{category.icon}</CategoryIcon>}
								defaultCollapsed={categoryIndex !== 0}
							>
								<TermsList>
									<TermsGrid>
										{category.terms.map((item, termIndex) => (
											<TermItem key={termIndex}>
												<TermTitle>{item.term}</TermTitle>
												<TermDefinition>{item.definition}</TermDefinition>
												{item.example && (
													<TermExample>
														<strong>Example:</strong>
														{item.example}
													</TermExample>
												)}
												{item.relatedTerms && item.relatedTerms.length > 0 && (
													<RelatedTerms>
														<strong>Related:</strong>{' '}
														{item.relatedTerms.map((term, idx) => (
															<span key={idx}>{term}</span>
														))}
													</RelatedTerms>
												)}
											</TermItem>
										))}
									</TermsGrid>
								</TermsList>
							</CollapsibleHeader>
						))}
					</CategoryList>
				)}

				<Footer>
					<p>This glossary covers AI terminology as of 2025. The field evolves rapidly.</p>
				</Footer>
			</PageContent>
		</PageContainer>
	);
};

export default AIGlossary;
