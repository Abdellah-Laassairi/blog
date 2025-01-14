if (!window.TerminalApp) {
    window.TerminalApp = {};
}

// Configuration for transformers.js
window.TerminalApp.chatConfig = {
    MODEL: "Xenova/distilgpt2", // Using a smaller, faster model that's compatible with transformers.js
    MAX_NEW_TOKENS: 100,
    TEMPERATURE: 0.7,
    REPETITION_PENALTY: 1.1,
    DO_SAMPLE: true
};

console.log("Chat config initialized:", window.TerminalApp.chatConfig);