

require('dotenv').config()
const fs = require('fs');
const { rcon_connect } = require('./rcon_auto_connect.js');
const Discord = require('discord.js');
const client = new Discord.Client();
const baseport = 34228;
const prefix = `.exp`
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
let rcons = {};
//global for all commands to use this object
role = {
    staff: "762264452611440653",
    admin: "764526097768644618",
    mod: "762260114186305546",
}


//array for all ofline servers
let offline_servers = [2, 7]

//standart embed settings like color and footer
let real_discord_embed = Discord.MessageEmbed
Discord.MessageEmbed = function () {
    let discord_embed = new real_discord_embed()
    discord_embed.setTimestamp()
    discord_embed.setFooter(client.user.username, client.user.avatarURL())
    discord_embed.setColor('0xb40e0e')
    return discord_embed
}

async function start() {
    //instantiate the list of commands 
    client.commands = new Discord.Collection();
    for (const file of commandFiles) {
        //require to file so its loaded
        const command = require(`./commands/${file}`);
        //add it to the list 
        client.commands.set(command.name, command);
    }
    
    //9 cause 8 < 9 and we want to inculde 8 and we start at 1 cuase theirs no s0
    for (let i = 1; i < 9; i++) {
        //if servers is offline dont try and connect to it
        if(offline_servers.includes(i)){ 
            rcons[i] = {"connected": false}
            continue; 
        }
        //port starts at baseport 34228 and its it server num so s1 is 34229 etc.
        let port_to_use = baseport + i
        //Use the auto rcon connect
        rcon = await rcon_connect(port_to_use, i)
        //add to the list
        rcons[i] = rcon
    }
    //start listing for commands
    client.login(process.env.DISCORD_TOKEN);
}

start().catch((err)=>{
    console.log(err)
});


client.on("ready", () => {
    let date_string = new Date().toISOString().
        replace(/T/, ' ').      // replace T with a space
        replace(/\..+/, '')     // delete the dot and everything after
    console.log(`${date_string}: I am ready!`)
    //console.log(year + "-" + month + date + " " + hours + ":" + minutes + ":" + seconds + ": I am ready!");
});




client.on("message", async (msg) => {
    //Ends msg early if author is a bot
    function internal_error(err) {
        console.log(err)
        msg.channel.send('Internal error in the command plz contact and admin')
    }
    const guild = msg.guild;
    if (msg.author.bot) return;
    //Ends msg  code early if the command does not start with a prefix

    if (!msg.content.startsWith(prefix)) return;

    // remove the .exp then removes the spaces in the beging and end then splits it up into args
    const args = msg.content.slice(prefix.length).trim().split(/ +/g);

    //gets the command in lower case
    const commandName = args.shift().toLowerCase();
    // get the command or its aka
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aka && cmd.aka.includes(commandName));

    // if no command dont do anything
    if (!command) return;
    
    // disallows commands in dm's to run as commands in dms if it is set to guild only
    if (command.guildOnly && msg.channel.type !== 'text') 
    {
        return msg.reply('Sorry - I can\'t do that in a DM');
    }
    // only runs if below Guild id's (EXP = `260843215836545025`) 762249085268656178 is testing server
    if (command.guildOnly && (guild != `762249085268656178` && guild != `260843215836545025`)) {
        console.log(`Not correct guild`);
        return msg.reply(`Wrong guild`);
    }
    
    // Check to see if you the role you need or a higher one
    let req_role = command.required_role
    if (req_role) {
        let role = await msg.guild.roles.fetch(req_role)
        let allowed = msg.member.roles.highest.comparePositionTo(role) >= 0;
        if (!allowed) {
            console.log(`Unauthorized `);
            msg.channel.send(`You do not have ${role.name}`);
            return;
        };
    }

    // If command requires an argument, decline to run if none is provided. Request arguments in the main export of the command file. 
    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, ${msg.author}!`;
        if (command.usage) {
            reply += `\nThe proper usage would be: \`${prefix} ${command.name} ${command.usage}\``;
        }
        return msg.channel.send(reply);
    }

    try {
        command.execute(msg, args, rcons, internal_error);
    } catch (error) {
        console.log(error);
        msg.reply(`there was an error trying to execute that command!`);
    }
})

