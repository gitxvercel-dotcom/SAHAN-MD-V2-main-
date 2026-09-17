const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, downloadContentFromMessage, jidNormalizedUser, proto } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const config = require('./config');

const logger = pino({ level: 'silent' });
const sessionDir = path.join(__dirname, 'session');

async function startBot() {
  await fs.ensureDir(sessionDir);

  // If SESSION_ID is provided, try to restore from it (simplified - in real use download from mega)
  // For now we use multi-file auth. User can place creds.json manually or expand with mega download.

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: Browsers.macOS('Chrome'),
    syncFullHistory: false,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(chalk.yellow('[!] QR received - Use Pair Site instead for SESSION_ID'));
    }

    if (connection === 'open') {
      console.log(chalk.green(`
╔══════════════════════════════════════╗
║     SAHAN-MD V2 CONNECTED ✅         ║
║     Bot: ${config.BOT_NAME.padEnd(28)}║
║     Prefix: ${config.PREFIX}                        ║
╚══════════════════════════════════════╝
      `));
      // Send alive to owner
      try {
        const ownerJid = config.OWNER_NUMBER + '@s.whatsapp.net';
        await sock.sendMessage(ownerJid, { text: config.ALIVE_MSG });
      } catch (e) {}
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log(chalk.red(`[!] Connection closed. Code: ${code}`));
      if (code !== DisconnectReason.loggedOut) {
        console.log(chalk.yellow('[*] Reconnecting...'));
        setTimeout(startBot, 3000);
      } else {
        console.log(chalk.red('[!] Logged out. Generate new SESSION_ID from Pair Site.'));
      }
    }
  });

  // ========== MESSAGE HANDLER ==========
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const from = m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = isGroup ? (m.key.participant || m.participant) : from;
    const body = getMessageBody(m);
    const prefix = config.PREFIX;
    const isCmd = body.startsWith(prefix);
    const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
    const args = body.trim().split(/ +/).slice(1);
    const text = args.join(' ');

    // Simple command router
    try {
      if (command === 'menu' || command === 'help') {
        await sendButtonMenu(sock, from, m);
      } else if (command === 'alive' || command === 'ping') {
        await sock.sendMessage(from, {
          text: `*🏓 Pong!*\n\n*Bot:* ${config.BOT_NAME}\n*Status:* Online ✅\n*Prefix:* ${prefix}`
        }, { quoted: m });
      } else if (command === 'owner') {
        await sock.sendMessage(from, {
          text: `*👑 Owner*\n\nName: ${config.OWNER_NAME}\nNumber: ${config.OWNER_NUMBER}`
        }, { quoted: m });
      } else if (command === 'buttons') {
        // Demo interactive / buttons
        await sendDemoButtons(sock, from, m);
      }
    } catch (err) {
      console.error('Command error:', err);
    }
  });

  return sock;
}

function getMessageBody(m) {
  const msg = m.message;
  if (msg.conversation) return msg.conversation;
  if (msg.extendedTextMessage) return msg.extendedTextMessage.text;
  if (msg.imageMessage?.caption) return msg.imageMessage.caption;
  if (msg.videoMessage?.caption) return msg.videoMessage.caption;
  if (msg.buttonsResponseMessage) return msg.buttonsResponseMessage.selectedButtonId;
  if (msg.listResponseMessage) return msg.listResponseMessage.singleSelectReply?.selectedRowId;
  if (msg.templateButtonReplyMessage) return msg.templateButtonReplyMessage.selectedId;
  if (msg.interactiveResponseMessage) {
    try {
      const params = JSON.parse(msg.interactiveResponseMessage.nativeFlowResponseMessage?.paramsJson || '{}');
      return params.id || params.selectedId || '';
    } catch { return ''; }
  }
  return '';
}

// ========== BUTTON / INTERACTIVE SUPPORT ==========
async function sendButtonMenu(sock, jid, quoted) {
  const text = `*┏━━━「 ${config.BOT_NAME} 」━━━┓*

*🤖 Premium Multi-Device Bot*
*📌 Prefix:* ${config.PREFIX}

*📋 Main Commands*
• ${config.PREFIX}menu – This menu
• ${config.PREFIX}alive – Bot status
• ${config.PREFIX}owner – Owner info
• ${config.PREFIX}buttons – Button demo

*✨ Features*
• Button Messages ✅
• Interactive Messages ✅
• Anti-Delete (configurable)
• Auto Status View

*┗━━━━━━━━━━━━━━━━┛*

> Powered by SAHAN-MD V2`;

  // Modern interactive style (works better on current Baileys)
  try {
    await sock.sendMessage(jid, {
      text: text,
      footer: 'SAHAN-MD V2 • Premium',
      buttons: [
        { buttonId: `${config.PREFIX}alive`, buttonText: { displayText: '🏓 Alive' }, type: 1 },
        { buttonId: `${config.PREFIX}owner`, buttonText: { displayText: '👑 Owner' }, type: 1 },
        { buttonId: `${config.PREFIX}buttons`, buttonText: { displayText: '✨ Buttons Demo' }, type: 1 }
      ],
      headerType: 1
    }, { quoted });
  } catch (e) {
    // Fallback pure text
    await sock.sendMessage(jid, { text }, { quoted });
  }
}

async function sendDemoButtons(sock, jid, quoted) {
  try {
    await sock.sendMessage(jid, {
      text: '*✨ Interactive Button Demo*\n\nChoose an option below:',
      footer: 'SAHAN-MD V2 Button Support',
      buttons: [
        { buttonId: 'btn_yes', buttonText: { displayText: '✅ Yes' }, type: 1 },
        { buttonId: 'btn_no', buttonText: { displayText: '❌ No' }, type: 1 },
        { buttonId: 'btn_maybe', buttonText: { displayText: '🤔 Maybe' }, type: 1 }
      ],
      headerType: 1
    }, { quoted });
  } catch (e) {
    await sock.sendMessage(jid, {
      text: 'Button demo failed (Baileys version / WhatsApp restriction). Fallback text works.'
    }, { quoted });
  }
}

// Start
console.log(chalk.cyan('Starting SAHAN-MD V2...'));
startBot().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
