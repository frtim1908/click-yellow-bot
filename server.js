require('dotenv').config();

const { Pool, Client } = require('pg')
const connectionString = process.env.PSQL_URI
var running = [];
const con = new Client({
	connectionString,
	ssl: { rejectUnauthorized: false }
})

con.connect();
function createtable(tablename) {
	const createquery = `CREATE TABLE IF NOT EXISTS ` + tablename + ` (
	id serial PRIMARY KEY,
	channelname VARCHAR(50) UNIQUE NOT NULL,
	counter INTEGER,
	dailycounter INTEGER,
	last_updated DATE
);
`;
	con.query(createquery, (err, res) => {
		if (err) {
			console.error(err);
			return;
		}
		console.log('Table is successfully created');
		;
	});
}
function droptable(tablename) {
	con.query('DROP TABLE ' + tablename, (err, res) => {
		if (err) {
			console.error(err);
			return;
		}
		console.log('Table is successfully deleted');
		;
	});
}

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
	channels: ['FrTim1908', 'Ja_Brownie']
});

async function insert(insertquery) {
	await con.query(insertquery, (err, res) => {
		if (err) {
			console.error(err);
			return;
		}
		console.log('Data is successfully added/updated');

	});
}

function addtorunning(channel) {
	running.push(channel)
}

var data = [];
var current = {}
function isin(channelid) {
	result = false
	for (var i = 0; i < running.length; i++) {

		if (running[i] === channelid) {
			result = true
		}

	}
	return result
}
function resetStatus(channelid) {
	for (var i = 0; i < running.length; i++) {

		if (running[i] === channelid) {

			running.splice(i, 1);
		}

	}

}
client.connect().catch(console.error);
client.on('message', (channel, user, message, self) => {
	//if (message == '!resetcounter') {
	//	function main() { }
	//	(async () => {
	//		var date = new Date();
	//		var today = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
	//		insertquery = "UPDATE channelcounter SET counter = 0, dailycounter = 0, last_updated = '" + today + "' WHERE channelname = '" + channel + "'"
	//		await insert(insertquery);
	//		console.log("Done")
	//	})();
	//}
	channelname = channel.replace('#', '')
	var date = new Date();
	var today = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
	if (message.startsWith('!yellows')){
		var reply = ""
		function main() { }
			(async () => {
				current = await select(channel);
				if (current == null) {
					reply = channelname + " has failed to click yellow 0 times today and 0 time in total."
				}
				else {
					currentdate = current['last_updated'].getFullYear() + '-' + (current['last_updated'].getMonth() + 1) + '-' + current['last_updated'].getDate();
					if (currentdate == today) {
						reply = channelname + " has failed to click yellow " + current['dailycounter'] + " time" + (current['dailycounter'] == 1 ? "" : "s") + " today and " + current['counter'] + " time" + (current['counter'] == 1 ? "" : "s") + " in total."
					}
					else {
						reply = channelname + " has failed to click yellow 0 times today and " + current['counter'] + " time" + (current['counter'] == 1 ? "" : "s") + " in total."
					}
				}
				client.say(channel, reply);
			})();
			
	}
	
	if (self) return;
	if (!isin(channel) && (message.startsWith('+yellow')) && (user.mod || user['user-type'] === 'mod' || user.username === channelname)) {
		

		current = {};
		newentry = ""
		message = ""
		addtorunning(channel)
		setTimeout(function () {
			for (var i = 0; i < running.length; i++) {

				if (running[i] === channel) {

					running.splice(i, 1);
				}

			}
		}, 30000);
		function main() { }
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
					insertquery = "UPDATE channelcounter SET counter = " + (current['counter'] + 1) + ", dailycounter = 1, last_updated = '" + today + "' WHERE channelname = '" + channel + "'"
					message = channelname + " has failed to click yellow. " + channelname + " has failed to click yellow 1 time today and " + (current['counter'] + 1) + " times in total."
				}
			}
			console.log(insertquery);
			await insert(insertquery);
			console.log("Done")
			client.say(channel, message);
		})();
	}

});