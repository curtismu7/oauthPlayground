import {
  trainingResources,
  trainingPrompts,
  practiceTools,
} from './trainingContent.js';

export const mockTrainingOverview = trainingResources.find(
  (resource) => resource.name === 'pingone-training.overview'
);

export const mockAuthLesson = trainingPrompts.find(
  (prompt) => prompt.name === 'pingone.training.lesson'
);

export const mockPracticeAuthTool = practiceTools.find(
  (tool) => tool.name === 'pingone.training.practice-auth'
);

export function getMockTrainingBundle() {
  return {
    resources: trainingResources,
    prompts: trainingPrompts,
    tools: practiceTools,
  };
}
