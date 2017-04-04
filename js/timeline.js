////////////////////////////////////////////////////////////////////////////////////
// TimeLine Class
////////////////////////////////////////////////////////////////////////////////////

class TimeLine {

	constructor()
	{
		this.ERROR_ID_VERSION_GET_ERROR 		= "サーバーバージョン情報が取得出来ませんでした";
		this.ERROR_ID_REALM_GET_ERROR 			= "バージョン情報が取得出来ませんでした";
		this.ERROR_ID_CHAMPION_IMG_GET_ERROR 	= "チャンピオンイメージ情報が取得出来ませんでした";
		this.ERROR_ID_SUMMONER_SPELL_GET_ERROR 	= "チーム情報が取得出来ませんでした";
		this.ERROR_ID_ITEM_IMG_GET_ERROR 		= "アイテムイメージ情報が取得出来ませんでした";
		this.ERROR_ID_TEAM_GET_ERROR 			= "チーム情報が取得出来ませんでした";
		this.ERROR_ID_MASTERY_IMG_GET_ERROR 	= "マスタリーイメージ情報が取得出来ませんでした";
		this.ERROR_ID_MATCH_DETAILS_GET_ERROR	= "試合情報が取得出来ませんでした";
		this.ERROR_ID_MATCH_TIMELINE_GET_ERROR	= "タイムライン情報が取得出来ませんでした";

		this.VERSION = "";
		this.CDN_URL = "";

		this.JSON_DATA_MATCHDETAIL = {};
		this.JSON_DATA_TIMELINE = {};
		this.JSON_DATA_CHAMP_IMG = new Array();
		//this.JSON_DATA_SPELL_IMG = new Array();
		this.JSON_DATA_ITEM_IMG = new Array();
		//this.JSON_DATA_MASTERY_IMG = new Array();

		//this.CANVAS_CHAMPION_IMG = new Array();
		//this.CANVAS_MAP_IMG = "";

		this.TEAM_TAG = [ "blue", "red" ];

		this.TIMELINE_WORK_DATA = {};
		this.VISION_WARD_ID = new Array();
	}

	GetMatchData(data)
	{
		var set_data = {};

		set_data.gameVer = data.gameVersion;
		
		return set_data;
	}

	Init(href_url)
	{
		var self = this;

		var data = href_url.split("?")[1];
		var text = data.split("=")[1];
		var url = decodeURIComponent(text);

		var index = url.search("#");
		url = url.substr(index);
		index = url.search("/");
		url = url.substr(index+1);
		index = url.search("/");

		var gameRealm = url.substr(0, index);

		url = url.substr(index+1);
		var isGameHash = url.search('gameHash') != -1;

		if( isGameHash )
			index = url.search('[\?]');
		else
			index = url.search("/");

		var gameId = url.substr(0, index);

		url = url.substr(index+1);
		if( isGameHash )
		{
			index = url.search('=');
			url = url.substr(index+1);
			index = url.search('&');
		}
		else
		{
			index = url.search('[\?]');
		}

		if( index != -1 )
			url = url.substr(0, index);

		var gameHash = url;

		var request = [
			//{ error_id: this.ERROR_ID_MATCH_DETAILS_GET_ERROR,	url: './php/main.php', data: { func:"GetMatchDetails", realm:gameRealm, id:gameId, hash:gameHash },  },
			{ error_id: this.ERROR_ID_MATCH_DETAILS_GET_ERROR,	url: './data/ljl.json', data: {},  },
			//{ error_id: this.ERROR_ID_MATCH_TIMELINE_GET_ERROR,	url: './php/main.php', data: { func:"GetMatchTimeline", realm:gameRealm, id:gameId, hash:gameHash },  },
			{ error_id: this.ERROR_ID_MATCH_TIMELINE_GET_ERROR,	url: './data/ljl_timeline.json', data: {},  },
			{ error_id: this.ERROR_ID_VERSION_GET_ERROR,		url: './php/main.php', data: { func:"GetVersion" },  },
		];

		var jqXHRList = [];

		for( var i = 0, max = request.length ; i < max ; ++i )
		{
			jqXHRList.push($.ajax(
			{
				url: request[i].url,
				type: 'GET',
				dataType: 'json',
				data: request[i].data,
			}));
		}

		$.when.apply(null, jqXHRList).done(function ()
		{
			console.log("Success : Main");

			var json = [];
			var statuses = [];
			var jqXHRResultList = [];
			
			for( var i = 0, max = arguments.length ; i < max ; ++i )
			{
				var result = arguments[i];
				json.push(result[0]);
				statuses.push(result[1]);
				jqXHRResultList.push(result[3]);
			}

			var matchDetailJson = json[0];
			self.JSON_DATA_TIMELINE = json[1];
			var versionJson = json[2];

			var matchDetailData = { game:{}, teams:[] };
			matchDetailData.game = self.GetMatchData(matchDetailJson);
			matchDetailData.teams = self.GetTeamData(matchDetailJson);
			/*
			var lane = ["TOP","JUNGLE","MIDDLE","BOTTOM", "BOTTOM"];
			var sub = ["DUO_CARRY", "DUO_SUPPORT"];
			var work = [];

			for( var i = 0 ; i < matchDetailData.teams.length ; ++i )
			{
				work[i] = [];
				for( var j = 0, sub_index = 0 ; j < lane.length ; ++j )
				{
					for( var k = 0 ; k < matchDetailData.teams[i].player.length ; ++k )
					{
						if( lane[j] == matchDetailData.teams[i].player[k].lane )
						{
							if( lane[j] != "BOTTOM" )
							{
								work[i][j] = matchDetailData.teams[i].player[k];
								break;
							}
							else if(sub[sub_index] == matchDetailData.teams[i].player[k].sub_lane)
							{
								work[i][j] = matchDetailData.teams[i].player[k];
								sub_index++;
								break;
							}
						}
					}
				}
			}
			for( var i = 0 ; i < work.length ; ++i )
			{
				matchDetailData.teams[i].player = work[i];
			}
			*/
			self.JSON_DATA_MATCHDETAIL = matchDetailData;

			console.log("------- json -------");
			console.log(json);
			console.log("------- matchDetailData -------");
			console.log(matchDetailJson);
			console.log("------- matchTimelineJson -------");
			console.log(self.JSON_DATA_TIMELINE);
//			console.log("------- versionJson -------");
//			console.log(versionJson);
			
			for( var i in self.JSON_DATA_TIMELINE.frames )
			{
				self.JSON_DATA_TIMELINE.frames[i].events = self.JSON_DATA_TIMELINE.frames[i].events.filter(function(a){
					switch (a.type)
					{
						case "ITEM_DESTROYED" :
						case "SKILL_LEVEL_UP" :
						case "WARD_PLACED " :
							return false;
						default :
							return true;
					}
				});
			}

			self.VERSION = self.GetVersion(matchDetailData.game.gameVer, versionJson);
			self.InitDataJson(matchDetailData, self.JSON_DATA_TIMELINE);
			self.SetTimiLineFrameData(matchDetailData);
		});

		$.when.apply(null, jqXHRList).fail(function ()
		{
			console.log("Fail : Main");
			console.log(jqXHRList);

			for( var i = 0 ; i < jqXHRList.length ; ++i )
			{
				if( jqXHRList[i].statusText === "error" )
				{
					errorDlg(request[i].error_id);
				}
			}
		});
	}

