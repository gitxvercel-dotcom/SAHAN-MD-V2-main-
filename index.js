import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  delay
} from '@vanzxy/baileys';
import pino from 'pino';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import config from './config.js';
import { loadPlugins } from './lib/pluginLoader.js';
import { serialize } from './lib/serialize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino({ level: 'silent' });
const sessionDir = path.join(__dirname, 'session');
const pluginsDir = path.join(__dirname, 'plugins');

let commands = new Map();
let categories = {};

async function startBot() {
  await fs.ensureDir(sessionDir);

  console.log(chalk.cyan('\n[*] Loading plugins...'));
  const loaded = await loadPlugins(pluginsDir);
  commands = loaded.commands;
  categories = loaded.categories;
  console.log(chalk.cyan(`[*] ${commands.size} command(s) loaded\n`));

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const sock = makeWASocket({
    auth: state,
    logger,
    browser: Browsers.macOS('Chrome'),
    syncFullHistory: false,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(chalk.yellow('[!] QR received. Prefer Pair Site for SESSION_ID.'));
    }

    if (connection === 'open') {
      console.log(chalk.green(`
╔════════════════════════════════════════╗
║     SAHAN-MD V2 CONNECTED ✅           ║
║     Baileys : @vanzxy/baileys          ║
║     Prefix  : ${config.PREFIX}                       ║
║     Plugins : ${String(commands.size).padEnd(26)}║
╚════════════════════════════════════════╝
      `));

      try {
        const ownerJid = config.OWNER_NUMBER.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        await sock.sendMessage(ownerJid, { text: config.ALIVE_MSG });
      } catch (_) {}
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log(chalk.red(`[!] Connection closed. Code: ${code}`));
      if (code !== DisconnectReason.loggedOut) {
        console.log(chalk.yellow('[*] Reconnecting in 3s...'));
        await delay(3000);
        startBot();
      } else {
        console.log(chalk.red('[!] Logged out. Generate new session from Pair Site.'));
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const raw = messages[0];
    if (!raw?.message || raw.key.fromMe) return;

    try {
      const m = serialize(raw, sock);
      const prefix = config.PREFIX;
      const body = m.body || '';

      const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
      const senderNum = (m.sender || '').replace(/[^0-9]/g, '');
      m.isOwner = senderNum === ownerNum || senderNum.endsWith(ownerNum);

      if (config.WORK_TYPE === 'private' && !m.isOwner) return;
      if (config.WORK_TYPE === 'group' && !m.isGroup) return;

      if (!body.startsWith(prefix)) return;

      const args = body.slice(prefix.length).trim().split(/ +/);
      const cmdName = (args.shift() || '').toLowerCase();
      const text = args.join(' ');

      const plugin = commands.get(cmdName);
      if (!plugin) return;

      if (plugin.ownerOnly && !m.isOwner) {
        return m.reply('⛔ Owner only command.');
      }
      if (plugin.groupOnly && !m.isGroup) {
        return m.reply('⛔ Group only command.');
      }
      if (plugin.privateOnly && m.isGroup) {
        return m.reply('⛔ Private chat only.');
      }

      const ctx = {
        args,
        text,
        prefix,
        commands,
        categories,
        config,
        sock
      };

      await plugin.handler(sock, m, ctx);
    } catch (err) {
      console.error(chalk.red('[Handler Error]'), err);
    }
  });

  return sock;
}

console.log(chalk.cyan('Starting SAHAN-MD V2 (@vanzxy/baileys)...'));
startBot().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
