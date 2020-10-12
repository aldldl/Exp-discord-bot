const Discord = require('discord.js');
/**
 * 
 * @param {Number} server 
 * @param {Rcon} rcon 
 * @param {Discord.Message} msg 
 * @param {string} reason 
 * @param {string} tojail
*/
async function runcommand(server, rcon, msg, to_un_jail) {
    if (!rcon.connected) {
        await msg.channel.send(`S${server} is not connected the bot.`)
        return;
    }
    let res = await rcon.send(`/unjail ${to_un_jail}`)
    if (res === "Command Complete\n") {
        await msg.channel.send(`**${to_un_jail}** has been jailed on S${server} for.`);
        const Embed = Discord.MessageEmbed()
        Embed.addField('UnJail', `A player has been Unjailed`, false);
        Embed.addField(`Server Details`, `server: S${server}`, false);
        Embed.addField(`Player`, `${to_un_jail}`, true);
        Embed.addField(`By`, `${msg.author.username}`, true);
        Embed.setColor("0xb40e0e");
        let reportChan = msg.guild.channels.cache.get('764881627893334047');
        await reportChan.send(Embed);
        console.log(`${msg.author.username} has jailed ${to_un_jail} on S${server} for`);
    } else {
        await msg.channel.send(`Command might have failed result: \`\`\`${res}\`\`\``);
    }
}

module.exports = {
    name: 'unjail',
    aka: ['unlockup'],
    description: 'jail any user (Admin/Mod only command)',
    guildOnly: true,
    args: true,
    helpLevel: 'staff',
    required_role: role.staff,
    usage: `<#> <username> <reason>`,
    execute(msg, args, rcons, internal_error) {
        const server = Math.floor(Number(args[0]));
        let to_un_jail = args[1];
        if (!server) {
            msg.channel.send('Please pick a server first just a number (1-8)')
                .catch((err) => { internal_error(err); return });
            return;
        }
        if (!to_un_jail) {
            msg.channel.send(`You need to tell us who you would like to unjail for us to be able to unjail them`)
                .catch((err) => { internal_error(err); return })
            return;
        }
        if (server < 9 && server > 0) {
            console.log('Server is 1-8');
            runcommand(server, rcons[server], msg, to_un_jail)
                .catch((err) => { internal_error(err); return })
        } else {
            msg.reply(`Server number can\'t be bigger then 8 or smaller then 1. Correct usage is \` .exp unjail <server#> <username>\``)
                .catch((err) => { internal_error(err); return })
            console.log(`jail by ${msg.author.username} incorrect server number`);
            return;
        }
    },
};