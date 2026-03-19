// commands/ticket.js - FINAL FIX (Hanya kirim pesan saat toko tutup)
const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ChannelType,
    PermissionsBitField
} = require('discord.js');

module.exports = {
    name: 'ticket',
    description: 'Membuat panel ticket bantuan & order',
    
    async execute(message, args, client) {
        
        // Cek permission (hanya admin yang bisa setup)
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Hanya admin yang bisa menggunakan command ini!');
        }

        // Buat button BANTUAN (biru) dan ORDER (hijau)
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_bantuan')
                    .setLabel('🔵 Bantuan')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('ticket_order')
                    .setLabel('🟢 Order')
                    .setStyle(ButtonStyle.Success)
            );

        // Buat embed panel ticket
        const ticketEmbed = new EmbedBuilder()
            .setColor('#8d2dfb')
            .setTitle('📋 **Help & Order**')
            .setDescription(`
Butuh bantuan atau ingin order sesuatu?

Klik tombol dibawah untuk membuat ticket:
- 🔵 Untuk bertanya / meminta bantuan
- 🟢 Untuk order layanan

**Support system**
            `)
            .setFooter({ text: `Ticket System • ${message.guild.name}` })
            .setTimestamp();

        // Kirim panel ticket
        await message.channel.send({ 
            embeds: [ticketEmbed], 
            components: [row] 
        });

        // Hapus command message
        if (message.deletable) await message.delete();
    },

    async button(interaction, client) {
        const customId = interaction.customId;

        try {
            // ===== TOMBOL BANTUAN =====
            if (customId === 'ticket_bantuan') {
                await buatTicket(interaction, client, '🔵 Bantuan');
            }
            
            // ===== TOMBOL ORDER =====
            else if (customId === 'ticket_order') {
                await buatTicket(interaction, client, '🟢 Order');
            }

            // ===== TOMBOL CLOSE TICKET =====
            else if (customId === 'ticket_close') {
                // Cek apakah ini channel ticket
                if (!interaction.channel.name.startsWith('ticket-')) {
                    return interaction.reply({ 
                        content: '❌ Ini bukan channel ticket!', 
                        ephemeral: true 
                    });
                }

                // Konfirmasi close
                const confirmEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription('Apakah kamu yakin ingin menutup ticket ini?');

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('ticket_close_confirm')
                            .setLabel('✅ Ya, Tutup')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('ticket_close_cancel')
                            .setLabel('❌ Batal')
                            .setStyle(ButtonStyle.Secondary)
                    );

                await interaction.reply({ 
                    embeds: [confirmEmbed], 
                    components: [row], 
                    ephemeral: true 
                });
            }

            // ===== KONFIRMASI CLOSE =====
            else if (customId === 'ticket_close_confirm') {
                const channel = interaction.channel;
                
                // Langsung hapus channel tanpa pesan
                await channel.delete().catch(() => {});
            }

            // ===== BATAL CLOSE =====
            else if (customId === 'ticket_close_cancel') {
                await interaction.reply({ 
                    content: '✅ Penutupan ticket dibatalkan.', 
                    ephemeral: true 
                });
            }

            // ===== CLAIM TICKET =====
            else if (customId === 'ticket_claim') {
                // Cek apakah user adalah staff (punya permission manage channels)
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                    return interaction.reply({ 
                        content: '❌ Hanya staff yang bisa claim ticket!', 
                        ephemeral: true 
                    });
                }

                const claimEmbed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setDescription(`📌 Ticket di-claim oleh **${interaction.user.tag}**`);

                await interaction.reply({ embeds: [claimEmbed] });
            }

        } catch (error) {
            console.error('Ticket button error:', error);
            
            // Kalau channel sudah dihapus, jangan kirim reply
            if (error.message.includes('Unknown Channel')) return;
            
            try {
                await interaction.reply({ 
                    content: '❌ Error: ' + error.message, 
                    ephemeral: true 
                }).catch(() => {});
            } catch (e) {}
        }
    }
};

