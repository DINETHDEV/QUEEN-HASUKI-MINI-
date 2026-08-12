/**
 * Command Register System (NovaX Mini)
 * Copyright © 2025 Zero Bug Zone
 */

const commands = [];

/**
 * Register new command
 * @param {Object} options - Command configuration
 * @param {string} options.pattern - Command name
 * @param {string} options.desc - Description
 * @param {string} options.category - Category
 * @param {string} options.react - Reaction emoji
 * @param {string} options.filename - File path
 * @param {Function} handler - Command handler function
 */
function cmd(options, handler) {
    const command = {
        pattern: options.pattern,
        desc: options.desc || "",
        category: options.category || "general",
        react: options.react || "✅",
        filename: options.filename || __filename,
        handler: handler
    };
    commands.push(command);
}

// Export command register + list
module.exports = {
    cmd,
    commands
};

