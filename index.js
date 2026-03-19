// index.js - FINAL VERSION (with admin filter, NO auto-response)
require('dotenv').config();
const { Client, GatewayIntentBits, Collection, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

client.commands = new Collection();
client.embedSessions = new Map(); // Untuk session embed

// ===== TAMBAHAN UNTUK FITUR TOKO =====
client.tokoStatus = 'buka'; // Default toko buka
client.tokoBukaSejak = null;
client.jamOperasional = {
    'Senin-Jumat': '12.00 - 22.00',
    'Sabtu-Minggu': '08.00 - 23.00'
};
// ===== END TAMBAHAN =====

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
    console.log(`✅ Command loaded: ${command.name}`);
}

// READY EVENT
client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} online!`);
    console.log(`🏪 Status toko: ${client.tokoStatus === 'buka' ? 'BUKA' : 'TUTUP'}`);
    client.user.setActivity('!embed | !ticket', { type: 2 });
});

// MESSAGE HANDLER
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    // ===== FILTER COMMAND KHUSUS ADMIN =====
    // Daftar command yang hanya bisa dijalankan admin
    const adminOnlyCommands = ['toko', 'ticket', 'embed']; // SEMUA COMMAND ADMIN DI SINI
    
    if (adminOnlyCommands.includes(commandName)) {
        // Cek apakah user punya permission admin
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Maaf, command ini hanya untuk admin!');
        }
    }
    // ===== END FILTER =====

    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(error);
        message.reply('❌ Error: ' + error.message);
    }
});

// ==================== INTERACTION HANDLER ====================
client.on('interactionCreate', async interaction => {
    try {
        // ===== BUTTON HANDLER =====
        if (interaction.isButton()) {
            // Handler untuk command embed
            if (interaction.customId.startsWith('embed_')) {
                const command = client.commands.get('embed');
                if (command && command.button) {
                    await command.button(interaction, client);
                    return;
                }
            }
            
            // Handler untuk command ticket
            if (interaction.customId.startsWith('ticket_')) {
                const command = client.commands.get('ticket');
                if (command && command.button) {
                    await command.button(interaction, client);
                    return;
                }
            }
        }
        
        // ===== MODAL SUBMIT HANDLER =====
        if (interaction.isModalSubmit()) {
            // Handler untuk modal embed
            if (interaction.customId.startsWith('modal_')) {
                const command = client.commands.get('embed');
                if (command && command.modal) {
                    await command.modal(interaction, client);
                    return;
                }
            }
            
            // Handler untuk modal ticket
            if (interaction.customId === 'ticket_modal') {
                const command = client.commands.get('ticket');
                if (command && command.modal) {
                    await command.modal(interaction, client);
                    return;
                }
            }
        }
        
        // ===== SELECT MENU HANDLER =====
        if (interaction.isStringSelectMenu()) {
            // Handler untuk select menu embed
            if (interaction.customId.startsWith('select_')) {
                const command = client.commands.get('embed');
                if (command && command.selectMenu) {
                    await command.selectMenu(interaction, client);
                    return;
                }
            }
        }

    } catch (error) {
        console.error('Interaction Error:', error);
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: '❌ Error: ' + error.message, 
                    ephemeral: true 
                });
            }
        } catch (e) {}
    }
});

// LOGIN
client.login(process.env.DISCORD_TOKEN);
