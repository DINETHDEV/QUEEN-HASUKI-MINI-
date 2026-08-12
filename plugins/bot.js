/**
 * Plugin Loader for NovaX Mini
 * Copyright © 2025 Zero Bug Zone
 */

const fs = require('fs');
const path = require('path');

function loadPlugins() {
    const pluginsDir = path.join(__dirname, 'plugins');

    if (!fs.existsSync(pluginsDir)) {
        console.warn('⚠️ Plugins folder not found!');
        return;
    }

    // Clear old commands
    global.commands = [];

    // Scan plugins folder
    fs.readdirSync(pluginsDir).forEach(file => {
        if (file.endsWith('.js')) {
            try {
                const pluginPath = path.join(pluginsDir, file);
                const plugin = require(pluginPath);

                // Plugin name = filename without .js
                const pluginName = file.replace('.js', '');

                // Push to global.commands
                global.commands.push({
                    pattern: pluginName,   // e.g. "alive", "ping"
                    function: plugin
                });

                console.log(`✅ Loaded plugin: ${pluginName}`);
            } catch (err) {
                console.error(`❌ Failed to load plugin ${file}:`, err);
            }
        }
    });
}

module.exports = { loadPlugins };