	InitDataJson(matchDetailData, matchTimelineJson)
	{
		var self = this;

		var request = [
			{ error_id: this.ERROR_ID_REALM_GET_ERROR,			url: './php/main.php', data: { func:"GetRealm" },  },
			{ error_id: this.ERROR_ID_CHAMPION_IMG_GET_ERROR,	url: './php/main.php', data: { func:"GetChampionImage", ver:this.VERSION },  },
			{ error_id: this.ERROR_ID_ITEM_IMG_GET_ERROR,		url: './php/main.php', data: { func:"GetItem", ver:this.VERSION },  },
//			{ error_id: this.ERROR_ID_SUMMONER_SPELL_GET_ERROR,	url: './php/main.php', data: { func:"GetSummonerSpells", ver:this.VERSION },  },
//			{ error_id: this.ERROR_ID_MASTERY_IMG_GET_ERROR,	url: './php/main.php', data: { func:"GetMasteryImage", ver:this.VERSION },  },
		];

		var jqXHRList = [];

		for( var i = 0, max = request.length ; i < max ; ++i )
		{
			jqXHRList.push($.ajax(
			{
				url: request[i].url,
				type: 'GET',
				dataType: 'json',
				data: request[i].data,
			}));
		}

		$.when.apply(null, jqXHRList).done(function ()
		{
			console.log("Success : InitTimeLine");

			var json = [];
			var statuses = [];
			var jqXHRResultList = [];
			
			for( var i = 0, max = arguments.length ; i < max ; ++i )
			{
				var result = arguments[i];
				json.push(result[0]);
				statuses.push(result[1]);
				jqXHRResultList.push(result[3]);
			}
			
			console.log("------- json -------");
			console.log(json);

			var realmJson = json[0];
			var champImgJson = json[1];
			var itemImgJson = json[2];
//			var spellJson = json[2];
//			var masteryImgJson = json[4];

			var championImgData = new Array();
			var itemImgImgData = new Array();
//			var spellImgData = new Array();
//			var masteryImgData = new Array();

			// ソート
			for(var key in champImgJson.data)
				self.JSON_DATA_CHAMP_IMG.push(champImgJson.data[key]);
			
			self.JSON_DATA_CHAMP_IMG.sort(function(a, b)
			{
					if(a.key < b.key) return -1;
					if(a.key > b.key) return 1;
					if(a.key == b.key) return 0;
			});
			
			for(var key in itemImgJson.data)
				itemImgImgData[key] = itemImgJson.data[key];
			
			var isSet = false;
			for(var key in itemImgImgData )
			{
				if( !itemImgImgData[key].name )
					continue;
				
				if(itemImgImgData[key].name.indexOf("ward") != -1 || itemImgImgData[key].name.indexOf("Ward") != -1 )
				{
					isSet = false;
					if( itemImgImgData[key].name.indexOf("vision") != -1 || itemImgImgData[key].name.indexOf("Vision") != -1 )
						isSet = true;
					if( itemImgImgData[key].name.indexOf("control") != -1 || itemImgImgData[key].name.indexOf("Control") != -1 )
						isSet = true;

					if(isSet)
						self.VISION_WARD_ID.push(itemImgImgData[key].id);
				}

			}
			/*
			for(var key in spellJson.data)
			{
				var id = spellJson.data[key].id;
				spellImgData[id] = spellJson.data[key];
			}

			spellImgData.sort(function(a, b)
				{
					if(a.name < b.name) return -1;
					if(a.name > b.name) return 1;
					if(a.name == b.name) return 0;
				}
			);
			for(var key in masteryImgJson.data)
			{
				masteryImgData[key] = masteryImgJson.data[key];
			}

			masteryImgData.tree = masteryImgJson.tree;
			
			masteryImgData.sort(function(a, b)
				{
					if(a.name < b.name) return -1;
					if(a.name > b.name) return 1;
					if(a.name == b.name) return 0;
				}
			);
			*/

			self.CDN_URL = realmJson.cdn;

			/*
			console.log("------- championImgData -------");
			console.log(self.JSON_DATA_CHAMP_IMG);
			console.log("------- spellImgData -------");
			console.log(spellImgData);
			console.log("------- itemImgImgData -------");
			console.log(itemImgImgData);
			console.log("------- masteryImgData -------");
			console.log(masteryImgData);
			*/
			// self.InitTimeLineCanvas(matchDetailData);
			self.InitPlayer();
			self.InitTimeLineSlideBar();
			self.Show();
		});

		$.when.apply(null, jqXHRList).fail(function ()
		{
			console.log("Fail : InitTimeLine");
			console.log(jqXHRList);

			for( var i = 0 ; i < jqXHRList.length ; ++i )
			{
				if( jqXHRList[i].statusText === "error" )
				{
					errorDlg(request[i].error_id);
				}
			}
		});
	}

	InitPlayer()
	{
		var newTag, target;		
		var tag = new Array();
		var player_target;
		var new_tag_name = [
			{	name:"champion_img",	isCanvas:false	},
			{	name:"Name", 			isCanvas:false	},
			{	name:"Lv",				isCanvas:true	},
			{	name:"Xp",				isCanvas:true	},
			{	name:"Gold",			isCanvas:true	},
			{	name:"CS",				isCanvas:true	},
			{	name:"MinionCS",		isCanvas:true	},
			{	name:"JungleCS",		isCanvas:true	},
			{	name:"DragonKill",		isCanvas:true	},
			{	name:"RiftHeraldKill",	isCanvas:true	},
			{	name:"BaronKill",		isCanvas:true	},
			{	name:"TowerKill",		isCanvas:true	},
			{	name:"InhibitorKill",	isCanvas:true	},
			{	name:"WardPlace",		isCanvas:true	},
			{	name:"WardKill",		isCanvas:true	},
			{	name:"BuyVisionWard",	isCanvas:true	},
			{	name:"Kill",			isCanvas:true	},
			{	name:"Death",			isCanvas:true	},
			{	name:"Assiste",			isCanvas:true	},
			{	name:"PhysicalDamageDealtToChampion",		isCanvas:true	},
			{	name:"PhysicalDamageDealtToPlayer",			isCanvas:true	},
			{	name:"MagicDamageDealtToChampion",			isCanvas:true	},
			{	name:"MagicDamageDealtToPlayer",			isCanvas:true	},
			{	name:"TrueDamageDealtToChampion",			isCanvas:true	},
			{	name:"TrueDamageDealtToPlayer",				isCanvas:true	},
			{	name:"TotalDamageDealt",					isCanvas:true	},
			{	name:"TotalDamageDealtToBuilding",			isCanvas:true	},
			{	name:"TotalDamageDealtToChampion",			isCanvas:true	},
			{	name:"TotalCrawdControlDamageDealt",		isCanvas:true	},
			{	name:"TotalDamageTaken",					isCanvas:true	},
			{	name:"PhysicalDamageTaken",					isCanvas:true	},
			{	name:"MagicDamageTaken",					isCanvas:true	},
			{	name:"TrueDamageTaken",						isCanvas:true	},
			{	name:"TotalHeal",							isCanvas:true	},
			{	name:"TotalHealToUnit",						isCanvas:true	},
		];
		
		for( var i = 1 ; i <= 5 ; ++i )
		{
			target = document.getElementById("player");
			newTag = document.createElement("player"+i);
			target.appendChild(newTag);
			player_target = newTag;
			for( var j = 0 ; j < new_tag_name.length ; ++j )
			{
				newTag = document.createElement(new_tag_name[j].name);
				player_target.appendChild(newTag);
				target = newTag;
				for( var k = 0 ; k < this.TEAM_TAG.length ; ++k )
				{
					newTag = document.createElement(this.TEAM_TAG[k]);
					newTag.className = this.TEAM_TAG[k];
					target.appendChild(newTag);
				}
				if(new_tag_name[j].isCanvas)
				{
					newTag = document.createElement("canvas");
					target.appendChild(newTag);
				}
			}
			target = document.getElementById("player");
			target.innerHTML = target.innerHTML + "<hr>";
		}
	}

