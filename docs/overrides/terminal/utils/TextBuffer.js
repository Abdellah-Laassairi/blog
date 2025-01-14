// Initialize TerminalApp if it doesn't exist
window.TerminalApp = window.TerminalApp || {};

// Define TextBuffer
window.TerminalApp.TextBuffer = class TextBuffer {
    constructor() {
        this.buffer = '';
        this.currentLine = '';
        this.isInList = false;
    }

    append(chunk) {
        this.buffer += chunk;
        return this.processBuffer();
    }

    processBuffer() {
        const lines = this.buffer.split('\n');
        let output = '';

        while (lines.length > 1) {
            output += this.formatLine(lines.shift()) + '\n';
        }

        this.buffer = lines[0] || '';
        return output;
    }

    formatLine(line) {
        line = line.trim().replace(/\s+/g, ' ');
        line = line.replace(/([.,!?;:])(\w)/g, '$1 $2');
        line = line.replace(/([\u{1F300}-\u{1F9FF}])/ug, '$1 ');
        
        if (line.startsWith('*')) {
            return '  ' + line.replace(/^\*\s*/, '* ');
        }
        return line;
    }

    finish() {
        return this.buffer ? this.formatLine(this.buffer) : '';
    }
};