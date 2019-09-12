const DefaultSettings = {
	"servers": [
	{"id": 4105, "name": "Velika"},
	{"id": 4107, "name": "Kaitor"},
	{"id": 30, "name": "Sikander"}, 
	{"id": 27, "name": "Mystel"}, 
	{"id": 26, "name": "Killian"}, 
	{"id": 32, "name": "Amarun"},
	{"id": 29, "name": "Seren"}, 
	{"id": 31, "name": "Saleron"}, 
	{"id": 28, "name": "Yurian"}, 
	{"id": 8, "name": "카이아의 가호"},
	{"id": 1, "name": "아룬의 영광 - Karas"}, 
	{"id": 2, "name": "Zuras"}, 
	{"id": 5071, "name": "エリーヌ"},
	{"id": 5072, "name": "ルーキー"}, 
	{"id": 2800, "name": "提雅拉尼亞"}, 
	{"id": 500, "name": "Кайа"}, 
	{"id": 501, "name": "Велика"}]
};

module.exports = function MigrateSettings(from_ver, to_ver, settings) {
    if (from_ver === undefined) {
        // Migrate legacy config file
        return Object.assign(Object.assign({}, DefaultSettings), settings);
    } else if (from_ver === null) {
        // No config file exists, use default settings
        return DefaultSettings;
    } else {
        // Migrate from older version (using the new system) to latest one
        if (from_ver + 1 < to_ver) {
            // Recursively upgrade in one-version steps
            settings = MigrateSettings(from_ver, from_ver + 1, settings);
            return MigrateSettings(from_ver + 1, to_ver, settings);
        }
        
        // If we reach this point it's guaranteed that from_ver === to_ver - 1, so we can implement
        // a switch for each version step that upgrades to the next version. This enables us to
        // upgrade from any version to the latest version without additional effort!
        switch(to_ver)
        {
            default:
				let oldsettings = settings
				
				settings = Object.assign(DefaultSettings, {});
				
				for(let option in oldsettings) {
					if(settings[option]) {
						settings[option] = oldsettings[option]
					}
				}
				
				break;
        }
        
        return settings;
    }
}