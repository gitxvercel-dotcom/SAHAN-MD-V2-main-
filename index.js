const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  Browsers,
  delay
} = require('@vanzxy/baileys');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const config = require('./config');
const { loadPlugins } = require('./lib/pluginLoader');
const { serialize } = require('./lib/serialize');

const logger = pino({ level: 'silent' });
const sessionDir = path.join(__dirname, 'session');
const pluginsDir = path.join(__dirname, 'plugins');

let commands = new Map();
let categories = {};

async function startBot() {
  await fs.ensureDir(sessionDir);

  // Load plugins
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
      // Optional: print with qrcode-terminal if installed
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

      // Notify owner
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

  // ========== MESSAGE HANDLER ==========
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const raw = messages[0];
    if (!raw?.message || raw.key.fromMe) return;

    try {
      const m = serialize(raw, sock);
      const prefix = config.PREFIX;
      const body = m.body || '';

      // Owner check
      const ownerNum = config.OWNER_NUMBER.replace(/[^0-9]/g, '');
      const senderNum = (m.sender || '').replace(/[^0-9]/g, '');
      m.isOwner = senderNum === ownerNum || senderNum.endsWith(ownerNum);

      // Work type filter
      if (config.WORK_TYPE === 'private' && !m.isOwner) return;
      if (config.WORK_TYPE === 'group' && !m.isGroup) return;

      if (!body.startsWith(prefix)) return;

      const args = body.slice(prefix.length).trim().split(/ +/);
      const cmdName = (args.shift() || '').toLowerCase();
      const text = args.join(' ');

      const plugin = commands.get(cmdName);
      if (!plugin) return;

      // Permission checks
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
