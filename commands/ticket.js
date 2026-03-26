// commands/ticket.js - Ticket King Style (Full Copy)
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
    description: 'Membuat panel ticket ala Ticket King',
    
    async execute(message, args, client) {
        
        // Cek permission (hanya admin yang bisa setup)
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Hanya admin yang bisa menggunakan command ini!');
        }

        // Buat button ORDER dan BANTUAN (tanpa ikon, hanya teks seperti Ticket King)
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_order')
                    .setLabel('Order')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('ticket_bantuan')
                    .setLabel('Bantuan')
                    .setStyle(ButtonStyle.Primary)
            );

        // Buat embed panel ticket - mirip Ticket King
        const ticketEmbed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('Help & Order')
            .setDescription(`
Butuh bantuan atau ingin order sesuatu?

Klik tombol dibawah untuk membuat ticket:
- 🟢 Untuk order layanan
- 🔵 Untuk bertanya / meminta bantuan

**Support system**
            `)
            .setFooter({ text: 'Ticket King', iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png' })
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
            // ===== TOMBOL ORDER =====
            if (customId === 'ticket_order') {
                await buatTicket(interaction, client, '🐍 Order');
            }
            
            // ===== TOMBOL BANTUAN =====
            else if (customId === 'ticket_bantuan') {
                await buatTicket(interaction, client, '🔵 Bantuan');
            }

            // ===== TOMBOL CLOSE TICKET =====
            else if (customId === 'ticket_close') {
                const isOrderThread = interaction.channel.isThread?.() && interaction.channel.name.startsWith('order-');
                const isBantuanChannel = interaction.channel.name?.startsWith('bantuan-');
                
                if (!isOrderThread && !isBantuanChannel) {
                    return interaction.reply({ 
                        content: '❌ Ini bukan channel/thread ticket!', 
                        ephemeral: true 
                    });
                }

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
                
                if (channel.isThread?.()) {
                    await channel.setArchived(true).catch(() => {});
                    await channel.delete().catch(() => {});
                } else {
                    await channel.delete().catch(() => {});
                }
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
        const channel = interaction.channel;

        // Cek apakah user sudah punya ticket aktif
        const existingChannel = guild.channels.cache.find(
            c => c.name === `ticket-${user.username.toLowerCase()}`
        );
        
        const existingThread = channel.threads?.cache.find(
            t => t.name === `ticket-${user.username}` && !t.archived
        );

        if (existingChannel || existingThread) {
            return interaction.reply({ 
                content: `❌ Kamu sudah punya ticket aktif!`, 
                ephemeral: true 
            });
        }

        // Buat channel ticket (semua jadi channel, biar mirip Ticket King)
        let category = guild.channels.cache.find(c => 
            c.name === 'TICKETS' && c.type === ChannelType.GuildCategory
        );

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

        // Role staff yang bisa melihat ticket (Admin, Moderator, Support)
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

        // Buat embed notifikasi ticket - MIRIP TICKET KING
        const ticketEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Ticket Opened')
            .setDescription(`${user} has created a new ${tipe} ticket.`)
            .setFooter({ text: 'Ticket King | /close' })
            .setTimestamp();

        // Buat button actions (mirip Ticket King)
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_close')
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('ticket_claim')
                    .setLabel('Claim Ticket')
                    .setStyle(ButtonStyle.Primary)
            );

        // Kirim pesan utama ticket
        await ticketChannel.send({ 
            content: `${user}`, 
            embeds: [ticketEmbed], 
            components: [row] 
        });

        // Kirim notifikasi ke user (mirip Ticket King)
        const successEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setDescription(`Your ticket has been created!\n\n[Go to Ticket](${ticketChannel.url})`);

        await interaction.reply({ 
            embeds: [successEmbed],
            ephemeral: true 
        });

    } catch (error) {
        console.error('Buat ticket error:', error);
        await interaction.reply({ 
            content: '❌ Gagal membuat ticket: ' + error.message, 
            ephemeral: true 
        });
    }
}
