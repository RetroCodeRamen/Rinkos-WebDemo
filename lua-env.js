// RinkOS Lua Environment
class RinkLuaEnv {
    constructor() {
        this.scripts = new Map(); // Store installed scripts
        this.setupRinkAPI();
    }

    setupRinkAPI() {
        // Create the rink API object
        window.rink = {
            print: (x, y, text) => {
                const element = document.createElement('div');
                element.style.position = 'absolute';
                element.style.left = `${x}px`;
                element.style.top = `${y}px`;
                element.textContent = text;
                document.getElementById('rinkos-screen').appendChild(element);
            },
            drawBox: (x, y, width, height) => {
                const element = document.createElement('div');
                element.style.position = 'absolute';
                element.style.left = `${x}px`;
                element.style.top = `${y}px`;
                element.style.width = `${width}px`;
                element.style.height = `${height}px`;
                element.style.border = '1px solid black';
                document.getElementById('rinkos-screen').appendChild(element);
            },
            clear: () => {
                const screen = document.getElementById('rinkos-screen');
                while (screen.firstChild) {
                    screen.removeChild(screen.firstChild);
                }
            },
            input: () => {
                return prompt('Enter input:');
            },
            sendMessage: (username, message) => {
                const user = window.getUserInfo();
                const now = new Date();
                fetch('http://localhost:3001/api/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sender: user.username,
                        recipient: username,
                        time: now.toISOString(),
                        text: message
                    })
                });
            },
            getMessages: () => {
                return []; // Placeholder for now
            },
            getPeers: () => {
                return []; // Placeholder for now
            }
        };
    }

    runScript(name, code) {
        try {
            // Clear the screen before running
            window.rink.clear();
            
            // Create a function from the code
            const scriptFunction = new Function('rink', code);
            
            // Run the script with the rink API
            scriptFunction(window.rink);
            return true;
        } catch (error) {
            console.error(`Error running script ${name}:`, error);
            return false;
        }
    }

    cleanup() {
        // Cleanup if needed
    }
}

// Export the environment
window.RinkLuaEnv = RinkLuaEnv; 