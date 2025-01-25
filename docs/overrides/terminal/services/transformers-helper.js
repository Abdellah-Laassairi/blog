// Helper class for transformers.js model loading and management
window.transformersHelper = {
    model: null,
    tokenizer: null,
    modelReady: false,
    progressCallback: null,

    setProgressCallback(callback) {
        this.progressCallback = callback;
    },

    async initialize() {
        try {
            if (this.modelReady) {
                console.log('Model already initialized');
                return;
            }

            console.log('Starting transformers.js initialization...');
            const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
            
            console.log('Initializing transformers.js...');
            
            // Get configuration from chat config
            const config = window.TerminalApp.chatConfig;
            console.log('Using config:', config);

            // Create pipeline directly with progress callbacks
            this.model = await pipeline('text-generation', config.MODEL, {
                quantized: config.USE_QUANTIZED,
                progress_callback: (progress) => {
                    console.log('Loading progress:', progress);
                    if (this.progressCallback) {
                        this.progressCallback({
                            ...progress,
                            status: progress.status === 'ready' ? 'ready' : 'loading model'
                        });
                    }
                }
            });

            this.modelReady = true;
            if (this.progressCallback) {
                this.progressCallback({ status: 'ready', progress: 100 });
            }
            console.log('Transformers.js initialized successfully');
            window.dispatchEvent(new Event('transformersInitialized'));
            
        } catch (error) {
            console.error('Error initializing transformers.js:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                cause: error.cause
            });
            this.modelReady = false;
            window.dispatchEvent(new CustomEvent('transformersError', { detail: error }));
            throw error;
        }
    },

    async loadLocalModel(localPath) {
        try {
            // Check if model files exist at the local path
            const { AutoModelForCausalLM, AutoTokenizer } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
            
            // Load tokenizer and model from local files
            this.tokenizer = await AutoTokenizer.from_pretrained(localPath, {
                local_files: {
                    'tokenizer.json': `${localPath}/tokenizer.json`,
                    'tokenizer_config.json': `${localPath}/tokenizer_config.json`
                }
            });
            console.log('Tokenizer loaded:', this.tokenizer);

            const modelOptions = {
                local_files: {
                    'model.onnx': `${localPath}/onnx/model.onnx`,
                    'config.json': `${localPath}/config.json`
                }
            };

            this.model = await AutoModelForCausalLM.from_pretrained(localPath, modelOptions);
            console.log('Model loaded:', this.model);
            // Create pipeline with loaded model and tokenizer
            this.model = await window.transformers.pipeline('text-generation', {
                model: this.model,
                tokenizer: this.tokenizer
            });
            console.log('Pipeline created:', this.model);
            this.modelReady = true;
            return this.model;
        } catch (error) {
            console.error('Error loading local model:', error);
            throw error;
        }
    },

    getModel() {
        return this.model;
    },

    getTokenizer() {
        return this.tokenizer;
    },

    isModelReady() {
        return this.modelReady;
    },

    async generate(text, options = {}) {
        if (!this.model) throw new Error('Model not initialized');
        const defaultOptions = {
            max_new_tokens: window.TerminalApp.chatConfig.MAX_NEW_TOKENS || 100,
            temperature: window.TerminalApp.chatConfig.TEMPERATURE || 0.7,
            do_sample: window.TerminalApp.chatConfig.DO_SAMPLE || true,
            top_k: 50,
            top_p: 0.9,
            no_repeat_ngram_size: 3
        };
        return await this.model(text, { ...defaultOptions, ...options });
    }
};

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', () => window.transformersHelper.initialize());

console.log('Transformers helper initialized'); 