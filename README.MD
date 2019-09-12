# ServantWatcher
Detect Pet Exploit

* Be automatically notified when someone uses https://github.com/Lambda11/pet-skill-replacer-and-user

* `sw get name` the player to learn their serverId and playerId so that you can `sw search serverId playerId` to see all the servants you've seen them use and other info.

# Commands
sw
* Lists all commands

sw get "name"
* Lists the: serverId, playerId, and gameId of the player
* Example usage: `sw get name`

sw search "serverId" "playerId"
* Lists the: serverId, playerId, gameId, all known names, last seen dates of names, and all seen servants for the specified player
* Exmaple usage: `sw search 4107 184`

sw spawned
* Lists the: serverId, playerId, gameId, name,  date of last seen, and currently spawned servants for all spawned players
* Example usage: `sw spawned`

sw myserver
* Lists the current serverId and server name
* Example usage: `sw myserver`
