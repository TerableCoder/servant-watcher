String.prototype.clr = function (hexColor){ return `<font color='#${hexColor}'>${this}</font>` };
module.exports = function TerableServant(mod) {
	const command = mod.command || mod.require.command;
	let petInfo;
	
	command.add(['teras', 'terables'], {
		$none(){
    		mod.settings.enabled = !mod.settings.enabled;
        	command.message(`TerableServant is now ${mod.settings.enabled ? "enabled".clr("00FF00") : "disabled".clr("FF0000")}.`);
    	},
    	save(){
			if(petInfo){
				mod.settings.defaultServants[`${mod.game.me.serverId}_${mod.game.me.playerId}`] = {"servantId": petInfo.id.toString(), "uniqueId": petInfo.dbid.toString()};
				command.message(`Servant Saved`);
				mod.saveSettings();
			} else{
				command.message(`Spawn a servant before saving`.clr("FF0000"));
			}
    	}
	});

	mod.hook('S_REQUEST_SPAWN_SERVANT', 3, (event) => {
		if(mod.game.me.is(event.ownerId)){
			petInfo = event;
		}
	});

	mod.hook('S_REQUEST_DESPAWN_SERVANT', 1, (event) => {
		if(petInfo && petInfo.gameId == event.gameId){
			petInfo = null;
		}
	});
	
	mod.hook('C_VISIT_NEW_SECTION', 1, (event) => {
		if(mod.game.me.inDungeon && mod.settings.enabled && mod.game.me.alive){
			const myServant = mod.settings.defaultServants[`${mod.game.me.serverId}_${mod.game.me.playerId}`];
			if(myServant && (!petInfo || Number(myServant.uniqueId) != petInfo.dbid)){ // no servant spawned or wrong servant
				mod.send('C_REQUEST_SPAWN_SERVANT', 1, {
					"servantId": Number(myServant.servantId),
					"uniqueId": Number(myServant.uniqueId),
					"unk": 0
				});
			}
		}
	});
}