// ===== FUNGSI MEMBUAT TICKET =====
async function buatTicket(interaction, client, tipe) {
    try {
        const user = interaction.user;
        const guild = interaction.guild;

        // Cek apakah user sudah punya ticket
        const existingChannel = guild.channels.cache.find(
            c => c.name === `ticket-${user.username.toLowerCase()}`
        );

        if (existingChannel) {
            return interaction.reply({ 
                content: `❌ Kamu sudah punya ticket di ${existingChannel}!`, 
                ephemeral: true 
            });
        }

        // Cari category ticket
        let category = guild.channels.cache.find(c => 
            c.name === 'TICKETS' && c.type === ChannelType.GuildCategory
        );

        // Buat category jika belum ada
        if (!category) {
            category = await guild.channels.create({
                name: 'TICKETS',
                type: ChannelType.GuildCategory
            });
        }

        // Buat channel ticket baru
        const ticketChannel = await guild.channels.create({
            name: `ticket-${user.username.toLowerCase()}`,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                },
                {
                    id: client.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ManageChannels
                    ]
                }
            ]
        });

        // Role staff yang bisa melihat ticket
        const staffRoles = ['Admin', 'Moderator', 'Support'];
        for (const roleName of staffRoles) {
            const role = guild.roles.cache.find(r => r.name === roleName);
            if (role) {
                await ticketChannel.permissionOverwrites.create(role, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                });
            }
        }

        // ===== CEK STATUS TOKO - HANYA KIRIM JIKA TUTUP =====
        const tokoCommand = client.commands.get('toko');
        
        if (tokoCommand) {
            const status = client.tokoStatus || 'tutup';
            
            // HANYA KIRIM PESAN KALAU TOKO TUTUP
            if (status === 'tutup') {
                const jamOperasional = client.jamOperasional || {
                    'Senin-Jumat': '12.00 - 22.00',
                    'Sabtu-Minggu': '08.00 - 23.00'
                };

                const sekarang = new Date();
                const hari = sekarang.toLocaleDateString('id-ID', { weekday: 'long' });
                let jamHariIni = '';

                if (hari.includes('Senin') || hari.includes('Selasa') || hari.includes('Rabu') || 
                    hari.includes('Kamis') || hari.includes('Jumat')) {
                    jamHariIni = jamOperasional['Senin-Jumat'] || '12.00 - 22.00';
                } else {
                    jamHariIni = jamOperasional['Sabtu-Minggu'] || '08.00 - 23.00';
                }

                const tutupEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('🔴 **TOKO SEDANG TUTUP**')
                    .setDescription(`
Maaf, toko sedang tutup 😴

**⏰ JAM OPERASIONAL:**
${Object.entries(jamOperasional).map(([hari, jam]) => `• **${hari}**: ${jam}`).join('\n')}

**📅 Hari ini**: ${hari}
**⏱️ Jam buka**: ${jamHariIni}

Silakan kembali saat toko sudah buka.
Terima kasih! 🙏
                    `)
                    .setTimestamp();

                await ticketChannel.send({ embeds: [tutupEmbed] });
            }
            // KALAU TOKO BUKA, TIDAK ADA KODE APAPUN - TIDAK KIRIM PESAN
        }

        // Buat embed notifikasi ticket
        const ticketEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎫 **Ticket Opened**')
            .setDescription(`${user} has created a new ${tipe} ticket.`)
            .setFooter({ text: 'Ticket King | /close' })
            .setTimestamp();

        // Buat button actions
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_close')
                    .setLabel('🔒 Close Ticket')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('ticket_claim')
                    .setLabel('📌 Claim Ticket')
                    .setStyle(ButtonStyle.Primary)
            );

        // Kirim pesan utama ticket
        await ticketChannel.send({ 
            content: `${user} | <@&${staffRoles.map(r => guild.roles.cache.find(role => role.name === r)?.id).filter(Boolean).join('> <@&')}>`, 
            embeds: [ticketEmbed], 
            components: [row] 
        });

        // Kirim notifikasi ke user
        await interaction.reply({ 
            content: `✅ Ticket ${tipe} berhasil dibuat! ${ticketChannel}`, 
            ephemeral: true 
        });

    } catch (error) {
        console.error('Buat ticket error:', error);
        await interaction.reply({ 
            content: '❌ Gagal membuat ticket: ' + error.message, 
            ephemeral: true 
        });
    }
};