	InitTimeLineSlideBar()
	{
		var target = document.getElementById("slidebar");
		var max = this.JSON_DATA_TIMELINE.frames.length;
		var self = this;
		target.innerHTML = "<input type='range' id='frame_slidebar' min='0' max='"+ max +"' step='1' value='" + max + "'><span id ='frame'></span>";
		$("#frame_slidebar").change(self, self.ChangeFrame);
	}

	////////////////////////////////////////////////////////////////////////////////////
	
	GetTeamData(data)
	{
		var set_data = [];

		for( var i = 0 ; i < 2 ; ++i )
		{
			set_data[i] = {};
			set_data[i] = this.SetTeamDataCommon(data.teams[i]);
			set_data[i].player = [];
			set_data[i].player = this.GetPlayerData(data, set_data[i].teamId);

			set_data[i].kill = 0;
			set_data[i].gold = 0;
			
			for( var j = 0 ; j < set_data[i].player.length ; ++j )
			{
				set_data[i].kill += set_data[i].player[j].kill;
				set_data[i].gold += set_data[i].player[j].gold;
			}

			var tag = set_data[i].player[0].name;
			var index = tag.search(" ");
			tag = tag.substr(0, index);

			set_data[i].team_name = tag;
		}

		return set_data;
	}

	SetTeamDataCommon(data)
	{
		var set_data = {};

		set_data.tower = data.towerKills;
		set_data.dragon = data.dragonKills;
		set_data.baron = data.baronKills;
		set_data.rift_herald = data.riftHeraldKills;
		set_data.inhibitor = data.inhibitorKills;
		set_data.ban = data.bans;
		set_data.win = data.win === "Win" ? true : false;
		set_data.teamId = data.teamId;

		return set_data;
	}

	GetPlayerData(data, teamId)
	{
		var set_data = [];

		for( var i = 0, index = 0 ; i < data.participants.length ; ++i)
		{
			if( teamId == data.participants[i].teamId )
			{
				set_data[index] = {};
				set_data[index].participantId = data.participants[i].participantId;
				set_data[index].championId = data.participants[i].championId;

				set_data[index].spell = [];
				set_data[index].spell[0] = data.participants[i].spell1Id;
				set_data[index].spell[1] = data.participants[i].spell2Id;

				set_data[index].lv = data.participants[i].stats.champLevel;

				set_data[index].kill = data.participants[i].stats.kills;
				set_data[index].assiste = data.participants[i].stats.assists;
				set_data[index].death = data.participants[i].stats.deaths;
				set_data[index].gold = data.participants[i].stats.goldEarned;
				set_data[index].cs = data.participants[i].stats.totalMinionsKilled;
				
				set_data[index].items = [];
				set_data[index].items[0] = data.participants[i].stats.item0;
				set_data[index].items[1] = data.participants[i].stats.item1;
				set_data[index].items[2] = data.participants[i].stats.item2;
				set_data[index].items[3] = data.participants[i].stats.item3;
				set_data[index].items[4] = data.participants[i].stats.item4;
				set_data[index].items[5] = data.participants[i].stats.item5;
				set_data[index].trinket = data.participants[i].stats.item6;

				set_data[index].lane = data.participants[i].timeline.lane;
				set_data[index].sub_lane = data.participants[i].timeline.role;

				for( var j = 0 ; j < data.participantIdentities.length ; ++j )
				{
					if( set_data[index].participantId == data.participantIdentities[j].participantId )
					{
						set_data[index].name = data.participantIdentities[j].player.summonerName;
						break;
					}
				}

				set_data[index].mastery = [];
				for( var j = 0 ; j < data.participants[i].masteries.length ; ++j )
					set_data[index].mastery[j] = data.participants[i].masteries[j].masteryId;
				
				set_data[index].turretsKill = data.participants[i].stats.turretKills || 0; // 破壊タレット数
				set_data[index].buyVisionWard = data.participants[i].stats.visionWardsBoughtInGame || 0;
				set_data[index].wardKill = data.participants[i].stats.wardsKilled || 0;
				set_data[index].wardPlace = data.participants[i].stats.wardsPlaced || 0;

				set_data[index].dragonKill = 0;
				set_data[index].riftheraldKill = 0;
				set_data[index].baronKill = 0;
				set_data[index].inhibitorKill = 0;
				// 与えたダメージ
				set_data[index].physicalDamageDealtToChampions = data.participants[i].stats.physicalDamageDealtToChampions || 0; // 与えたメージ量(物理)
				set_data[index].physicalDamageDealtPlayer = data.participants[i].stats.physicalDamageDealtPlayer || 0;
				set_data[index].magicDamageDealtToChampions = data.participants[i].stats.magicDamageDealtToChampions || 0; // 与えたメージ量(魔法)
				set_data[index].magicDamageDealtPlayer = data.participants[i].stats.magicDamageDealtPlayer || 0;
				set_data[index].trueDamageDealtToChampions = data.participants[i].stats.trueDamageDealtToChampions || 0; // 与えたメージ量(確定ダメージ)
				set_data[index].trueDamageDealtToPlayer = data.participants[i].stats.trueDamageDealtPlayer || 0;
				set_data[index].totalTimeCrowdControlDealt = data.participants[i].stats.totalTimeCrowdControlDealt || 0;
				// set_data[index].largestCriticalStrike = data.participants[i].stats.largestCriticalStrike || 0; // 最大クリティカルダメージ
				
				set_data[index].totalDamageDealt = data.participants[i].stats.totalDamageDealt || 0; // 与えたダメージ量(全ダメージ)
				set_data[index].totalDamageDealtToBuildings = data.participants[i].stats.totalDamageDealtToBuildings || 0;
				set_data[index].totalDamageDealtToChampions = data.participants[i].stats.totalDamageDealtToChampions || 0;
				// 受けたダメージ
				set_data[index].physicalDamageTaken = data.participants[i].stats.physicalDamageTaken || 0;
				set_data[index].magicDamageTaken = data.participants[i].stats.magicDamageTaken || 0;
				set_data[index].trueDamageTaken = data.participants[i].stats.trueDamageTaken || 0;
				set_data[index].totalDamageTaken = data.participants[i].stats.totalDamageTaken || 0;
				// 回復
				set_data[index].totalHeal = data.participants[i].stats.totalHeal || 0; // 合計回復量
				set_data[index].totalUnitsHealed = data.participants[i].stats.totalUnitsHealed || 0; // ユニット回復量

				index++;
				continue;
			}
		}

		return set_data;
	}

