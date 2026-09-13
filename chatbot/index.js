// Chatbot entry point
// Claude Code execution — handles Claude API integration, RAG, fallback

export const chatbot = {
  init: () => console.log("Chatbot initialized by Claude Code"),
  handle: async (message) => {
    console.log("Message received:", message);
    return "Response placeholder — Claude API integration coming";
  }
};
