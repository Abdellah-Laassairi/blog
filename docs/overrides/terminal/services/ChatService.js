window.TerminalApp.ChatService = class ChatService {
    constructor(config, terminal) {
        this.config = config;
        this.terminal = terminal;
        this.pipeline = null;
        this.chatHistory = [];
        this.currentProgress = 0;
        this.lastProgressMessage = '';
        this.lastFile = '';
        this.progressLineCount = 0;
        this.lastPercentage = -1;
        
        // Create optimized write methods
        this.write = (text) => window.TerminalApp.optimizedWrite(this.terminal, text);
        this.writeln = (text) => window.TerminalApp.optimizedWrite(this.terminal, text, { newLine: true });
        
        // Listen for transformers initialization
        window.addEventListener('transformersInitialized', () => {
            console.log('Transformers initialized event received');
            this.initializeModel();
        });
        
        // Listen for progress updates
        window.addEventListener('transformersProgress', (event) => {
            const progress = event.detail;
            this.updateProgress(progress);
        });
        
        window.addEventListener('transformersError', (event) => {
            console.error('Transformers initialization error:', event.error);
            this.writeln('\r\n\x1b[1;31mError: Failed to initialize the model. Please check the console for details.\x1b[0m');
        });
        
        // Start initialization if transformers is already ready
        if (window.transformersHelper) {
            this.initializeModel();
        }
    }

    clearProgressLines() {
        // Move up by the number of lines we've written and clear them
        if (this.progressLineCount > 0) {
            this.write('\r' + '\x1b[K'); // Clear current line
            for (let i = 0; i < this.progressLineCount - 1; i++) {
                this.write('\x1b[1A' + '\x1b[K'); // Move up and clear line
            }
            this.progressLineCount = 0;
        }
    }

    updateProgress(progress) {
        // Clear previous progress display
        this.clearProgressLines();
        
        const width = 30;
        let progressBar = '';
        let percentage = 0;
        
        if (progress.status === 'downloading') {
            percentage = progress.progress || 0;
        } else if (progress.status === 'loading') {
            percentage = 50 + (progress.progress || 0) / 2;
        } else if (progress.status === 'ready') {
            percentage = 100;
        }
        
        const filledWidth = Math.floor(width * (percentage / 100));
        const emptyWidth = width - filledWidth;
        
        progressBar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
        
        // Create the progress message
        const progressMessage = `\x1b[1;33mInitializing AI model... [${progressBar}] ${Math.floor(percentage)}% ${progress.status}\x1b[0m`;
        
        // Only update if the message has changed significantly
        if (progressMessage !== this.lastProgressMessage || 
            (progress.file && (!this.lastFile || this.lastFile !== progress.file)) ||
            Math.abs(percentage - this.lastPercentage) >= 1) {
            
            this.progressLineCount = 1; // Start with progress bar
            this.write('\r' + progressMessage);
            
            // Show file name if it has changed
            if (progress.file && (!this.lastFile || this.lastFile !== progress.file)) {
                this.lastFile = progress.file;
                this.write('\n\x1b[2m' + progress.file + '\x1b[0m');
                this.progressLineCount++;
            }
            
            this.lastProgressMessage = progressMessage;
            this.lastPercentage = percentage;
        }
    }

    async initializeModel() {
        try {
            console.log('Initializing model...');
            if (!window.transformersHelper) {
                throw new Error('Transformers.js helper not initialized');
            }

            // Wait for model to be ready
            const checkModel = () => {
                return new Promise((resolve) => {
                    const check = () => {
                        this.pipeline = window.transformersHelper.getModel();
                        if (this.pipeline && window.transformersHelper.isModelReady()) {
                            this.clearProgressLines(); // Clear the progress display
                            this.writeln('\x1b[1;32mAI model ready! You can start chatting.\x1b[0m');
                            resolve();
                        } else {
                            setTimeout(check, 1000);
                        }
                    };
                    check();
                });
            };

            await checkModel();
        } catch (error) {
            console.error('Error connecting to model:', error);
            this.writeln('\r\n\x1b[1;31mError: Failed to connect to the model. Please check the console for details.\x1b[0m');
        }
    }

    cleanResponse(text) {
        // Remove any text after "Human:", "Assistant:", or newlines
        let cleaned = text.split(/Human:|Assistant:|[\r\n]/)[0].trim();
        // Remove any remaining special characters or formatting
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        return cleaned;
    }

    async sendChatMessage(message) {
        try {
            if (!this.pipeline) {
                this.writeln('\r\n\x1b[1;31mModel is not yet initialized. Please wait...\x1b[0m');
                return;
            }

            // Show thinking indicator
            this.write('\r\n\x1b[33m[thinking...]\x1b[0m');

            // Create a simple prompt
            const prompt = `You are a helpful AI assistant. Keep responses concise and natural.\n\nHuman: ${message}\nAssistant:`;

            // Generate response
            const result = await this.pipeline(prompt, {
                max_new_tokens: 50,
                temperature: 0.7,
                do_sample: true,
                top_k: 50,
                top_p: 0.9,
                no_repeat_ngram_size: 3
            });

            // Clear thinking indicator
            this.write('\r\x1b[K');

            // Clean and format the response
            let response = result[0].generated_text;
            response = this.cleanResponse(response.substring(prompt.length));

            // Display the response
            this.write('\r\n\x1b[32m' + response + '\x1b[0m\r\n');

            // Show next prompt
            this.write(TerminalApp.CHAT_PROMPT);

        } catch (error) {
            console.error('Chat error:', error);
            this.writeln('\r\n\x1b[1;31mError: Failed to generate response. Please try again.\x1b[0m');
            this.write(TerminalApp.CHAT_PROMPT);
        }
    }
};

console.log("Chat service initialized:", window.TerminalApp.ChatService);