	SetTimiLineFrameData(detailData)
	{
		this.TIMELINE_WORK_DATA.frame = [];

		for( var i = 0 ; i < this.JSON_DATA_TIMELINE.frames.length ; ++i )
		{
			this.TIMELINE_WORK_DATA.frame[i] = {};
			this.TIMELINE_WORK_DATA.frame[i].player = {};
			this.TIMELINE_WORK_DATA.frame[i].team = [ {}, {} ];

			for( var j = 0 ; j < this.TIMELINE_WORK_DATA.frame[i].team.length ; ++j )
			{
				this.TIMELINE_WORK_DATA.frame[i].team[j].gold = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].cs = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].kill = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].death = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].assiste = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].dragonKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].riftheraldKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].baronKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].turretsKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].buyVisionWard = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].wardKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].wardPlace = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].inhibitorKill = 0;
			}

			for( var j in this.JSON_DATA_TIMELINE.frames[i].participantFrames )
			{
				this.TIMELINE_WORK_DATA.frame[i].player[j] = {};
				this.TIMELINE_WORK_DATA.frame[i].player[j].participantId = this.JSON_DATA_TIMELINE.frames[i].participantFrames[j].participantId;
				this.TIMELINE_WORK_DATA.frame[i].player[j].xp = this.JSON_DATA_TIMELINE.frames[i].participantFrames[j].xp;
				this.TIMELINE_WORK_DATA.frame[i].player[j].gold = this.JSON_DATA_TIMELINE.frames[i].participantFrames[j].totalGold;
				this.TIMELINE_WORK_DATA.frame[i].player[j].lv = this.JSON_DATA_TIMELINE.frames[i].participantFrames[j].level;
				this.TIMELINE_WORK_DATA.frame[i].player[j].jungleMinionKill = this.JSON_DATA_TIMELINE.frames[i].participantFrames[j].jungleMinionsKilled;
				this.TIMELINE_WORK_DATA.frame[i].player[j].minionKill = this.JSON_DATA_TIMELINE.frames[i].participantFrames[j].minionsKilled;
				this.TIMELINE_WORK_DATA.frame[i].player[j].cs = this.TIMELINE_WORK_DATA.frame[i].player[j].jungleMinionKill + this.TIMELINE_WORK_DATA.frame[i].player[j].minionKill;
				this.TIMELINE_WORK_DATA.frame[i].player[j].kill = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].death = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].assiste = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].dragonKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].riftheraldKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].baronKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].turretsKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].buyVisionWard = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].wardKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].wardPlace = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].inhibitorKill = 0;
			}
		}

		this.TIMELINE_WORK_DATA.frame[this.JSON_DATA_TIMELINE.frames.length] = {};
		this.TIMELINE_WORK_DATA.frame[this.JSON_DATA_TIMELINE.frames.length].player = [];

		for( var j = 0, index = 1 ; j < detailData.teams.length ; ++j )
		{
			for( var k = 0 ; k < detailData.teams[j].player.length ; ++k, ++index )
			{
				var set_index = detailData.teams[j].player[k].participantId;
				set_index = index;
				this.TIMELINE_WORK_DATA.frame[this.JSON_DATA_TIMELINE.frames.length].player[set_index] = detailData.teams[j].player[k];
			}
		}

		this.TIMELINE_WORK_DATA.frame[this.JSON_DATA_TIMELINE.frames.length].team = $.extend(true, {}, detailData.teams);
		delete this.TIMELINE_WORK_DATA.frame[this.JSON_DATA_TIMELINE.frames.length].team["player"];

		for( var i = 0 ; i < this.JSON_DATA_TIMELINE.frames.length ; ++i )
		{
			for( var j = 0 ; j < this.JSON_DATA_TIMELINE.frames[i].events.length ; ++j )
			{
				var isEnd = i == (this.JSON_DATA_TIMELINE.frames.length-1);
				var set_work_frame = this.TIMELINE_WORK_DATA.frame[i+1];

				switch(this.JSON_DATA_TIMELINE.frames[i].events[j].type)
				{
					case "CHAMPION_KILL":
						if(isEnd)
							break;
						
						var killerId = this.JSON_DATA_TIMELINE.frames[i].events[j].killerId;
						var deathId = this.JSON_DATA_TIMELINE.frames[i].events[j].victimId;
						var assisteId = this.JSON_DATA_TIMELINE.frames[i].events[j].assistingParticipantIds;
						
						if(killerId != 0)
							set_work_frame.player[killerId].kill++;
						
						set_work_frame.player[deathId].death++;

						for( var k = 0 ; k < assisteId.length ; ++k )
							set_work_frame.player[assisteId[k]].assiste++;

						for( var k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
						{
							if(killerId != 0)
								this.TIMELINE_WORK_DATA.frame[k].player[killerId].kill++;
							
							this.TIMELINE_WORK_DATA.frame[k].player[deathId].death++;
							
							for( var l = 0 ; l < assisteId.length ; ++l )
								this.TIMELINE_WORK_DATA.frame[k].player[assisteId[l]].assiste++;
						}
						break;
					case "ELITE_MONSTER_KILL" :
						var killerId = this.JSON_DATA_TIMELINE.frames[i].events[j].killerId;

						switch(this.JSON_DATA_TIMELINE.frames[i].events[j].monsterType)
						{
							case "DRAGON" :
								if(killerId != 0)
									set_work_frame.player[killerId].dragonKill++;
								
								for( var k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
								{
									if(killerId != 0)
										this.TIMELINE_WORK_DATA.frame[k].player[killerId].dragonKill++;
								}
								break;
							case "RIFTHERALD" :
								if(killerId != 0)
									set_work_frame.player[killerId].riftherakdKill++;
								
								for( var k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
								{
									if(killerId != 0)
										this.TIMELINE_WORK_DATA.frame[k].player[killerId].riftherakdKill++;
								}
								break;
							case "BARON_NASHOR" :
								if(killerId != 0)
									set_work_frame.player[killerId].baronKill++;
								
								for( var k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
								{
									if(killerId != 0)
										this.TIMELINE_WORK_DATA.frame[k].player[killerId].baronKill++;
								}
								break;
							default :
								console.log("Type : " + this.JSON_DATA_TIMELINE.frames[i].events[j].monsterType);
								break;
						}
						break;
					case "BUILDING_KILL":
						var killerId = this.JSON_DATA_TIMELINE.frames[i].events[j].killerId;

						switch(this.JSON_DATA_TIMELINE.frames[i].events[j].towerType)
						{
							case "NEXUS_TURRET" :
							case "INNER_TURRET" :
							case "BASE_TURRET" :
							case "OUTER_TURRET" :
								if(killerId != 0)
									set_work_frame.player[killerId].turretsKill++;
								
								for( var k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
								{
									if(killerId != 0)
										this.TIMELINE_WORK_DATA.frame[k].player[killerId].turretsKill++;
								}
								break;
							case "UNDEFINED_TURRET" :
								if(killerId != 0)
									set_work_frame.player[killerId].inhibitorKill++;
								
								for( var k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
								{
									if(killerId != 0)
										this.TIMELINE_WORK_DATA.frame[k].player[killerId].inhibitorKill++;
								}
								break;
							default:
								console.log(this.JSON_DATA_TIMELINE.frames[i].events[j].towerType);
								break;
						}
						break;
/*
					case "WARD_PLACED":
						var setId = this.JSON_DATA_TIMELINE.frames[i].events[j].creatorId;
						if(setId ==1)
						{
//						console.log(i +" - " + j);
//						console.log("wardPlace : " + set_work_frame.player[setId].wardPlace);
//						console.log(this.JSON_DATA_TIMELINE.frames[i].events[j]);
						}

						set_work_frame.player[setId].wardPlace++;
						for( var k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
							this.TIMELINE_WORK_DATA.frame[k].player[setId].wardPlace++;
						break;
					case "WARD_KILL":
						var killerId = this.JSON_DATA_TIMELINE.frames[i].events[j].killerId;

						set_work_frame.player[killerId].wardKill++;
						for( var k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
							this.TIMELINE_WORK_DATA.frame[k].player[killerId].wardKill++;
						break;
					case "ITEM_PURCHASED":
						var setId = this.JSON_DATA_TIMELINE.frames[i].events[j].participantId;

						if( $.inArray( this.JSON_DATA_TIMELINE.frames[i].events[j].itemId, this.VISION_WARD_ID ) >= 0 )
						{
							set_work_frame.player[setId].buyVisionWard++;
							for( var k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
								this.TIMELINE_WORK_DATA.frame[k].player[setId].buyVisionWard++;
						}
						break;
*/
					case "ITEM_SOLD":
						var setId = this.JSON_DATA_TIMELINE.frames[i].events[j].participantId;

						if( $.inArray( this.JSON_DATA_TIMELINE.frames[i].events[j].itemId, this.VISION_WARD_ID ) >= 0 )
						{
							set_work_frame.player[setId].buyVisionWard--;
							for( var k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
								this.TIMELINE_WORK_DATA.frame[k].player[setId].buyVisionWard--;
						}
						break;
					case "ITEM_UNDO":
						var setId = this.JSON_DATA_TIMELINE.frames[i].events[j].participantId;
						var isAddd = $.inArray( this.JSON_DATA_TIMELINE.frames[i].events[j].afterId, this.VISION_WARD_ID ) >= 0;
						var isRem = $.inArray( this.JSON_DATA_TIMELINE.frames[i].events[j].beforeId, this.VISION_WARD_ID ) >= 0;

						if( isAddd ^ isRem )
						{
							isAddd ? set_work_frame.player[setId].buyVisionWard++ : set_work_frame.player[setId].buyVisionWard--;

							for( var k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
								isAddd ? this.TIMELINE_WORK_DATA.frame[k].player[setId].buyVisionWard++ : this.TIMELINE_WORK_DATA.frame[k].player[setId].buyVisionWard--;
						}
						break;
					default :
//						console.log(this.JSON_DATA_TIMELINE.frames[i].events[j].type + " : " + i + " - " + j);
						break;
				}
			}
		}

		for( var i = 0 ; i < this.JSON_DATA_TIMELINE.frames.length ; ++i )
		{
			for( var j in this.TIMELINE_WORK_DATA.frame[i].player[j] )
			{
				for( var k = 0 ; k < this.JSON_DATA_MATCHDETAIL.teams.length ; ++k )
				{
					for( var l = 0 ; l < this.JSON_DATA_MATCHDETAIL.teams[k].player.length ; ++l )
					{
						if( this.TIMELINE_WORK_DATA.frame[i].player[j].participantId == this.JSON_DATA_MATCHDETAIL.teams[k].player[l].participantId )
						{
							this.TIMELINE_WORK_DATA.frame[i].team[k].gold += this.TIMELINE_WORK_DATA.frame[i].player[j].gold;
							this.TIMELINE_WORK_DATA.frame[i].team[k].cs += this.TIMELINE_WORK_DATA.frame[i].player[j].cs;
							this.TIMELINE_WORK_DATA.frame[i].team[k].kill += this.TIMELINE_WORK_DATA.frame[i].player[j].kill;
							this.TIMELINE_WORK_DATA.frame[i].team[k].death += this.TIMELINE_WORK_DATA.frame[i].player[j].death;
							this.TIMELINE_WORK_DATA.frame[i].team[k].assiste += this.TIMELINE_WORK_DATA.frame[i].player[j].assiste;
							this.TIMELINE_WORK_DATA.frame[i].team[k].dragonKill += this.TIMELINE_WORK_DATA.frame[i].player[j].dragonKill;
							this.TIMELINE_WORK_DATA.frame[i].team[k].riftheraldKill += this.TIMELINE_WORK_DATA.frame[i].player[j].riftheraldKill;
							this.TIMELINE_WORK_DATA.frame[i].team[k].baronKill += this.TIMELINE_WORK_DATA.frame[i].player[j].baronKill;
							this.TIMELINE_WORK_DATA.frame[i].team[k].turretsKill += this.TIMELINE_WORK_DATA.frame[i].player[j].turretsKill;
							this.TIMELINE_WORK_DATA.frame[i].team[k].wardKill += this.TIMELINE_WORK_DATA.frame[i].player[j].wardKill;
							this.TIMELINE_WORK_DATA.frame[i].team[k].wardPlace += this.TIMELINE_WORK_DATA.frame[i].player[j].wardPlace;
							this.TIMELINE_WORK_DATA.frame[i].team[k].inhibitorKill += this.TIMELINE_WORK_DATA.frame[i].player[j].inhibitorKill;
						}
					}
				}
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	
	GetVersion(ver, json)
	{
		var num = json.length;

		while(--num)
		{
			if(ver.indexOf(json[num]) !== -1)
			{
				return json[num];
			}
		}

		num = json.length;
		var str_num = ver.length;

		while(str_num)
		{
			while(--num)
			{
				if(json[num].match(ver))
					return json[num];
			}
			num = json.length;
			str_num--;
			ver = ver.substr(0, str_num);
		}
	}

	GetChampionImgName(id)
	{
		for( var i = 0 ; i < this.JSON_DATA_CHAMP_IMG.length ; ++i )
		{
			if ( id == this.JSON_DATA_CHAMP_IMG[i].id )
				return this.JSON_DATA_CHAMP_IMG[i].image.full;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////

	Show()
	{
		var frame = this.TIMELINE_WORK_DATA.frame.length;
		frame = this.TIMELINE_WORK_DATA.frame.length-1;

		for( var i = 1 ; i <= 5 ; ++i )
		{
			this.ShowChampionImg(i);
			this.ShowName(i);
		}

		$('#frame_slidebar').trigger('change');
	}

	ShowChampionImg(player_index)
	{
		var champ_index;
		var champ_img;
		var champ_name;

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
		{
			for( var j = 0 ; j < this.JSON_DATA_CHAMP_IMG.length ; ++j )
			{
				if(this.JSON_DATA_CHAMP_IMG[j].id == this.JSON_DATA_MATCHDETAIL.teams[i].player[player_index-1].championId)
				{
					champ_index = j;
					break;
				}
			}

			champ_img = this.JSON_DATA_CHAMP_IMG[champ_index].image.full;
			champ_name = this.JSON_DATA_CHAMP_IMG[champ_index].name;

			var tag = "<img src='" + this.CDN_URL + "/" + this.VERSION + "/img/champion/" + champ_img + "' title='" + champ_name +"' class='champion_img'>";
			tag = "";
			$("#player > player"+ player_index +" > champion_img > " + this.TEAM_TAG[i]).html(tag);
		}
	}
	
	ShowName(player_index)
	{
		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > Name > " + this.TEAM_TAG[i]).html(this.JSON_DATA_MATCHDETAIL.teams[i].player[player_index-1].name);
	}

	ShowCS(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].cs,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].cs
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > CS > " + this.TEAM_TAG[i]).html("CS : " + num[i]);
	}

	ShowCSBar(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].cs,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].cs
		];
		
		this.ShowBar($("#player > player"+ player_index +" > CS > canvas")[0], num);
	}

	ShowLv(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].lv,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].lv
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > Lv > " + this.TEAM_TAG[i]).html("Lv : " + num[i]);
	}

	ShowLvBar(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].lv,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].lv
		];
		
		this.ShowBar($("#player > player"+ player_index +" > Lv > canvas")[0], num);
	}

	ShowXp(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].xp,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].xp
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > Xp > " + this.TEAM_TAG[i]).html(isVisible ? "Xp : " + num[i] : "");
	}

	ShowXpBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].xp,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].xp
		];
		
		this.ShowBar($("#player > player"+ player_index +" > Xp > canvas")[0], num, isVisible);
	}

	ShowKill(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].kill,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].kill
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > Kill > " + this.TEAM_TAG[i]).html("Kill : " + num[i]);
	}

	ShowKillBar(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].kill,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].kill
		];
		
		this.ShowBar($("#player > player"+ player_index +" > Kill > canvas")[0], num);
	}

	ShowDeath(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].death,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].death
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > Death > " + this.TEAM_TAG[i]).html("Death : " + num[i]);
	}

	ShowDeathBar(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].death,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].death
		];
		
		this.ShowBar($("#player > player"+ player_index +" > Death > canvas")[0], num);
	}

	ShowAssiste(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].assiste,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].assiste
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > Assiste > " + this.TEAM_TAG[i]).html("Assiste : " + num[i]);
	}

	ShowAssisteBar(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].assiste,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].assiste
		];
		
		this.ShowBar($("#player > player"+ player_index +" > Assiste > canvas")[0], num);
	}

	ShowMinionCS(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].minionKill,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].minionKill
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > MinionCS > " + this.TEAM_TAG[i]).html(isVisible ? "MinionCS : " + num[i] : "");
	}

	ShowMinionCSBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].minionKill,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].minionKill
		];
		
		this.ShowBar($("#player > player"+ player_index +" > MinionCS > canvas")[0], num, isVisible);
	}

	ShowJungleMinionCS(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].jungleMinionKill,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].jungleMinionKill
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > JungleCS > " + this.TEAM_TAG[i]).html(isVisible ? "JungleCS : " + num[i] : "");
	}

	ShowJungleMinionCSBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].jungleMinionKill,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].jungleMinionKill
		];
		
		this.ShowBar($("#player > player"+ player_index +" > JungleCS > canvas")[0], num, isVisible);
	}

	ShowGold(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].gold,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].gold
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > Gold > " + this.TEAM_TAG[i]).html("Gold : " + num[i]);
	}

	ShowGoldBar(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].gold,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].gold
		];
		
		this.ShowBar($("#player > player"+ player_index +" > Gold > canvas")[0], num);
	}

	ShowPhysicalDamageDealtToChampion(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].physicalDamageDealtToChampions,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].physicalDamageDealtToChampions
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > PhysicalDamageDealtToChampion > " + this.TEAM_TAG[i]).html(isVisible ? "PhysicalDamage Dealt <br>to Champion : " + num[i] : "");
	}

	ShowPhysicalDamageDealtToChampionBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].physicalDamageDealtToChampions,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].physicalDamageDealtToChampions
		];
		
		this.ShowBar($("#player > player"+ player_index +" > PhysicalDamageDealtToChampion > canvas")[0], num, isVisible);
	}

	ShowPhysicalDamageDealtToPlayer(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].physicalDamageDealtPlayer,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].physicalDamageDealtPlayer
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > PhysicalDamageDealtToPlayer > " + this.TEAM_TAG[i]).html(isVisible ? "PhysicalDamage Dealt <br>to Player : " + num[i] : "");
	}

	ShowPhysicalDamageDealtToPlayerBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].physicalDamageDealtPlayer,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].physicalDamageDealtPlayer
		];
		
		this.ShowBar($("#player > player"+ player_index +" > PhysicalDamageDealtToPlayer > canvas")[0], num, isVisible);
	}

	ShowMagicDamageDealtToChampion(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].magicDamageDealtToChampions,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].magicDamageDealtToChampions
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > MagicDamageDealtToChampion > " + this.TEAM_TAG[i]).html(isVisible ? "MagicDamage Dealt <br>to Champion : " + num[i] : "");
	}

	ShowMagicDamageDealtToChampionBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].magicDamageDealtToChampions,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].magicDamageDealtToChampions
		];
		
		this.ShowBar($("#player > player"+ player_index +" > MagicDamageDealtToChampion > canvas")[0], num, isVisible);
	}

	ShowMagicDamageDealtToPlayer(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].magicDamageDealtPlayer,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].magicDamageDealtPlayer
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > MagicDamageDealtToPlayer > " + this.TEAM_TAG[i]).html(isVisible ? "MagicDamage Dealt <br>to Player : " + num[i] : "");
	}

	ShowMagicDamageDealtToPlayerBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].magicDamageDealtPlayer,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].magicDamageDealtPlayer
		];
		
		this.ShowBar($("#player > player"+ player_index +" > MagicDamageDealtToPlayer > canvas")[0], num, isVisible);
	}

	ShowTrueDamageDealtToChampion(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].trueDamageDealtToChampions,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].trueDamageDealtToChampions
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TrueDamageDealtToChampion > " + this.TEAM_TAG[i]).html(isVisible ? "TrueDamage Dealt <br>to Champion : " + num[i] : "");
	}

	ShowTrueDamageDealtToChampionBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].trueDamageDealtToChampions,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].trueDamageDealtToChampions
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TrueDamageDealtToChampion > canvas")[0], num, isVisible);
	}

	ShowTrueDamageDealtToPlayer(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].trueDamageDealtToPlayer,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].trueDamageDealtToPlayer
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TrueDamageDealtToPlayer > " + this.TEAM_TAG[i]).html(isVisible ? "TrueDamage Dealt <br>to Player : " + num[i] : "");
	}

	ShowTrueDamageDealtToPlayerBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].trueDamageDealtToPlayer,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].trueDamageDealtToPlayer
		];
		
		this.ShowBar($("#player > player"+ player_index +" > trueDamageDealtToPlayer > canvas")[0], num, isVisible);
	}

	ShowTotalDamageDealt(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalDamageDealt,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalDamageDealt
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TotalDamageDealt > " + this.TEAM_TAG[i]).html(isVisible ? "TotalDamageDealt : " + num[i] : "");
	}

	ShowTotalDamageDealtBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalDamageDealt,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalDamageDealt
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TotalDamageDealt > canvas")[0], num, isVisible);
	}

	ShowTotalDamageDealtToBuilding(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalDamageDealtToBuildings,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalDamageDealtToBuildings
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TotalDamageDealtToBuilding > " + this.TEAM_TAG[i]).html(isVisible ? "TotalDamage Dealt <br>to Building : " + num[i] : "");
	}

	ShowTotalDamageDealtToBuildingBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalDamageDealtToBuildings,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalDamageDealtToBuildings
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TotalDamageDealtToBuilding > canvas")[0], num, isVisible);
	}

	ShowTotalDamageDealtToChampion(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalDamageDealtToChampions,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalDamageDealtToChampions
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TotalDamageDealtToChampion > " + this.TEAM_TAG[i]).html(isVisible ? "TotalDamage Dealt <br>to Champion : " + num[i] : "");
	}

	ShowTotalDamageDealtToChampionBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalDamageDealtToChampions,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalDamageDealtToChampions
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TotalDamageDealtToChampion > canvas")[0], num, isVisible);
	}

	ShowTotalCrawdControlDamageDealt(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalTimeCrowdControlDealt,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalTimeCrowdControlDealt
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TotalCrawdControlDamageDealt > " + this.TEAM_TAG[i]).html(isVisible ? "Total TimeCrowd Control <br>Dealt : " + num[i] : "");
	}

	ShowTotalCrawdControlDamageDealtBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalTimeCrowdControlDealt,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalTimeCrowdControlDealt
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TotalCrawdControlDamageDealt > canvas")[0], num, isVisible);
	}
	
	ShowTotalDamageTaken(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalDamageTaken,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalDamageTaken
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TotalDamageTaken > " + this.TEAM_TAG[i]).html(isVisible ? "TotalDamage Taken : " + num[i] : "");
	}

	ShowTotalDamageTakenBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalDamageTaken,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalDamageTaken
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TotalDamageTaken > canvas")[0], num, isVisible);
	}

	ShowPhysicalDamageTaken(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].physicalDamageTaken,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].physicalDamageTaken
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > PhysicalDamageTaken > " + this.TEAM_TAG[i]).html(isVisible ? "PhysicalDamage Taken : " + num[i] : "");
	}

	ShowPhysicalDamageTakenBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].physicalDamageTaken,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].physicalDamageTaken
		];
		
		this.ShowBar($("#player > player"+ player_index +" > PhysicalDamageTaken > canvas")[0], num, isVisible);
	}
	
	ShowMagicDamageTaken(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].magicDamageTaken,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].magicDamageTaken
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > MagicDamageTaken > " + this.TEAM_TAG[i]).html(isVisible ? "MagicDamage Taken : " + num[i] : "");
	}

	ShowMagicDamageTakenBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].magicDamageTaken,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].magicDamageTaken
		];
		
		this.ShowBar($("#player > player"+ player_index +" > MagicDamageTaken > canvas")[0], num, isVisible);
	}
	
	ShowTrueDamageTaken(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].trueDamageTaken,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].trueDamageTaken
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TrueDamageTaken > " + this.TEAM_TAG[i]).html(isVisible ? "PhysicalDamage Dealt <br>to Champion : " + num[i] : "");
	}

	ShowTrueDamageTakenBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].trueDamageTaken,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].trueDamageTaken
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TrueDamageTaken > canvas")[0], num, isVisible);
	}
	
	ShowTotalHeal(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalHeal,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalHeal
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TotalHeal > " + this.TEAM_TAG[i]).html(isVisible ? "Total Heal <br>to Champion : " + num[i] : "");
	}

	ShowTotalHealBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalHeal,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalHeal
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TotalHeal > canvas")[0], num, isVisible);
	}
	
	ShowTotalHealToUnit(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalUnitsHealed,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalUnitsHealed
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TotalHealToUnit > " + this.TEAM_TAG[i]).html(isVisible ? "Total Unit Heal : " + num[i] : "");
	}

	ShowTotalHealToUnitBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalUnitsHealed,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalUnitsHealed
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TotalHealToUnit > canvas")[0], num, isVisible);
	}

	ShowTowerKill(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].turretsKill,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].turretsKill
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TowerKill > " + this.TEAM_TAG[i]).html("Tower Kill : " + num[i]);
	}

	ShowTowerKillBar(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].turretsKill,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].turretsKill
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TowerKill > canvas")[0], num);
	}

	ShowBuyVisionWard(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].buyVisionWard,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].buyVisionWard
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > BuyVisionWard > " + this.TEAM_TAG[i]).html("Purchased VisionWard : " + num[i]);
	}

	ShowBuyVisionWardBar(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].buyVisionWard,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].buyVisionWard
		];
		
		this.ShowBar($("#player > player"+ player_index +" > BuyVisionWard > canvas")[0], num);
	}

	ShowWardPlace(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardPlace,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardPlace
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > WardPlace > " + this.TEAM_TAG[i]).html(isVisible ? "Ward Place : " + num[i] : "");
	}

	ShowWardPlaceBar(player_index, frame, isVisible)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardPlace,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardPlace
		];
		
		this.ShowBar($("#player > player"+ player_index +" > WardPlace > canvas")[0], num, isVisible);
	}

	ShowWardKill(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardKill,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardKill
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > WardKill > " + this.TEAM_TAG[i]).html("Ward Destroyed : " + num[i]);
	}

	ShowWardKillBar(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardKill,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardKill
		];
		
		this.ShowBar($("#player > player"+ player_index +" > WardKill > canvas")[0], num);
	}

	ShowDragonKill(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].dragonKill,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].dragonKill
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > DragonKill > " + this.TEAM_TAG[i]).html("Dragon Kill : " + num[i]);
	}

	ShowDragonKillBar(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].dragonKill,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].dragonKill
		];
		
		this.ShowBar($("#player > player"+ player_index +" > DragonKill > canvas")[0], num);
	}

	ShowRiftheraldKill(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].riftheraldKill,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].riftheraldKill
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > RiftheraldKill > " + this.TEAM_TAG[i]).html("Riftherald Kill : " + num[i]);
	}

	ShowRiftheraldKillBar(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].riftheraldKill,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].riftheraldKill
		];
		
		this.ShowBar($("#player > player"+ player_index +" > RiftheraldKill > canvas")[0], num);
	}

	ShowBaronKill(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].baronKill,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].baronKill
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > BaronKill > " + this.TEAM_TAG[i]).html("Baron Kill : " + num[i]);
	}

	ShowBaronKillBar(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].baronKill,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].baronKill
		];
		
		this.ShowBar($("#player > player"+ player_index +" > BaronKill > canvas")[0], num);
	}

	ShowInhibitorKill(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].inhibitorKill,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].inhibitorKill
		];

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > InhibitorKill > " + this.TEAM_TAG[i]).html("Inhibitor Kill : " + num[i]);
	}

	ShowInhibitorKillBar(player_index, frame)
	{
		var num = [
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index].inhibitorKill,
					this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].inhibitorKill
		];
		
		this.ShowBar($("#player > player"+ player_index +" > InhibitorKill > canvas")[0], num);
	}

	ShowBar(target, num_array, isVisible = true)
	{
		var num_blue = num_array[0];
		var num_red = num_array[1];
		
		if(num_blue == 0 && num_red == 0)
		{
			num_blue = 1;
			num_red = 1;
		}

		var per = num_blue / ( num_blue + num_red );

		var ctx = target.getContext('2d');

		if( isVisible )
		{
			target.width = window.innerWidth-30;
			target.height = 20;

			ctx.save();

			ctx.font = "16px Arial";
			// ctx.font = "italic bold 18px 'ＭＳ Ｐゴシック'";
			ctx.textAlign = 'center';

			ctx.beginPath();
			ctx.fillStyle = 'rgb(0, 0, 255)'; // blue
			var blue_width = target.width * per;
			ctx.fillRect(0, 0, blue_width, target.height);

			ctx.beginPath();
			ctx.fillStyle = 'rgb(255, 0, 0)'; // red
			var red_width = target.width - blue_width;
			ctx.fillRect(blue_width, 0, red_width, target.height);

			ctx.beginPath();
			ctx.fillStyle = 'rgb(255, 255, 255)';
			var blue_par = this.FloatFormat(per * 100, 1);
			var text_b = blue_par + "%";
			ctx.beginPath();
			ctx.fillText(text_b, Math.floor(blue_width/2), 16, blue_width);
			var red_par = this.FloatFormat(100 - blue_par, 1);
			var text_r = red_par + "%";
			ctx.fillText(text_r, Math.floor(blue_width + (red_width/2)), 16, red_width);

			ctx.restore();
		}
		else
		{
			target.width = 1;
			target.height = 1;
			
			ctx.save();
			ctx.restore();
		}
	}

	////////////////////////////////////////////////////////////////////////////////////

	FloatFormat( number, n )
	{
		var _pow = Math.pow( 10 , n ) ;

		return Math.round( number * _pow ) / _pow;
	}

	////////////////////////////////////////////////////////////////////////////////////

	ChangeFrame(handle)
	{
		var self = handle.data;
		var frame = $("#frame_slidebar").val();
		var isEnd = false;

		if( frame >= self.JSON_DATA_TIMELINE.frames.length )
			isEnd = true;
		
		document.getElementById("frame").innerHTML = isEnd ? "End Game" : frame + ":00";

		for( var i = 1 ; i <= 5 ; ++i )
		{
			self.ShowLv(i, frame);
			self.ShowLvBar(i, frame);
			self.ShowXp(i, frame, !isEnd);
			self.ShowXpBar(i, frame, !isEnd);
			self.ShowGold(i, frame);
			self.ShowGoldBar(i, frame);
			self.ShowCS(i, frame);
			self.ShowCSBar(i, frame);
			self.ShowMinionCS(i, frame, !isEnd);
			self.ShowMinionCSBar(i, frame, !isEnd);
			self.ShowJungleMinionCS(i, frame, !isEnd);
			self.ShowJungleMinionCSBar(i, frame, !isEnd);
			self.ShowKill(i, frame);
			self.ShowKillBar(i, frame);
			self.ShowDeath(i, frame);
			self.ShowDeathBar(i, frame);
			self.ShowAssiste(i, frame);
			self.ShowAssisteBar(i, frame);

			self.ShowPhysicalDamageDealtToChampion(i, frame, isEnd);
			self.ShowPhysicalDamageDealtToChampionBar(i, frame, isEnd);
			self.ShowPhysicalDamageDealtToPlayer(i, frame, isEnd);
			self.ShowPhysicalDamageDealtToPlayerBar(i, frame, isEnd);
			self.ShowMagicDamageDealtToChampion(i, frame, isEnd);
			self.ShowMagicDamageDealtToChampionBar(i, frame, isEnd);
			self.ShowMagicDamageDealtToPlayer(i, frame, isEnd);
			self.ShowMagicDamageDealtToPlayerBar(i, frame, isEnd);
			self.ShowTrueDamageDealtToChampion(i, frame, isEnd);
			self.ShowTrueDamageDealtToChampionBar(i, frame, isEnd);
			self.ShowTrueDamageDealtToPlayer(i, frame, isEnd);
			self.ShowTrueDamageDealtToPlayerBar(i, frame, isEnd);
			self.ShowTotalDamageDealt(i, frame, isEnd);
			self.ShowTotalDamageDealtBar(i, frame, isEnd);
			self.ShowTotalDamageDealtToBuilding(i, frame, isEnd);
			self.ShowTotalDamageDealtToBuildingBar(i, frame, isEnd);
			self.ShowTotalDamageDealtToChampion(i, frame, isEnd);
			self.ShowTotalDamageDealtToChampionBar(i, frame, isEnd);
			self.ShowTotalCrawdControlDamageDealt(i, frame, isEnd);
			self.ShowTotalCrawdControlDamageDealtBar(i, frame, isEnd);
			self.ShowPhysicalDamageTaken(i, frame, isEnd);
			self.ShowPhysicalDamageTakenBar(i, frame, isEnd);
			self.ShowMagicDamageTaken(i, frame, isEnd);
			self.ShowMagicDamageTakenBar(i, frame, isEnd);
			self.ShowTrueDamageTaken(i, frame, isEnd);
			self.ShowTrueDamageTakenBar(i, frame, isEnd);
			self.ShowTotalDamageTaken(i, frame, isEnd);
			self.ShowTotalDamageTakenBar(i, frame, isEnd);
			self.ShowTotalHeal(i, frame, isEnd);
			self.ShowTotalHealBar(i, frame, isEnd);
			self.ShowTotalHealToUnit(i, frame, isEnd);
			self.ShowTotalHealToUnitBar(i, frame, isEnd);
			
			self.ShowTowerKill(i, frame);
			self.ShowTowerKillBar(i, frame);
			self.ShowBuyVisionWard(i, frame);
			self.ShowBuyVisionWardBar(i, frame);
			self.ShowWardPlace(i, frame, isEnd);
			self.ShowWardPlaceBar(i, frame, isEnd);
			self.ShowWardKill(i, frame);
			self.ShowWardKillBar(i, frame);
			self.ShowDragonKill(i, frame);
			self.ShowDragonKillBar(i, frame);
			self.ShowRiftheraldKill(i, frame);
			self.ShowRiftheraldKillBar(i, frame);
			self.ShowBaronKill(i, frame);
			self.ShowBaronKillBar(i, frame);
			self.ShowInhibitorKill(i, frame);
			self.ShowInhibitorKillBar(i, frame);
		}
	}
}

var timeline = new TimeLine();
timeline.Init(location.href);