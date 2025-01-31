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
            const { AutoModelForCausalLM, AutoTokenizer, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');

            // Configure environment to use local files only
            env.localModelPath = '/blog/overrides/terminal/';
            env.allowRemoteModels = false;  // Prevent remote model fetching
            env.useCache = false;  // Disable caching to ensure local files are used
            console.log('Environment configured for local-only:', env);

            // Get configuration from chat config
            const config = window.TerminalApp.chatConfig;
            console.log('Using config:', config);

            const modelPath = 'models/HuggingFaceTB/SmolLM-135M-Instruct';
            const modelFiles = {
                tokenizer: {
                    'tokenizer.json': `${modelPath}/tokenizer.json`,
                    'tokenizer_config.json': `${modelPath}/tokenizer_config.json`,
                    'special_tokens_map.json': `${modelPath}/special_tokens_map.json`
                },
                model: {
                    'model.onnx': `${modelPath}/onnx/model.onnx`,
                    'config.json': `${modelPath}/config.json`,
                    'generation_config.json': `${modelPath}/generation_config.json`
                }
            };

            console.log('Loading tokenizer with files:', modelFiles.tokenizer);
            this.tokenizer = await AutoTokenizer.from_pretrained(modelPath, {
                local: true,
                local_files: modelFiles.tokenizer,
                progress_callback: (progress) => {
                    console.log('Loading tokenizer:', progress);
                    if (this.progressCallback) {
                        this.progressCallback({
                            ...progress,
                            status: 'loading tokenizer'
                        });
                    }
                }
            });

            console.log('Loading model with files:', modelFiles.model);
            this.model = await AutoModelForCausalLM.from_pretrained(modelPath, {
                local: true,
                local_files: modelFiles.model,
                quantized: config.USE_QUANTIZED,
                progress_callback: (progress) => {
                    console.log('Loading model:', progress);
                    if (this.progressCallback) {
                        this.progressCallback({
                            ...progress,
                            status: 'loading model'
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

    getModel() {
        return this.model;
    },

    getTokenizer() {
        return this.tokenizer;
    },

    isModelReady() {
        return this.modelReady;
    },

    async generate(messages, options = {}) {
        if (!this.model || !this.tokenizer) throw new Error('Model or tokenizer not initialized');

        const defaultOptions = {
            max_new_tokens: window.TerminalApp.chatConfig.MAX_NEW_TOKENS || 50,
            temperature: window.TerminalApp.chatConfig.TEMPERATURE || 0.2,
            do_sample: window.TerminalApp.chatConfig.DO_SAMPLE || true,
            top_p: 0.9
        };

        try {
            // Apply chat template
            const input_text = await this.tokenizer.apply_chat_template(messages, { tokenize: false });
            console.log('Generated input text:', input_text);

            // Tokenize input
            const inputs = await this.tokenizer.encode(input_text);
            const inputTensor = new Tensor('int64', inputs.data, [1, inputs.data.length]);

            // Generate response
            const outputs = await this.model.generate(inputTensor, { ...defaultOptions, ...options });

            // Decode and return response
            const response = await this.tokenizer.decode(outputs[0].data, { skip_special_tokens: true });
            return response;
        } catch (error) {
            console.error('Error in generate:', error);
            throw error;
        }
    }
};

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', () => window.transformersHelper.initialize());

console.log('Transformers helper initialized');
