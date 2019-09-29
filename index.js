const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;

String.prototype.clr = function (hexColor){ return `<font color='#${hexColor}'>${this}</font>` };
// By KennyPHM
module.exports = function ServantWatcher(mod){
    let spawnedPlayers = [];
    let spawnedPets = [];
	
	mod.command.add('sw', (cmd, arg1, arg2) => {
		if(cmd) cmd = cmd.toLowerCase();
		if(arg1) arg1 = arg1.toLowerCase();
        switch(cmd){
          case 'spawned':
			for(let i = 0; i<spawnedPlayers.length; i++){
				msg('Name: ' + spawnedPlayers[i].name[spawnedPlayers[i].name.length-1], '00AAFF');
				msg('Date: ' + spawnedPlayers[i].date[spawnedPlayers[i].name.length-1]);
				msg("Guild: " + spawnedPlayers[i].guildName);
				msg('ServerId: ' + spawnedPlayers[i].serverId);
				msg('PlayerId: ' + spawnedPlayers[i].playerId);
				msg('GameId: ' + spawnedPlayers[i].gameId);
				if(spawnedPlayers[i].servants.length){
					msg('Spawned Servants: ');
					for(let j = 0; j<spawnedPlayers[i].servants.length; j++){
						msg(JSON.stringify(spawnedPlayers[i].servants[j]));
					}
				} else{ 
					msg('0 Spawned Servants');
				}
			}
			return;
		  case 'spawnedl':
			mod.command.message(spawnedPlayers.length +' players spawned');
			return;
		  case 'get':
			for(let i = 0; i<spawnedPlayers.length; i++){
				if(spawnedPlayers[i].name[0].toLowerCase() === arg1){ // TODO search all names maybe?
					let knownServer = findServer(spawnedPlayers[i].serverId);
					if(knownServer){
						msg('Server: ' + knownServer + ' ~ ServerId: ' + spawnedPlayers[i].serverId + ' ~ PlayerId: ' + spawnedPlayers[i].playerId + ' ~ GameId: ' + spawnedPlayers[i].gameId + ' ~ Spawned Servants: ');
						for(let j = 0; j<spawnedPlayers[i].servants.length; j++){
							msg(JSON.stringify(spawnedPlayers[i].servants[j]));
						}
					} else{
						msg('ServerId: ' + spawnedPlayers[i].serverId + ' ~ PlayerId: ' + spawnedPlayers[i].playerId + ' ~ GameId: ' + spawnedPlayers[i].gameId + ' ~ Spawned Servants: ');
						for(let j = 0; j<spawnedPlayers[i].servants.length; j++){
							msg(JSON.stringify(spawnedPlayers[i].servants[j]));
						}
					}
					return;
				}
			}
			mod.command.message(arg1 + ' isn\'t spawned');
			return;
          case 'search':
            if(arg1 === undefined || arg2 === undefined){
				mod.command.message('SW: Invalid arguments!'); 
				return;
            }
            findUser(arg1, arg2);
            return;
          case 'cs':
          case 'currentserver':
          case 'ms':
          case 'myserver':
			msg('ServerId is: ' + mod.game.me.serverId + ' Named: ' + findServer(mod.game.me.serverId));
			return;
          case 'server':
          case 'servers':
			for(let server of mod.settings.servers){
				msg('ServerId: ' + server.id + ' Name: ' + server.name);
			}
			return;
          case 'inspect':
			if(isNaN(arg1)){
				if(arg1) mod.send('C_REQUEST_USER_PAPERDOLL_INFO', 1, {name: arg1});
				else mod.command.message('No Name nor GameId provided');
				return;
			} else{
				mod.send('C_REQUEST_USER_PAPERDOLL_INFO_WITH_GAMEID', 1, {id: Number(arg1)});
				return;
			}
          default:
			mod.command.message('SW: get "name",  search "serverId" "playerId",  spawned,  myserver');
        }
    });
	
	
	mod.hook('S_LOGIN', 13, (event) => {
		spawnedPlayers = [];
		spawnedPets = [];
    });
	
	mod.game.on('leave_game', () => {
        savePlayers();
    });
	mod.hook('C_LOAD_TOPO_FIN', 'raw', (event) => {
        savePlayers();
    });
	mod.hook('S_RETURN_TO_LOBBY', 'raw', (event) => {
        savePlayers();
    });
	mod.hook('S_EXIT', 'raw', (event) => {
        savePlayers();
    });
	
	mod.hook('S_DESPAWN_USER', 3, (event) => {
		let finder = spawnedPlayers.find(g => g.gameId === event.gameId.toString());
		let index = spawnedPlayers.indexOf(finder);
		if(index > -1){ // update when removed
			let foundServer = findServer(finder.serverId);
			if(foundServer) updateUser(finder, foundServer);
			else updateUser(finder, finder.serverId);
			spawnedPlayers.splice(index, 1);
		}
	});
	
	mod.hook('S_SPAWN_USER', 14, (event) => { // from https://github.com/KennyPHM/GridironDeAnon
		let dataToWrite = {
            serverId: event.serverId,
            playerId: event.playerId,
            guildName: event.guildName,
            templateId: event.templateId,
            gameId: event.gameId.toString(),
			name: [event.name],
			date: [dateStringed()],
			servants: [] // added
		};
		let finder = spawnedPlayers.find(g => g.playerId === event.playerId);
		let index = spawnedPlayers.indexOf(finder);
		if(index > -1){ // remove if exists
			let foundServer = findServer(finder.serverId);
			if(foundServer) updateUser(finder, foundServer);
			else updateUser(finder, finder.serverId);
			spawnedPlayers.splice(index, 1);
		}
		spawnedPlayers.push(dataToWrite);
		finder = spawnedPlayers.find(g => g.playerId === event.playerId);
		
		let yourPets = spawnedPets.filter(g => g.ownerId === dataToWrite.gameId);
		if(yourPets.length){
			msg("Owner: " + event.name, '00AAFF');
			msg("Guild: " + event.guildName, '00AAFF');
			for(let pet of yourPets){ // should only be 1
				finder.servants.push(pet);
				msg("Power: " + pet.power);
				msg("Gift: " + pet.gift);
				msg("Color: " + pet.color);
				msg("Grade: " + pet.level);
				msg("Fellowship: " + pet.fellowship);
			}
		}
    });
    
	// 3-40 power = 13000-13037
	/*giftedSkills id
0	Urgent Recovery 14000 14001 14002
1	Emergency Service 14003 14004 14005
2	Barrier 14006 14007 14008
3	Fellowship 14009 14010 14011
4	Rapid Growth 14012 14013 14014
5	Rapid Advancement 14015 14016 14017
6	Dual Boost 14018 14019 14020
7	Critical Crafting 14021 14022 14023
8	Backup Fisherman 14024 14025 14026
9	Gathering Support 14027 14028 14029*/
	mod.hook('S_ABNORMALITY_BEGIN', 3, (event) => {
		if(!(event.id >= 13000 && event.id <= 13037) && !(event.id >= 14000 && event.id <= 14029)) return;
		if(event.id >= 13000 && event.id <= 13037){ // power
			let finder = spawnedPets.find(g => g.ownerId === event.target.toString());
			if(finder){ // target's pet is spawned
				if(finder.power == (event.id - 12997)){ // legit player
					return;
				}
				// we found a https://github.com/Lambda11/pet-skill-replacer-and-user
				let finder2 = spawnedPlayers.find(g => g.gameId === event.target.toString());
				msg("");
				msg("Bad Name: " + finder2.name[finder2.name.length-1], "FF0000");
				msg("Guild: " + finder2.guildName, 'FF0000');
				msg("Real Power: " + finder.power);
				msg("Applied Power: " + (event.id - 12997));
				msg('ServerId: ' + finder2.serverId);
				msg('PlayerId: ' + finder2.playerId);
				msg('GameId: ' + finder2.gameId);
				msg("Date: " + dateStringed());
			}
		} else{ // giftedSkills id
			let finder = spawnedPets.find(g => g.ownerId === event.target.toString());
			if(finder){ // target's pet is spawned
				let appliedGift = calculateGift(event.id - 13998);
				if(finder.gift == appliedGift){ // legit player
					return;
				}
				// we found a https://github.com/Lambda11/pet-skill-replacer-and-user
				let finder2 = spawnedPlayers.find(g => g.gameId === event.target.toString());
				msg("");
				msg("Bad Name: " + finder2.name[finder2.name.length-1], "FC0FC0");
				msg("Guild: " + finder2.guildName, 'FC0FC0');
				msg("Real Gift: " + finder.gift);
				msg("Applied Gift: " + appliedGift);
				msg('ServerId: ' + finder2.serverId);
				msg('PlayerId: ' + finder2.playerId);
				msg('GameId: ' + finder2.gameId);
				msg("Date: " + dateStringed());
			}
		}
	});
	
	mod.hook('S_REQUEST_DESPAWN_SERVANT', 1, (event) => {
		let finder = spawnedPets.find(g => g.gameId === event.gameId.toString());
		let index = spawnedPets.indexOf(finder);
		if(index > -1){
			spawnedPets.splice(index, 1);
		}
	});
	
	/*id
	marie 	1001 	1002 	1003
	loo 	1004 	1005 	1006
	kuncun 	1007 	1008 	1009
	cocomin	1000/1010 1011 	1012*/
	mod.hook('S_REQUEST_SPAWN_SERVANT', 1, (event) => {
		if(mod.game.me.is(event.ownerId)) return; // mine
		if(event.fellowship < 1) return; // not servant
		let power = 0;
		let color = "?";
		if([1001, 1004, 1007, 1000, 1010].includes(event.id)){ // green servant
			power = calculatePower(3, event.fellowship);
			color = "Green";
		} else if([1002, 1005, 1008, 1011].includes(event.id)){ // blue servant
			power = calculatePower(4, event.fellowship);
			color = "Blue";
		} else if([1003, 1006, 1009, 1012].includes(event.id)){ // yellow servant
			power = calculatePower(5, event.fellowship);
			color = "Yellow";
		}
		let gift = calculateGift(event.giftedSkills[0].id);
		let type = "?";
		if([1001, 1002, 1003].includes(event.id)){
			type = "Marie";
		} else if([1004, 1005, 1006].includes(event.id)){
			type = "Loo";
		} else if([1007, 1008, 1009].includes(event.id)){
			type = "Kuncun";
		} else if([1000, 1010, 1011, 1012].includes(event.id)){
			type = "Cocomin";
		}
		
		let dataToWrite = {
            power: power,
            gift: gift,
            type: type,
            color: color,
			level: event.level, // grade 1-10
            fellowship: event.fellowship, // 1-50
            ownerId: event.ownerId.toString(),
            gameId: event.gameId.toString(),
            dbid: event.dbid.toString(),
			date: dateStringed()
		};
		
		let petFinder = spawnedPets.find(g => g.dbid === dataToWrite.dbid);
		let pfIndex = spawnedPets.indexOf(petFinder);
		if(pfIndex > -1){ // remove if exists
			spawnedPets.splice(pfIndex, 1);
		}
		spawnedPets.push(dataToWrite);
		
		let finder = spawnedPlayers.find(g => g.gameId === dataToWrite.ownerId); // player is spawned
		if(finder){ // player is spawned
			msg("Owner: " + finder.name[finder.name.length-1], '00AAFF');
			msg("Guild: " + finder.guildName, '00AAFF');
			msg("Power: " + dataToWrite.power);
			msg("Gift: " + dataToWrite.gift);
			msg("Color: " + dataToWrite.color);
			msg("Grade: " + dataToWrite.level);
			msg("Fellowship: " + dataToWrite.fellowship);
			
			let oldPet = finder.servants.find(g => g.dbid === dataToWrite.dbid);
			let petIndex = finder.servants.indexOf(oldPet);
			if(petIndex > -1){ // remove if exists
				finder.servants.splice(petIndex, 1);
			}
			finder.servants.push(dataToWrite);
		}
	});
	
	
	function calculatePower(grade, fellowship){ // https://docs.google.com/spreadsheets/d/1vVjt-XMAsKaPDSNjWlRMNCXUQHlWUHp-QKnJb_NhIdw/edit#gid=0
		if(fellowship < 25){ // 1-24 fellowship
			return (grade + Math.floor((fellowship-1) / 3));
		} else if(fellowship < 45){ // 25-44 fellowship
			return (grade + Math.floor((fellowship-1) / 2)-4);
		} else if(fellowship < 51){ // 45-50 fellowship
			return (grade + (fellowship-25)+(2*(fellowship-45)));
		}
	}
	/*giftedSkills id
0	Urgent Recovery 2 3  4
1	Emergency Service 5 6 7
2	Barrier 8 9 10
3	Fellowship 11 12 13
4	Rapid Growth 14 15 16
5	Rapid Advancement 17 18 19
6	Dual Boost 20 21 22 
7	Critical Crafting 23 24 25
8	Backup Fisherman 26 27 28
9	Gathering Support 29 30 31*/
	function calculateGift(id){
		let giftTier = ((id-2) % 3)+1;
		let giftType = Math.floor((id-2) / 3);
		switch(giftType){
		  case 0: giftType = "Urgent Recovery"; break;
		  case 1: giftType = "Emergency Service"; break;
		  case 2: giftType = "Barrier"; break;
		  case 3: giftType = "Fellowship"; break;
		  case 4: giftType = "Rapid Growth"; break;
		  case 5: giftType = "Rapid Advancement"; break;
		  case 6: giftType = "Dual Boost"; break;
		  case 7: giftType = "Critical Crafting"; break;
		  case 8: giftType = "Backup Fisherman"; break;
		  case 9: giftType = "Gathering Support"; break;
		  default: return ("Unknown Gifted Skill " + id);
		}
		return (giftType + " " + giftTier.toString());
	}
	
	function msg(message, color = false){
		console.log(message);
		if(color) message = message.clr(color);
		mod.command.message(message);
	}
	
	function savePlayers(){
		if(spawnedPlayers.length){
			for(let player of spawnedPlayers){
				let foundServer = findServer(player.serverId);
				if(foundServer) updateUser(player, foundServer);
				else updateUser(player, player.serverId);
			}
		}
	}
	
    function findUser(serverId, playerId){
		let foundServer = findServer(serverId);
		
		let finder = spawnedPlayers.find(g => g.playerId == playerId); // update file before reading
		if(finder && finder.serverId == serverId){
			if(foundServer) updateUser(finder, foundServer);
			else updateUser(finder, finder.serverId);
		}
		
		if(foundServer) readFromFile(foundServer, playerId);
		else readFromFile(serverId, playerId);
    }
	
	function findServer(serachServer){
		for(let server of mod.settings.servers){
            if(server.id == serachServer) return server.name;
		}
		msg('Unrecognized serverId: ' + serachServer);
		return null;
	}
	
	function getJsonData(pathToFile) {
		try {
			return JSON.parse(fs.readFileSync(pathToFile));
		}catch(e) {
			return undefined;
		}
	}
	
	function updateUser(dataToWrite, server){
		let settingsPath = path.join(__dirname, 'Users', server, dataToWrite.playerId+'.json');
		let data = getJsonData(settingsPath);
		if(data){ // if existing player, add current name, gameId, and date 
			let finder = data.name.find(g => g == dataToWrite.name[0]);
			let index = data.name.indexOf(finder);
			if(index > -1){ // remove if exists
				data.name.splice(index, 1);
				data.date.splice(index, 1);
			}
			data.name.push(dataToWrite.name[0]); // add up to date info
			data.date.push(dateStringed()); // add up to date info
			data.guildName = dataToWrite.guildName;
			data.gameId = dataToWrite.gameId;
			
			if(data.servants && data.servants.length){
				for(let servant of dataToWrite.servants){
					let oldPet = data.servants.find(g => g.dbid === servant.dbid);
					let petIndex = data.servants.indexOf(oldPet);
					if(petIndex > -1){ // remove if exists
						data.servants.splice(petIndex, 1);
					}
					data.servants.push(servant);
				}
			} else{
				data.servants = dataToWrite.servants; // new servants
			}
			dataToWrite = data; // save user with appended data
		}
		writeToFile(settingsPath, dataToWrite);
	}
	
	function writeToFile(settingsPath, dataToWrite){
		mkdirp(getDirName(settingsPath), function (err) {
			if(err) console.error(err);
			fs.writeFile(settingsPath,(JSON.stringify(dataToWrite, null, 2)), err => {
				if(err) console.error(err);
			});
		});
	}
	
	function readFromFile(server, playerId){
		fs.readFile(path.join(__dirname, 'Users', server, playerId+'.json'), function(err,data){
			if(err){
				mod.command.message('SW: User not found in database.');
				return;
			}
			data = JSON.parse(data);
			msg('      ');
			if(data.guildName) msg("Guild: " + data.guildName);
			msg('ServerId: ' + data.serverId);
			msg('PlayerId: ' + data.playerId);
			msg('GameId: ' + data.gameId);
			for(let i = 0; i<data.name.length; i++){
				msg('Name: ' + data.name[i]);
				msg('Date: ' + data.date[i]);
			}
			for(let j = 0; j<data.servants.length; j++){
				msg(JSON.stringify(data.servants[j]));
			}
		});
	}
	
	function dateStringed(){
		let d = new Date();
		return (d.getMonth()+1) +'/'+ d.getDate() + '/' + d.getFullYear() + ' ' +d.getHours() +':' + d.getMinutes() + ':' + d.getSeconds();
	}
}