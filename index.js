require('./config')
const { default: makeWASocket, DisconnectReason, useSingleFileAuthState } = require('@adiwajshing/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const readline = require('readline');
const pini = require("pino");

const question = (text) => {
const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
  });
return new Promise((resolve) => {
rl.question(text, resolve)
  })
};
const usePairingCode = true

async function startResz() {
const { state, saveState } = useSingleFileAuthState('./auth_info.json');

    const resz = makeWASocket({
        logger: pino({ level: "silent" }),
printQRInTerminal: !usePairingCode,
auth: state,
browser: ['Chrome (Linux)', '', '']
});
if(usePairingCode && !resz.authState.creds.registered) {
const nohp = await question('Masukan no Hp yang mau jadi bot, contoh: 628002983838/n');
const code = resz.requestPairingCode(nohp.trim())
console.log(`Kodenya: ${code}`)
}

    resz.ev.on('creds.update', saveState);

    resz.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect =
                (lastDisconnect.error = Boom.isBoom(lastDisconnect?.error) &&
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);

            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('WhatsApp bot connected!');
        }
    });

    resz.ev.on('messages.upsert', async (m) => {
        const message = m.messages[0];
        if (!message.message) return;

        const from = message.key.remoteJid;
        const text = message.message.conversation || message.message.extendedTextMessage?.text;

        console.log(`Pesan diterima dari ${from}: ${text}`);

        // Balas pesan
        if (text === 'Hai') {
            await resz.sendMessage(from, { text: 'Hai juga! Ada yang bisa saya bantu?' });
        } else if (text === 'Ping') {
            await resz.sendMessage(from, { text: 'Pong!' });
        }
    });
}


startBot().catch((err) => console.log('Terjadi kesalahan: ', err));
