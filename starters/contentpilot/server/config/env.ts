const openaiApiKey = process.env.OPENAI_API_KEY?.trim() || null;

export const serverEnv = Object.freeze({
  openaiApiKey,
});
