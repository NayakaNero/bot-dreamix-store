// commands/admin.js - Semua fitur admin dalam 1 file
const { 
    EmbedBuilder, 
    PermissionsBitField 
} = require('discord.js');

module.exports = {
    name: 'admin',
    description: 'Fitur manajemen admin (khusus owner)',
    
    async execute(message, args, client) {
        // ===== SETTINGAN (GANTI SESUAI KEINGINAN) =====
        const ownerId = '513001772860833794'; // GANTI DENGAN ID DISCORD KAMU!
        const roleName = 'Admin'; // <<< GANTI NAMA ROLE DI SINI (misal: 'Staff', 'Moderator', dll)
        const roleColor = '#7132CA'; // Warna role (merah)
        // ===== END SETTINGAN =====
        
        if (message.author.id !== ownerId) {
            return message.reply('❌ Maaf, command ini hanya untuk owner bot!');
        }

        const subCommand = args[0]?.toLowerCase();

        // ===== TAMPILKAN BANTUAN =====
        if (!subCommand) {
            const helpEmbed = new EmbedBuilder()
                .setColor('#8B0000')
                .setTitle('👑 **FITUR ADMIN**')
                .setDescription(`
**📋 DAFTAR COMMAND:**

\`!admin list\` - Lihat daftar semua admin
\`!admin add @user\` - Tambah admin baru
\`!admin remove @user\` - Hapus admin
\`!admin help\` - Tampilkan bantuan ini

**Role yang digunakan:** \`${roleName}\`
**Owner ID:** ${ownerId}

**Contoh:**
\`!admin add @kucinglucu\`
\`!admin remove @kucinglucu\`
                `)
                .setFooter({ text: 'Khusus owner bot' });

            return message.channel.send({ embeds: [helpEmbed] });
        }

        // ===== LIST ADMIN =====
        if (subCommand === 'list') {
            const adminRole = message.guild.roles.cache.find(r => r.name === roleName);
            
            if (!adminRole) {
                return message.reply(`📋 Role **${roleName}** belum ada di server ini.`);
            }

            const admins = adminRole.members.map(m => `• ${m.user.tag} (<@${m.id}>)`);

            if (admins.length === 0) {
                return message.reply(`📋 Belum ada member dengan role **${roleName}**.`);
            }

            const listEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`👑 **DAFTAR ${roleName.toUpperCase()}**`)
                .setDescription(admins.join('\n'))
                .setFooter({ text: `Total: ${admins.length} ${roleName}` });

            return message.channel.send({ embeds: [listEmbed] });
        }

        // ===== TAMBAH ADMIN =====
        if (subCommand === 'add') {
            const user = message.mentions.users.first();
            if (!user) {
                return message.reply('❌ Gunakan format: `!admin add @username`');
            }

            const member = message.guild.members.cache.get(user.id);
            if (!member) {
                return message.reply('❌ User tidak ditemukan di server ini!');
            }

            // Cari role dengan nama yang sudah ditentukan
            let adminRole = message.guild.roles.cache.find(r => r.name === roleName);
            
            // Buat role baru jika belum ada
            if (!adminRole) {
                try {
                    adminRole = await message.guild.roles.create({
                        name: roleName,
                        color: roleColor,
                        permissions: [
                            PermissionsBitField.Flags.Administrator,
                            PermissionsBitField.Flags.ManageChannels,
                            PermissionsBitField.Flags.ManageRoles,
                            PermissionsBitField.Flags.ManageMessages,
                            PermissionsBitField.Flags.KickMembers,
                            PermissionsBitField.Flags.BanMembers
                        ],
                        reason: `Auto-create dari fitur admin oleh ${message.author.tag}`
                    });
                    
                    console.log(`✅ Role ${roleName} otomatis dibuat!`);
                } catch (error) {
                    console.error(error);
                    return message.reply(`❌ Gagal membuat role ${roleName}!`);
                }
            }

            // Cek apakah user sudah punya role
            if (member.roles.cache.has(adminRole.id)) {
                return message.reply(`❌ ${user} sudah memiliki role **${roleName}**!`);
            }

            try {
                await member.roles.add(adminRole);
                
                const addEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle(`✅ **${roleName.toUpperCase()} ADDED**`)
                    .setDescription(`
${user} sekarang memiliki role **${roleName}**! 🎉

**Role:** ${adminRole}
**Granted by:** ${message.author}
                    `);

                await message.channel.send({ embeds: [addEmbed] });
                
                console.log(`👑 ${user.tag} ditambahkan sebagai ${roleName} oleh ${message.author.tag}`);
                
                if (message.deletable) await message.delete();

            } catch (error) {
                console.error(error);
                message.reply(`❌ Gagal memberikan role ${roleName}: ` + error.message);
            }
            
            return;
        }

        // ===== HAPUS ADMIN =====
        if (subCommand === 'remove') {
            const user = message.mentions.users.first();
            if (!user) {
                return message.reply('❌ Gunakan format: `!admin remove @username`');
            }

            const member = message.guild.members.cache.get(user.id);
            if (!member) {
                return message.reply('❌ User tidak ditemukan di server ini!');
            }

            const adminRole = message.guild.roles.cache.find(r => r.name === roleName);
            if (!adminRole) {
                return message.reply(`❌ Role **${roleName}** tidak ditemukan di server ini!`);
            }

            if (!member.roles.cache.has(adminRole.id)) {
                return message.reply(`❌ ${user} tidak memiliki role **${roleName}**!`);
            }

            // Cegah hapus owner dari admin
            if (user.id === ownerId) {
                return message.reply(`❌ Tidak bisa menghapus owner dari role **${roleName}**!`);
            }

            try {
                await member.roles.remove(adminRole);
                
                const removeEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle(`❌ **${roleName.toUpperCase()} REMOVED**`)
                    .setDescription(`
${user} tidak lagi memiliki role **${roleName}**!

**Role:** ${adminRole}
**Removed by:** ${message.author}
                    `);

                await message.channel.send({ embeds: [removeEmbed] });
                
                console.log(`👑 ${user.tag} dihapus dari ${roleName} oleh ${message.author.tag}`);
                
                if (message.deletable) await message.delete();

            } catch (error) {
                console.error(error);
                message.reply(`❌ Gagal menghapus role ${roleName}: ` + error.message);
            }
            
            return;
        }

        // ===== JIKA SUBCOMMAND TIDAK DIKENAL =====
        message.reply('❌ Command tidak dikenal! Gunakan `!admin` untuk melihat daftar command.');
    }
};