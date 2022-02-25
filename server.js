require('dotenv').config();

const { Pool, Client } = require('pg')
const connectionString = process.env.PSQL_URI

const con = new Client({
	connectionString,
	ssl: { rejectUnauthorized: false }
})
const createquery = `CREATE TABLE IF NOT EXISTS channelcounter (
	id serial PRIMARY KEY,
	channelname VARCHAR(50) UNIQUE NOT NULL,
	counter INTEGER,
	dailycounter INTEGER,
	last_updated DATE
);
`;
con.connect();
con.query(createquery, (err, res) => {
	if (err) {
		console.error(err);
		return;
	}
	console.log('Table is successfully created');
	//con.end();
});

async function select(channelname) {

	let res = await con.query("SELECT * FROM channelcounter WHERE channelname = '" + channelname + "'");
	if (res.rows[0] == null) {
		res = null
		return res
		await con.end();
	}
	else {
		return res.rows[0]
		await con.end();
	}
	return
	

}
//async function select(channelname) {
//	let response
//	try {
//		const response = await con.query("SELECT * FROM channelcounter WHERE channelname = '" + channelname + "'");
//		return response.rows;
//	}
//	catch (error) {
//		console.log(error)
//	}
			
//}

const tmi = require('tmi.js');
const client = new tmi.Client({
	options: { debug: true, messagesLogLevel: "info" },
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		username: process.env.TWITCH_BOT_USERNAME,
		password: process.env.TWITCH_OAUTH_TOKEN
	},
	channels: ['FrTim1908']
});
//client.connect().catch(console.error);
//client.on('message', (channel, tags, message, self) => {
//	var date = new Date();
//	var today = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
//const insertquery = "INSERT INTO channelcounter (channelname, counter, dailycounter, last_updated) VALUES ('" + channel + "', 1, 1, '" + today + "')"
//	var values = [[channel, 1, 1, today], ["test", 1, 1, today]]
//	console.log(insertquery)
async function insert(insertquery) {
	await con.query(insertquery, (err, res) => {
		if (err) {
			console.error(err);
			return;
		}
		console.log('Data is successfully added/updated');

	});
}

	//var fs = require('fs');
	var data = [];
	var current = {}
	var running = false;


	function resetStatus() { running = false; }

client.connect().catch(console.error);
client.on('message', (channel, tags, message, self) => {

	if (self) return;
	if (!running) {
		if (message.startsWith('!bottest')) {
			var date = new Date();
			var today = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
			channelname = channel.replace('#', '')
			current = {};
			newentry = ""
			message = ""
			setTimeout(resetStatus, 30000);
			//running = true;
			(async () => {
				let insertquery = ""
				current = await select(channel);
				console.log(current)
				if (current == null) {
					newentry = "'" + channel + "',1,1,'" + today + "'"
					insertquery = "INSERT INTO channelcounter (channelname, counter, dailycounter, last_updated) VALUES (" + newentry + ")"
					message = channelname + " has failed to click yellow. " + channelname + " has failed to click yellow 1 time today and 1 time in total."
				}
				else {
					currentdate = current['last_updated'].getFullYear() + '-' + (current['last_updated'].getMonth() + 1) + '-' + current['last_updated'].getDate();
					if (currentdate == today) {
						insertquery = "UPDATE channelcounter SET counter = " + (current['counter'] + 1) + ", dailycounter = " + (current['dailycounter'] + 1) + " WHERE channelname = '" + channel + "'"
						message = channelname + " has failed to click yellow. " + channelname + " has failed to click yellow " + (current['dailycounter'] + 1) + " times today and " + (current['counter'] + 1) + " times in total."
					}
					else {
						newentry = (current['counter'] + 1) + ",1," + "'" + today + "'"
						let value = 2
						//insertquery = "UPDATE channelcounter SET counter = 3, dailycounter = 2 WHERE channelname = '#frtim1908'"
						insertquery = "UPDATE channelcounter SET counter = " + (current['counter'] + 1) + ", dailycounter = 1, last_updated = " + today + " WHERE channelname = '" + channel + "'"
						message = channelname + " has failed to click yellow. " + channelname + " has failed to click yellow 1 time today and " + (current['counter'] + 1) + " times in total."
					}
				}
				console.log(insertquery);
				await insert(insertquery);
				console.log("Done")
				client.say(channel, message);


			})();
		}
	}

});