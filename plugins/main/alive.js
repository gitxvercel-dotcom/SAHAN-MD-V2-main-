const config = require('../../config');
const os = require('os');

module.exports = {
  command: ['alive', 'ping'],
  description: 'Check if bot is online',
  category: 'main',

  async handler(sock, m) {
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const min = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);

    const text = `*🤖 ${config.BOT_NAME} is Alive!*\n\n` +
      `*⏱️ Uptime:* ${h}h ${min}m ${s}s\n` +
      `*📦 Baileys:* @vanzxy/baileys\n` +
      `*🖥️ Platform:* ${os.platform()}\n` +
      `*💾 RAM:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB\n` +
      `*✅ Status:* Online`;

    try {
      const { Button } = require('@vanzxy/baileys');
      await new Button(sock)
        .setTitle('Bot Status')
        .setBody(text)
        .setFooter('SAHAN-MD V2')
        .addReply('📋 Menu', '.menu')
        .send(m.from);
    } catch {
      await m.reply(text);
    }
  }
};
