if (!window.TerminalApp) {
    window.TerminalApp = {};
}

// Configuration for transformers.js
window.TerminalApp.chatConfig = {
    MODEL: "models/HuggingFaceTB/SmolLM-135M-Instruct",
    USE_QUANTIZED: false,
    MAX_NEW_TOKENS: 200,
    TEMPERATURE: 0.7,
    REPETITION_PENALTY: 1.1,
    DO_SAMPLE: true,
    MODEL_TYPE: 'text-generation'
};

console.log("Chat config initialized:", window.TerminalApp.chatConfig);
