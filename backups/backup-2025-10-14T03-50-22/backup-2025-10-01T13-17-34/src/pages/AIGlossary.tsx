import React, { useState } from 'react';
import { FiBookOpen, FiSearch } from 'react-icons/fi';
import styled from 'styled-components';
import CollapsibleIcon from '../components/CollapsibleIcon';

const Container = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  padding: 2rem;
`;

const MaxWidth = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;

  svg {
    width: 2.5rem;
    height: 2.5rem;
    color: #4f46e5;
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0;
  }
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 1.125rem;
  margin: 0;
`;

const SearchContainer = styled.div`
  margin-bottom: 2.5rem;
  position: relative;
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  width: 1.25rem;
  height: 1.25rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1.25rem 1.25rem 1.25rem 3.5rem;
  border-radius: 0.75rem;
  border: 2px solid #e5e7eb;
  font-size: 1.125rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const CategoriesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const CategoryCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const CategoryHeader = styled.button`
  width: 100%;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border: none;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f9fafb;
  }
`;

const CategoryHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const CategoryIcon = styled.span`
  font-size: 1.75rem;
`;

const CategoryTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CategoryBadge = styled.span`
  background: #e0e7ff;
  color: #4f46e5;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-left: 0.75rem;
`;

const TermsList = styled.div`
  padding: 0 1.5rem 1.5rem;
`;

const TermsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const TermItem = styled.div`
  border-left: 4px solid #818cf8;
  padding-left: 1.25rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
`;

const TermTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
`;

const TermDefinition = styled.p`
  color: #4b5563;
  line-height: 1.7;
  margin: 0 0 0.75rem 0;
`;

const TermExample = styled.div`
  background: #f8fafc;
  border-left: 3px solid #94a3b8;
  padding: 0.75rem 1rem;
  margin-top: 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.9375rem;
  color: #475569;
  
  strong {
    color: #334155;
    display: block;
    margin-bottom: 0.375rem;
  }
`;

const RelatedTerms = styled.div`
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: #64748b;
  
  strong {
    color: #475569;
  }
  
  span {
    display: inline-block;
    background: #e0e7ff;
    color: #4f46e5;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    margin-right: 0.375rem;
    margin-top: 0.25rem;
  }
`;

const NoResults = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  p {
    color: #6b7280;
    font-size: 1.125rem;
    margin: 0;
  }
`;

const Footer = styled.div`
  margin-top: 2.5rem;
  text-center;
  color: #6b7280;
  font-size: 0.875rem;

  p {
    margin: 0;
  }
`;

const AIGlossary: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('');
	const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

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
						"A prompting technique that encourages models to break down complex problems into intermediate reasoning steps before arriving at a final answer. By 'thinking out loud', models can solve more complex problems and provide more accurate results, especially for math, logic, and multi-step reasoning tasks.",
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
						'AI systems that can plan, make decisions, and take actions autonomously over extended periods.',
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
				{ term: 'Sentiment Analysis', definition: 'Determining emotional tone in text.' },
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
	];

	const filteredData = glossaryData
		.map((category) => ({
			...category,
			terms: category.terms.filter(
				(item) =>
					item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
					item.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
					(item.example && item.example.toLowerCase().includes(searchTerm.toLowerCase()))
			),
		}))
		.filter((category) => category.terms.length > 0);

	const toggleCategory = (index: number) => {
		setExpandedCategory(expandedCategory === index ? null : index);
	};

	return (
		<Container>
			<MaxWidth>
				<Header>
					<HeaderTitle>
						<FiBookOpen />
						<h1>AI Terms Glossary</h1>
					</HeaderTitle>
					<Subtitle>Your comprehensive guide to modern AI terminology</Subtitle>
				</Header>

				<SearchContainer>
					<SearchIcon />
					<SearchInput
						type="text"
						placeholder="Search terms or definitions..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</SearchContainer>

				<CategoriesContainer>
					{filteredData.length === 0 ? (
						<NoResults>
							<p>No results found. Try a different search term.</p>
						</NoResults>
					) : (
						filteredData.map((category, categoryIndex) => (
							<CategoryCard key={categoryIndex}>
								<CategoryHeader onClick={() => toggleCategory(categoryIndex)}>
									<CategoryHeaderLeft>
										<CategoryIcon>{category.icon}</CategoryIcon>
										<CategoryTitle>{category.category}</CategoryTitle>
										<CategoryBadge>{category.terms.length} terms</CategoryBadge>
									</CategoryHeaderLeft>
									<CollapsibleIcon isExpanded={expandedCategory === categoryIndex} />
								</CategoryHeader>

								{expandedCategory === categoryIndex && (
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
								)}
							</CategoryCard>
						))
					)}
				</CategoriesContainer>

				<Footer>
					<p>This glossary covers AI terminology as of 2025. The field evolves rapidly.</p>
				</Footer>
			</MaxWidth>
		</Container>
	);
};

export default AIGlossary;
