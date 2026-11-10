import { spawn } from 'child_process';
import path from 'path';

export interface LearningPlan {
  topic: string;
  attempts: number;
  mastery_estimate: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  recommend_3d_review: boolean;
}

export interface RetrievedChunk {
  source_id: string;
  text: string;
  score: number;
}

export interface AnatomyLabel {
  mesh_name: string;
  label: string;
  description: string;
  source_id: string;
}

function runPythonCli(command: string, payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.resolve(process.cwd(), 'adaptive_learning.py');
    const child = spawn('python3', [pythonScript, command], {
      env: { ...process.env, LEARNING_DB: process.env.LEARNING_DB || 'learning.db' },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(
          new Error(`Python process exited with code ${code}: ${stderr || stdout}`)
        );
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        if (parsed.error) {
          return reject(new Error(parsed.error));
        }
        resolve(parsed);
      } catch (err: any) {
        reject(new Error(`Failed to parse Python JSON output: ${stdout} (${err.message})`));
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

export const adaptiveLearningBridge = {
  addResource: async (userId: string, topic: string, extractedText: string): Promise<string> => {
    const res = await runPythonCli('add_resource', {
      user_id: userId,
      topic,
      extracted_text: extractedText,
    });
    return res.resource_id;
  },

  approveResource: async (resourceId: string): Promise<boolean> => {
    const res = await runPythonCli('approve_resource', { resource_id: resourceId });
    return Boolean(res.approved);
  },

  retrieve: async (userId: string, topic: string, query: string, limit = 4): Promise<RetrievedChunk[]> => {
    const res = await runPythonCli('retrieve', {
      user_id: userId,
      topic,
      query,
      limit,
    });
    return res.chunks || [];
  },

  recordAnswer: async (userId: string, topic: string, correct: boolean): Promise<LearningPlan> => {
    const res = await runPythonCli('record_answer', {
      user_id: userId,
      topic,
      correct,
    });
    return res.learning_plan;
  },

  getLearningPlan: async (userId: string, topic: string): Promise<LearningPlan> => {
    const res = await runPythonCli('learning_plan', {
      user_id: userId,
      topic,
    });
    return res.learning_plan;
  },

  addAnatomyLabel: async (
    resourceId: string,
    modelId: string,
    meshName: string,
    label: string,
    description: string
  ): Promise<boolean> => {
    const res = await runPythonCli('add_anatomy_label', {
      resource_id: resourceId,
      model_id: modelId,
      mesh_name: meshName,
      label,
      description,
    });
    return Boolean(res.labeled);
  },

  getAnatomyLabels: async (userId: string, modelId: string): Promise<AnatomyLabel[]> => {
    const res = await runPythonCli('anatomy_labels', {
      user_id: userId,
      model_id: modelId,
    });
    return res.labels || [];
  },
};
