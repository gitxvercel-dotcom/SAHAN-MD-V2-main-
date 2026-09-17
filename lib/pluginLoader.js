const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Recursively load all .js plugins from plugins/ folder
 * Expected plugin format:
 * module.exports = {
 *   command: ['menu', 'help'],   // or string
 *   alias: ['m'],                // optional
 *   description: 'Show menu',
 *   category: 'main',
 *   ownerOnly: false,            // optional
 *   groupOnly: false,
 *   privateOnly: false,
 *   async handler(sock, m, ctx) { ... }
 * }
 */
async function loadPlugins(pluginsDir) {
  const commands = new Map();
  const categories = {};

  if (!await fs.pathExists(pluginsDir)) {
    console.log(chalk.yellow('[!] plugins folder not found'));
    return { commands, categories };
  }

  async function walk(dir) {
    const items = await fs.readdir(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      const stat = await fs.stat(full);

      if (stat.isDirectory()) {
        await walk(full);
      } else if (item.endsWith('.js')) {
        try {
          delete require.cache[require.resolve(full)];
          const plugin = require(full);

          if (!plugin || !plugin.handler) {
            console.log(chalk.gray(`[skip] ${full} - no handler`));
            continue;
          }

          const cmds = Array.isArray(plugin.command)
            ? plugin.command
            : (plugin.command ? [plugin.command] : []);

          const aliases = Array.isArray(plugin.alias)
            ? plugin.alias
            : (plugin.alias ? [plugin.alias] : []);

          const allNames = [...cmds, ...aliases].map(c => String(c).toLowerCase());

          if (allNames.length === 0) {
            console.log(chalk.gray(`[skip] ${full} - no command names`));
            continue;
          }

          const category = plugin.category || path.basename(path.dirname(full)) || 'other';

          if (!categories[category]) categories[category] = [];

          for (const name of allNames) {
            commands.set(name, plugin);
          }

          categories[category].push({
            name: cmds[0] || allNames[0],
            description: plugin.description || '',
            aliases: aliases
          });

          console.log(chalk.green(`[✓] Loaded: ${allNames.join(', ')} (${category})`));
        } catch (err) {
          console.log(chalk.red(`[✗] Failed to load ${full}: ${err.message}`));
        }
      }
    }
  }

  await walk(pluginsDir);
  return { commands, categories };
}

module.exports = { loadPlugins };
