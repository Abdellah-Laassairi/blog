// Initialize transformers.js
let model = null;
let tokenizer = null;

async function initializeTransformers() {
    try {
        console.log('Starting transformers.js initialization...');
        const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
        
        console.log('Initializing transformers.js...');
        
        // Initialize the model with simple configuration
        model = await pipeline(
            'text-generation',
            'HuggingFaceTB/SmolLM2-360M-Instruct',
            {
                progress_callback: (progress) => {
                    // Dispatch progress event
                    window.dispatchEvent(new CustomEvent('transformersProgress', {
                        detail: progress
                    }));
                }
            }
        );
        
        // Initialize tokenizer (it's part of the model)
        tokenizer = model.tokenizer;
        
        // Set up the helper interface that ChatService expects
        window.transformersHelper = {
            getModel: () => model,
            getTokenizer: () => tokenizer,
            isModelReady: () => model !== null && tokenizer !== null,
            generate: async (text) => {
                if (!model) throw new Error('Model not initialized');
                return await model(text);
            }
        };
        
        console.log('Transformers.js initialized successfully');
        // Dispatch an event when initialization is complete
        window.dispatchEvent(new Event('transformersInitialized'));
        
    } catch (error) {
        console.error('Error initializing transformers.js:', error);
        window.dispatchEvent(new ErrorEvent('transformersError', { error }));
    }
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', initializeTransformers);