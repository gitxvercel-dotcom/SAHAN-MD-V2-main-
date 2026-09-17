import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { pathToFileURL } from 'url';

/**
 * Recursively load all .js plugins from plugins/ folder (ESM)
 * Expected plugin format:
 * export default {
 *   command: ['menu', 'help'],
 *   alias: ['m'],
 *   description: 'Show menu',
 *   category: 'main',
 *   async handler(sock, m, ctx) { ... }
 * }
 */
export async function loadPlugins(pluginsDir) {
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
          const fileUrl = pathToFileURL(full).href + '?t=' + Date.now();
          const mod = await import(fileUrl);
          const plugin = mod.default || mod;

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
            aliases
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
