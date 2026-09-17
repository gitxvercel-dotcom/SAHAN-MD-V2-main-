const config = require('../../config');

module.exports = {
  command: ['menu', 'help', 'list'],
  alias: ['m'],
  description: 'Show main menu with buttons',
  category: 'main',

  async handler(sock, m, { prefix, commands, categories, args }) {
    const cats = Object.keys(categories || {}).sort();
    let menuText = `*┏━━━「 ${config.BOT_NAME} 」━━━┓*\n\n`;
    menuText += `*👋 Hello* ${m.pushName || 'User'}\n`;
    menuText += `*📌 Prefix:* ${prefix}\n`;
    menuText += `*📦 Baileys:* @vanzxy/baileys\n\n`;

    for (const cat of cats) {
      const list = categories[cat] || [];
      if (list.length === 0) continue;
      menuText += `*『 ${cat.toUpperCase()} 』*\n`;
      for (const cmd of list) {
        menuText += `  ▸ ${prefix}${cmd.name}${cmd.description ? ` – ${cmd.description}` : ''}\n`;
      }
      menuText += '\n';
    }

    menuText += `*┗━━━━━━━━━━━━━━━━┛*\n`;
    menuText += `> Powered by *SAHAN-MD V2*`;

    // Try native Button from @vanzxy/baileys
    try {
      const { Button } = require('@vanzxy/baileys');
      await new Button(sock)
        .setTitle(`${config.BOT_NAME} MENU`)
        .setBody(menuText)
        .setFooter('SAHAN-MD V2 • Premium')
        .addReply('🏓 Alive', `${prefix}alive`)
        .addReply('👑 Owner', `${prefix}owner`)
        .addReply('🎵 Song', `${prefix}song`)
        .send(m.from);
    } catch (e) {
      // Fallback text
      await m.reply(menuText);
    }
  }
};
