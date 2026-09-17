module.exports = {
  // ========== SESSION ==========
  // Paste SESSION_ID from Pair Site (or leave empty and use local session folder)
  SESSION_ID: process.env.SESSION_ID || "",

  // ========== OWNER ==========
  OWNER_NUMBER: process.env.OWNER_NUMBER || "94771234567",
  OWNER_NAME: "Sahan",
  BOT_NAME: "SAHAN-MD V2",
  PREFIX: ".",

  // ========== WORK TYPE ==========
  // public | private | group
  WORK_TYPE: "public",

  // ========== FEATURES ==========
  AUTO_READ: false,
  AUTO_STATUS_VIEW: true,
  AUTO_REACT: false,
  ANTI_DELETE: true,

  // ========== MESSAGES ==========
  ALIVE_MSG: `*🤖 SAHAN-MD V2 is Alive!*\n\n*Baileys:* @vanzxy/baileys\n*Plugin System:* ✅\n*Buttons:* Native Flow ✅`,

  // ========== TIMEZONE ==========
  TIMEZONE: "Asia/Colombo"
};
