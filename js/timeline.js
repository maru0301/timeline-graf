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
		this.CDN_URL = "https://ddragon.leagueoflegends.com/cdn";

		this.JSON_DATA_MATCHDETAIL = {};
		this.JSON_DATA_TIMELINE = {};
		this.JSON_DATA_CHAMP_IMG = new Array();
		this.JSON_DATA_ITEM_IMG = new Array();

		this.TEAM_TAG = [ "blue", "red" ];

		this.TIMELINE_WORK_DATA = {};
		this.VISION_WARD_ID = new Array();

		this.frame = 0;
		this.isShow = false;
		this.isEndFrame = false;

		this.REGION_CODE = [ "BR1", "EUN1", "EUW1", "JP1", "KR", "LA1", "LA2", "NA1", "OC1", "TR1", "RU", "PBE1" ];
		this.TEAM_NAME = [ "ブルー", "レッド" ];
		this.isLiveSever = false;
	}

	GetMatchData(data)
	{
		let set_data = {};

		set_data.gameVer = data.gameVersion;
		set_data.gameMode = data.gameMode;
		set_data.gameType = data.gameType;
		
		return set_data;
	}

	Init(href_url)
	{
		var self = this;

		let data = href_url.split("?")[1];
		let text = data.split("=")[1];
		let url = decodeURIComponent(text);

		let index = url.search("&");
		let gameRealm = url.substr(0, index);
		url = url.substr(index+1);
		index = url.search("&");
		let gameId = url.substr(0, index);
		url = url.substr(index+1);
		let gameHash = url;

		// LiveServer
		this.CheckLiveServer(gameRealm);

		const request = [
			{ error_id: this.ERROR_ID_MATCH_DETAILS_GET_ERROR,	url: './php/main.php', data: { func:"GetMatchDetails", realm:gameRealm, id:gameId, hash:gameHash },  },
			{ error_id: this.ERROR_ID_MATCH_TIMELINE_GET_ERROR,	url: './php/main.php', data: { func:"GetMatchTimeline", realm:gameRealm, id:gameId, hash:gameHash },  },
			{ error_id: this.ERROR_ID_VERSION_GET_ERROR,		url: './php/main.php', data: { func:"GetVersion" },  },
			{ error_id: this.ERROR_ID_CHAMPION_IMG_GET_ERROR,	url: './php/main.php', data: { func:"GetChampions" },  },
		];

		let jqXHRList = [];

		for( let i = 0, max = request.length ; i < max ; ++i )
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
			let json = [];
			let statuses = [];
			let jqXHRResultList = [];
			
			for( let i = 0, max = arguments.length ; i < max ; ++i )
			{
				const result = arguments[i];
				json.push(result[0]);
				statuses.push(result[1]);
				jqXHRResultList.push(result[3]);
			}

			const matchDetailJson = json[0];
			self.JSON_DATA_TIMELINE = json[1];
			const versionJson = json[2];
			const champImgJson = json[3];

			let championImgData = new Array();

			for(let key in champImgJson.data)
				self.JSON_DATA_CHAMP_IMG.push(champImgJson.data[key]);

			let matchDetailData = { game:{}, teams:[] };
			matchDetailData.game = self.GetMatchData(matchDetailJson);
			matchDetailData.teams = self.GetTeamData(matchDetailJson);
			
			let isSort = false;

			switch(matchDetailData.game.gameMode)
			{
				case "CLASSIC":
					if(matchDetailData.game.gameType == "MATCHED_GAME")
						isSort = true;
					break;
			}

			if(isSort)
			{
				const lane = ["TOP","JUNGLE","MIDDLE","BOTTOM", "BOTTOM"];
				const sub = ["DUO_CARRY", "DUO_SUPPORT"];
				let work = [];

				for( let i = 0 ; i < matchDetailData.teams.length ; ++i )
				{
					work[i] = [];
					for( let j = 0, sub_index = 0 ; j < lane.length ; ++j )
					{
						for( let k = 0 ; k < matchDetailData.teams[i].player.length ; ++k )
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

				// レーン情報が可笑しいjsonデータの場合は空いてるレーンに突っ込む
				for( let i = 0 ; i < work.length ; ++i )
				{
					for( let j = 0 ; j < matchDetailData.teams[i].player.length ; ++j )
					{
						if(!work[i][j])
						{
							for( let k = 0 ; k < matchDetailData.teams[i].player.length ; ++k )
							{
								let isSet = false;
								for( let l = 0 ; l < work[i].length ; ++l )
								{

									if( work[i][l] )
									{
										if(matchDetailData.teams[i].player[k].participantId == work[i][l].participantId )
										{
											isSet = true;
											break;
										}
									}
								}

								if(!isSet)
								{
									work[i][j] = matchDetailData.teams[i].player[k];
									break;
								}
							}
						}
					}
				}

				for( let i = 0 ; i < work.length ; ++i )
				{
					matchDetailData.teams[i].player = work[i].concat();
				}
			}
			
			self.JSON_DATA_MATCHDETAIL = matchDetailData;
			
			for( let i in self.JSON_DATA_TIMELINE.frames )
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

			self.VERSION = self.GetVersion(self.JSON_DATA_MATCHDETAIL.game.gameVer, versionJson);
			self.InitDataJson(self.JSON_DATA_MATCHDETAIL, self.JSON_DATA_TIMELINE);
		});

		$.when.apply(null, jqXHRList).fail(function ()
		{
			console.log("Fail : Main");
			console.log(jqXHRList);

			for( let i = 0 ; i < jqXHRList.length ; ++i )
			{
				if( jqXHRList[i].statusText === "error" )
				{
					console.log(request[i].error_id);
				}
			}
		});
	}

	InitDataJson(matchDetailData, matchTimelineJson)
	{
		let self = this;
		$.ajax({
			url: './php/main.php',
			data: { func:"GetItem" }
		  }).done(function(json)
		  {
			const itemImgJson = json;

			let itemImgImgData = new Array();
			
			self.JSON_DATA_CHAMP_IMG.sort(function(a, b)
			{
					if(a.key < b.key) return -1;
					if(a.key > b.key) return 1;
					if(a.key == b.key) return 0;
			});

			// ソート
			for(let key in itemImgJson.data)
				itemImgImgData[key] = itemImgJson.data[key];
			
			let isSet = false;
			for(let key in itemImgImgData )
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

			self.SetTimiLineFrameData(self.JSON_DATA_MATCHDETAIL);

			let id = [];

			for(let i = 0 ; i < self.JSON_DATA_MATCHDETAIL.teams.length ; ++i)
			{
				for(let j = 0 ; j < self.JSON_DATA_MATCHDETAIL.teams[i].player.length ; ++j)
				{
					id.push(self.JSON_DATA_MATCHDETAIL.teams[i].player[j].participantId);
				}
			}

			let data = new Array();
			for(let i = 0 ; i < self.TIMELINE_WORK_DATA.frame.length ; ++i)
			{
				for(let j = 0 ; j < id.length ; ++j)
				{
					for(let k in self.TIMELINE_WORK_DATA.frame[i].player)
					{
						if( id[j] == self.TIMELINE_WORK_DATA.frame[i].player[k].participantId )
							data[j+1] = self.TIMELINE_WORK_DATA.frame[i].player[k];
					}
				}
				self.TIMELINE_WORK_DATA.frame[i].player = data;
				data = [];
			}

			self.InitTeam();
			self.InitPlayer();
			self.InitTimeLineSlideBar();
			self.Show();

		  }).fail(function()
		  {
			  console.log("error");
		  });
	}
	
	InitTeam()
	{
		let newTag, target;

		const new_tag_name = [
			{	name:"WinLose", 		isCanvas:false	},
			{	name:"Name", 			isCanvas:false	},
			{	name:"Kill",			isCanvas:true	},
			{	name:"Death",			isCanvas:true	},
			{	name:"Assist",			isCanvas:true	},
			{	name:"Gold",			isCanvas:true	},
			{	name:"CS",				isCanvas:true	},
			{	name:"MinionCS",		isCanvas:true	},
			{	name:"JungleCS",		isCanvas:true	},
			{	name:"JungleCSEnemy",	isCanvas:true	},
			{	name:"JungleCSTeam",	isCanvas:true	},
			{	name:"DragonKill",		isCanvas:true	},
			{	name:"RiftHeraldKill",	isCanvas:true	},
			{	name:"BaronKill",		isCanvas:true	},
			{	name:"TowerKill",		isCanvas:true	},
			{	name:"InhibitorKill",	isCanvas:true	},
			{	name:"WardPlace",		isCanvas:true	},
			{	name:"WardKill",		isCanvas:true	},
			{	name:"BuyVisionWard",	isCanvas:true	},
		];

		for( let i = 0 ; i < new_tag_name.length ; ++i )
		{
			target = document.getElementById("team");
			newTag = document.createElement(new_tag_name[i].name);
			target.appendChild(newTag);
			target = newTag;
			
			for( let j = 0 ; j < this.TEAM_TAG.length ; ++j )
			{
				newTag = document.createElement(this.TEAM_TAG[j]);
				newTag.className = this.TEAM_TAG[j];
				target.appendChild(newTag);
			}

			if(new_tag_name[i].isCanvas)
			{
				newTag = document.createElement("canvas");
				target.appendChild(newTag);
			}
		}
	}

	InitPlayer()
	{
		let newTag, target;
		let player_target;

		const new_tag_name = [
			{	name:"champion_img",		isCanvas:false	},
			{	name:"Name", 				isCanvas:false	},
			{	name:"Lv",					isCanvas:true	},
			{	name:"Xp",					isCanvas:true	},
			{	name:"Gold",				isCanvas:true	},
			{	name:"CS",					isCanvas:true	},
			{	name:"MinionCS",			isCanvas:true	},
			{	name:"JungleCS",			isCanvas:true	},
			{	name:"JungleCSEnemy",		isCanvas:true	},
			{	name:"JungleCSTeam",		isCanvas:true	},
			{	name:"DragonKill",			isCanvas:true	},
			{	name:"RiftHeraldKill",		isCanvas:true	},
			{	name:"BaronKill",			isCanvas:true	},
			{	name:"TowerKill",			isCanvas:true	},
			{	name:"InhibitorKill",		isCanvas:true	},
			{	name:"WardPlace",			isCanvas:true	},
			{	name:"WardPlaceWard",		isCanvas:true	},
			{	name:"WardPlaceVision",		isCanvas:true	},
			{	name:"WardPlaceTrinket",	isCanvas:true	},
			{	name:"WardKill",			isCanvas:true	},
			{	name:"WardKillWard",		isCanvas:true	},
			{	name:"WardKillVision",		isCanvas:true	},
			{	name:"WardKillTrinket",		isCanvas:true	},
			{	name:"BuyVisionWard",		isCanvas:true	},
			{	name:"Kill",				isCanvas:true	},
			{	name:"Death",				isCanvas:true	},
			{	name:"Assist",				isCanvas:true	},
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
		
		for( let i = 1 ; i <= 5 ; ++i )
		{
			target = document.getElementById("player");
			newTag = document.createElement("player"+i);
			target.appendChild(newTag);
			player_target = newTag;
			for( let j = 0 ; j < new_tag_name.length ; ++j )
			{
				newTag = document.createElement(new_tag_name[j].name);
				player_target.appendChild(newTag);
				target = newTag;

				for( let k = 0 ; k < this.TEAM_TAG.length ; ++k )
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
		let target = document.getElementById("slidebar");
		const max = this.JSON_DATA_TIMELINE.frames.length;
		let self = this;
		target.innerHTML = "<span id ='frame'></span><br><input type='range' id='frame_slidebar' min='0' max='"+ max +"' step='1' value='" + max + "'>";
		$("#frame_slidebar").change(self, self.ChangeFrame);
	}

	////////////////////////////////////////////////////////////////////////////////////
	
	GetTeamData(data)
	{
		let set_data = [];

		for( let i = 0 ; i < data.teams.length ; ++i )
		{
			set_data[i] = {};
			set_data[i] = this.SetTeamDataCommon(data.teams[i]);
			set_data[i].player = [];
			set_data[i].player = this.GetPlayerData(data, set_data[i].teamId);

			set_data[i].kill = 0;
			set_data[i].death = 0;
			set_data[i].assist = 0;
			set_data[i].gold = 0;
			set_data[i].cs = 0;
			set_data[i].jungleMinionKill = 0;
			set_data[i].neutralMinionsKilledEnemyJungle = 0;
			set_data[i].neutralMinionsKilledTeamJungle = 0;
			set_data[i].minionKill = 0;
			set_data[i].wardPlace = 0;
			set_data[i].wardPlaceWard = 0;
			set_data[i].wardPlaceVision = 0;
			set_data[i].wardPlaceTrinket = 0;
			set_data[i].wardKill = 0;
			set_data[i].wardKillWard = 0;
			set_data[i].wardKillVision = 0;
			set_data[i].wardKillTrinket = 0;
			set_data[i].buyVisionWard = 0;
			
			for( let j = 0 ; j < set_data[i].player.length ; ++j )
			{
				set_data[i].kill += set_data[i].player[j].kill;
				set_data[i].death += set_data[i].player[j].death;
				set_data[i].assist += set_data[i].player[j].assist;
				set_data[i].gold += set_data[i].player[j].gold;
				set_data[i].cs += set_data[i].player[j].cs;
				set_data[i].jungleMinionKill += set_data[i].player[j].jungleMinionKill;
				set_data[i].neutralMinionsKilledEnemyJungle += set_data[i].player[j].neutralMinionsKilledEnemyJungle;
				set_data[i].neutralMinionsKilledTeamJungle += set_data[i].player[j].neutralMinionsKilledTeamJungle;
				set_data[i].minionKill += set_data[i].player[j].minionKill;
				set_data[i].wardPlace += set_data[i].player[j].wardPlace;
				set_data[i].wardKill += set_data[i].player[j].wardKill;
				set_data[i].buyVisionWard += set_data[i].player[j].buyVisionWard;
			}

			let tag = set_data[i].player[0].name;
			const index = tag.search(" ");
			tag = tag.substr(0, index);

			if( this.isLiveSever )
				set_data[i].team_name = this.TEAM_NAME[i];
			else
				set_data[i].team_name = tag;
		}

		return set_data;
	}

	SetTeamDataCommon(data)
	{
		let set_data = {};

		set_data.turretsKill = data.towerKills;
		set_data.dragonKill = data.dragonKills;
		set_data.baronKill = data.baronKills;
		set_data.riftheraldKill = data.riftHeraldKills;
		set_data.inhibitorKill = data.inhibitorKills;
		set_data.ban = data.bans;
		set_data.win = data.win === "Win" ? true : false;
		set_data.teamId = data.teamId;

		return set_data;
	}

	GetPlayerData(data, teamId)
	{
		let set_data = [];

		for( let i = 0, index = 0 ; i < data.participants.length ; ++i)
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
				set_data[index].assist = data.participants[i].stats.assists;
				set_data[index].death = data.participants[i].stats.deaths;
				set_data[index].gold = data.participants[i].stats.goldEarned;
				set_data[index].cs = data.participants[i].stats.totalMinionsKilled + data.participants[i].stats.neutralMinionsKilled;
				set_data[index].jungleMinionKill = data.participants[i].stats.neutralMinionsKilled;
				set_data[index].minionKill = data.participants[i].stats.totalMinionsKilled;
				set_data[index].neutralMinionsKilledEnemyJungle = data.participants[i].stats.neutralMinionsKilledEnemyJungle;
				set_data[index].neutralMinionsKilledTeamJungle = data.participants[i].stats.neutralMinionsKilledTeamJungle;

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

				for( let j = 0 ; j < data.participantIdentities.length ; ++j )
				{
					if( set_data[index].participantId == data.participantIdentities[j].participantId )
					{
						if(data.participantIdentities[j].player == undefined || data.participantIdentities[j].player.summonerName == undefined)
						{
							set_data[index].name = this.GetChampionName(data.participants[j].championId);
						}
						else
						{
							set_data[index].name = data.participantIdentities[j].player.summonerName;
						}

						break;
					}
				}

				set_data[index].mastery = [];

				if( data.participants[i].masteries != undefined )
				{
					for( let j = 0 ; j < data.participants[i].masteries.length ; ++j )
						set_data[index].mastery[j] = data.participants[i].masteries[j].masteryId;
				}

				set_data[index].turretsKill = data.participants[i].stats.turretKills || 0; // 破壊タレット数
				set_data[index].buyVisionWard = data.participants[i].stats.visionWardsBoughtInGame || 0;
				set_data[index].wardKill = data.participants[i].stats.wardsKilled || 0;
				set_data[index].wardPlace = data.participants[i].stats.wardsPlaced || 0;
				// 与えたダメージ
				set_data[index].physicalDamageDealtToChampions = data.participants[i].stats.physicalDamageDealtToChampions || 0; // 与えたメージ量(物理)
				set_data[index].physicalDamageDealtPlayer = data.participants[i].stats.physicalDamageDealtPlayer || 0;
				set_data[index].magicDamageDealtToChampions = data.participants[i].stats.magicDamageDealtToChampions || 0; // 与えたメージ量(魔法)
				set_data[index].magicDamageDealtPlayer = data.participants[i].stats.magicDamageDealtPlayer || 0;
				set_data[index].trueDamageDealtToChampions = data.participants[i].stats.trueDamageDealtToChampions || 0; // 与えたメージ量(確定ダメージ)
				set_data[index].trueDamageDealtToPlayer = data.participants[i].stats.trueDamageDealtPlayer || 0;
				set_data[index].totalTimeCrowdControlDealt = data.participants[i].stats.totalTimeCrowdControlDealt || 0;
				 set_data[index].largestCriticalStrike = data.participants[i].stats.largestCriticalStrike || 0; // 最大クリティカルダメージ
				
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
				// TimeLine用
				set_data[index].dragonKill = 0;
				set_data[index].riftheraldKill = 0;
				set_data[index].baronKill = 0;
				set_data[index].inhibitorKill = 0;
				set_data[index].wardPlaceWard = 0;
				set_data[index].wardPlaceVision = 0;
				set_data[index].wardPlaceTrinket = 0;
				set_data[index].wardKillWard = 0;
				set_data[index].wardKillVision = 0;
				set_data[index].wardKillTrinket = 0;

				index++;

				continue;
			}
		}

		return set_data;
	}

	SetTimiLineFrameData(detailData)
	{
		this.TIMELINE_WORK_DATA.frame = [];

		for( let i = 0 ; i < this.JSON_DATA_TIMELINE.frames.length ; ++i )
		{
			this.TIMELINE_WORK_DATA.frame[i] = {};
			this.TIMELINE_WORK_DATA.frame[i].player = {};
			this.TIMELINE_WORK_DATA.frame[i].team = [ {}, {} ];

			for( let j = 0 ; j < this.TIMELINE_WORK_DATA.frame[i].team.length ; ++j )
			{
				this.TIMELINE_WORK_DATA.frame[i].team[j].gold = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].cs = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].jungleMinionKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].minionKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].kill = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].death = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].assist = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].dragonKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].riftheraldKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].baronKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].turretsKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].buyVisionWard = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].wardKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].wardKillWard = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].wardKillVision = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].wardKillTrinket = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].wardPlace = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].wardPlaceWard = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].wardPlaceVision = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].wardPlaceTrinket = 0;
				this.TIMELINE_WORK_DATA.frame[i].team[j].inhibitorKill = 0;
			}

			for( let j in this.JSON_DATA_TIMELINE.frames[i].participantFrames )
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
				this.TIMELINE_WORK_DATA.frame[i].player[j].assist = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].dragonKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].riftheraldKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].baronKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].turretsKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].buyVisionWard = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].wardKill = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].wardKillWard = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].wardKillVision = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].wardKillTrinket = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].wardPlace = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].wardPlaceWard = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].wardPlaceVision = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].wardPlaceTrinket = 0;
				this.TIMELINE_WORK_DATA.frame[i].player[j].inhibitorKill = 0;
			}
		}

		this.TIMELINE_WORK_DATA.frame[this.JSON_DATA_TIMELINE.frames.length] = {};
		this.TIMELINE_WORK_DATA.frame[this.JSON_DATA_TIMELINE.frames.length].player = [];

		for( let j = 0, index = 1 ; j < detailData.teams.length ; ++j )
		{
			for( let k = 0 ; k < detailData.teams[j].player.length ; ++k, ++index )
			{
				const set_index = detailData.teams[j].player[k].participantId;
				this.TIMELINE_WORK_DATA.frame[this.JSON_DATA_TIMELINE.frames.length].player[set_index] = detailData.teams[j].player[k];
			}
		}

		this.TIMELINE_WORK_DATA.frame[this.JSON_DATA_TIMELINE.frames.length].team = $.extend(true, {}, detailData.teams);
		delete this.TIMELINE_WORK_DATA.frame[this.JSON_DATA_TIMELINE.frames.length].team["player"];

		for( let i = 0 ; i < this.JSON_DATA_TIMELINE.frames.length ; ++i )
		{
			for( let j = 0 ; j < this.JSON_DATA_TIMELINE.frames[i].events.length ; ++j )
			{
				const isEnd = i == (this.JSON_DATA_TIMELINE.frames.length-1);
				let set_work_frame = this.TIMELINE_WORK_DATA.frame[i+1];
				let killerId, setId;

				switch(this.JSON_DATA_TIMELINE.frames[i].events[j].type)
				{
					case "CHAMPION_KILL":
						if(isEnd)
							break;
						
						killerId = this.JSON_DATA_TIMELINE.frames[i].events[j].killerId;
						const deathId = this.JSON_DATA_TIMELINE.frames[i].events[j].victimId;
						const assistId = this.JSON_DATA_TIMELINE.frames[i].events[j].assistingParticipantIds;
						
						if(killerId != 0)
							set_work_frame.player[killerId].kill++;
						
						set_work_frame.player[deathId].death++;

						for( let k = 0 ; k < assistId.length ; ++k )
							set_work_frame.player[assistId[k]].assist++;

						for( let k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
						{
							if(killerId != 0)
								this.TIMELINE_WORK_DATA.frame[k].player[killerId].kill++;
							
							this.TIMELINE_WORK_DATA.frame[k].player[deathId].death++;
							
							for( let l = 0 ; l < assistId.length ; ++l )
								this.TIMELINE_WORK_DATA.frame[k].player[assistId[l]].assist++;
						}
						break;
					case "ELITE_MONSTER_KILL" :
						if(isEnd)
							break;
						
						killerId = this.JSON_DATA_TIMELINE.frames[i].events[j].killerId;

						switch(this.JSON_DATA_TIMELINE.frames[i].events[j].monsterType)
						{
							case "DRAGON" :
								if(killerId != 0)
									set_work_frame.player[killerId].dragonKill++;
								
								for( let k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
								{
									if(killerId != 0)
										this.TIMELINE_WORK_DATA.frame[k].player[killerId].dragonKill++;
								}
								break;
							case "RIFTHERALD" :
								if(killerId != 0)
									set_work_frame.player[killerId].riftheraldKill++;
								
								for( let k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
								{
									if(killerId != 0)
										this.TIMELINE_WORK_DATA.frame[k].player[killerId].riftheraldKill++;
								}
								break;
							case "BARON_NASHOR" :
								if(killerId != 0)
									set_work_frame.player[killerId].baronKill++;
								
								for( let k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
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
						if(isEnd)
							break;
						
						killerId = this.JSON_DATA_TIMELINE.frames[i].events[j].killerId;

						switch(this.JSON_DATA_TIMELINE.frames[i].events[j].towerType)
						{
							case "NEXUS_TURRET" :
							case "INNER_TURRET" :
							case "BASE_TURRET" :
							case "OUTER_TURRET" :
								if(killerId != 0)
									set_work_frame.player[killerId].turretsKill++;
								
								for( let k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
								{
									if(killerId != 0)
										this.TIMELINE_WORK_DATA.frame[k].player[killerId].turretsKill++;
								}
								break;
							case "UNDEFINED_TURRET" :
								if(killerId != 0)
									set_work_frame.player[killerId].inhibitorKill++;
								
								for( let k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
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
					case "WARD_PLACED" :
						setId = this.JSON_DATA_TIMELINE.frames[i].events[j].creatorId;
						let isPlace = false;

						switch(this.JSON_DATA_TIMELINE.frames[i].events[j].wardType)
						{
							case "SIGHT_WARD" :
								set_work_frame.player[setId].wardPlaceWard++;
								for( let k = i+2 ; k < this.TIMELINE_WORK_DATA.frame.length ; ++k )
									this.TIMELINE_WORK_DATA.frame[k].player[setId].wardPlaceWard++;
								isPlace = true;
								break;
							case "VISION_WARD" :
								set_work_frame.player[setId].wardPlaceVision++;
								for( let k = i+2 ; k < this.TIMELINE_WORK_DATA.frame.length ; ++k )
									this.TIMELINE_WORK_DATA.frame[k].player[setId].wardPlaceVision++;
								isPlace = true;
								break;
							case "YELLOW_TRINKET" :
							case "BLUE_TRINKET" :
								set_work_frame.player[setId].wardPlaceTrinket++;
								for( let k = i+2 ; k < this.TIMELINE_WORK_DATA.frame.length ; ++k )
								{
									//console.log("k: " + k);
									//console.log("setID: " + setId);
									this.TIMELINE_WORK_DATA.frame[k].player[setId].wardPlaceTrinket++;
								}
								isPlace = true;
								break;
							default:
								//console.log("wardType : " + this.JSON_DATA_TIMELINE.frames[i].events[j].wardType + " setId : " + setId);
								break;
						}
						
						if(isPlace & !isEnd)
						{
							set_work_frame.player[setId].wardPlace++;
							for( let k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
								this.TIMELINE_WORK_DATA.frame[k].player[setId].wardPlace++;
						}
						break;
					case "WARD_KILL":
						killerId = this.JSON_DATA_TIMELINE.frames[i].events[j].killerId;
						let isKill = false;
						
						switch(this.JSON_DATA_TIMELINE.frames[i].events[j].wardType)
						{
							case "SIGHT_WARD" :
								set_work_frame.player[killerId].wardKillWard++;
								for( let k = i+2 ; k < this.TIMELINE_WORK_DATA.frame.length ; ++k )
									this.TIMELINE_WORK_DATA.frame[k].player[killerId].wardKillWard++;
								isKill = true;
								break;
							case "VISION_WARD" :
								set_work_frame.player[killerId].wardKillVision++;
								for( let k = i+2 ; k < this.TIMELINE_WORK_DATA.frame.length ; ++k )
									this.TIMELINE_WORK_DATA.frame[k].player[killerId].wardKillVision++;
								isKill = true;
								break;
							case "YELLOW_TRINKET" :
							case "BLUE_TRINKET" :
								set_work_frame.player[killerId].wardKillTrinket++;
								for( let k = i+2 ; k < this.TIMELINE_WORK_DATA.frame.length ; ++k )
									this.TIMELINE_WORK_DATA.frame[k].player[killerId].wardKillTrinket++;
								isKill = true;
								break;
						}
						if(isKill & !isEnd)
						{
							set_work_frame.player[killerId].wardKill++;
							for( let k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
								this.TIMELINE_WORK_DATA.frame[k].player[killerId].wardKill++;
						}
						break;
					case "ITEM_PURCHASED":
						if(isEnd)
							break;
						
						setId = this.JSON_DATA_TIMELINE.frames[i].events[j].participantId;

						if( $.inArray( this.JSON_DATA_TIMELINE.frames[i].events[j].itemId, this.VISION_WARD_ID ) >= 0 )
						{
							set_work_frame.player[setId].buyVisionWard++;
							for( let k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
								this.TIMELINE_WORK_DATA.frame[k].player[setId].buyVisionWard++;
						}
						break;
					case "ITEM_SOLD":
						setId = this.JSON_DATA_TIMELINE.frames[i].events[j].participantId;

						if( $.inArray( this.JSON_DATA_TIMELINE.frames[i].events[j].itemId, this.VISION_WARD_ID ) >= 0 )
						{
							set_work_frame.player[setId].buyVisionWard--;
							for( let k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
								this.TIMELINE_WORK_DATA.frame[k].player[setId].buyVisionWard--;
						}
						break;
					case "ITEM_UNDO":
						setId = this.JSON_DATA_TIMELINE.frames[i].events[j].participantId;
						const isAddd = $.inArray( this.JSON_DATA_TIMELINE.frames[i].events[j].afterId, this.VISION_WARD_ID ) >= 0;
						const isRem = $.inArray( this.JSON_DATA_TIMELINE.frames[i].events[j].beforeId, this.VISION_WARD_ID ) >= 0;

						if( isAddd ^ isRem )
						{
							isAddd ? set_work_frame.player[setId].buyVisionWard++ : set_work_frame.player[setId].buyVisionWard--;

							for( let k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
								isAddd ? this.TIMELINE_WORK_DATA.frame[k].player[setId].buyVisionWard++ : this.TIMELINE_WORK_DATA.frame[k].player[setId].buyVisionWard--;
						}
						break;
					default :
						//console.log(this.JSON_DATA_TIMELINE.frames[i].events[j].type + " : " + i + " - " + j);
						break;
				}
			}
		}
		
		for( let i = 0 ; i < this.TIMELINE_WORK_DATA.frame.length-1 ; ++i )
		{
			for( let j in this.TIMELINE_WORK_DATA.frame[i].player )
			{

				for( let k = 0 ; k < this.JSON_DATA_MATCHDETAIL.teams.length ; ++k )
				{
					for( let l = 0 ; l < this.JSON_DATA_MATCHDETAIL.teams[k].player.length ; ++l )
					{
						if( this.TIMELINE_WORK_DATA.frame[i].player[j].participantId == this.JSON_DATA_MATCHDETAIL.teams[k].player[l].participantId )
						{
							this.TIMELINE_WORK_DATA.frame[i].team[k].gold += this.TIMELINE_WORK_DATA.frame[i].player[j].gold;
							this.TIMELINE_WORK_DATA.frame[i].team[k].cs += this.TIMELINE_WORK_DATA.frame[i].player[j].cs;
							this.TIMELINE_WORK_DATA.frame[i].team[k].kill += this.TIMELINE_WORK_DATA.frame[i].player[j].kill;
							this.TIMELINE_WORK_DATA.frame[i].team[k].death += this.TIMELINE_WORK_DATA.frame[i].player[j].death;
							this.TIMELINE_WORK_DATA.frame[i].team[k].assist += this.TIMELINE_WORK_DATA.frame[i].player[j].assist;
							this.TIMELINE_WORK_DATA.frame[i].team[k].dragonKill += this.TIMELINE_WORK_DATA.frame[i].player[j].dragonKill;
							this.TIMELINE_WORK_DATA.frame[i].team[k].riftheraldKill += this.TIMELINE_WORK_DATA.frame[i].player[j].riftheraldKill;
							this.TIMELINE_WORK_DATA.frame[i].team[k].baronKill += this.TIMELINE_WORK_DATA.frame[i].player[j].baronKill;
							this.TIMELINE_WORK_DATA.frame[i].team[k].turretsKill += this.TIMELINE_WORK_DATA.frame[i].player[j].turretsKill;
							this.TIMELINE_WORK_DATA.frame[i].team[k].wardKill += this.TIMELINE_WORK_DATA.frame[i].player[j].wardKill;
							this.TIMELINE_WORK_DATA.frame[i].team[k].wardPlace += this.TIMELINE_WORK_DATA.frame[i].player[j].wardPlace;
							this.TIMELINE_WORK_DATA.frame[i].team[k].inhibitorKill += this.TIMELINE_WORK_DATA.frame[i].player[j].inhibitorKill;
							this.TIMELINE_WORK_DATA.frame[i].team[k].buyVisionWard += this.TIMELINE_WORK_DATA.frame[i].player[j].buyVisionWard;
						}
					}
				}
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	
	GetVersion(ver, json)
	{
		let version = ver;

		if(version == undefined)
			return json[0];

		while(1)
		{
			for(let i = 0 ; i < json.length ; ++i)
			{
				if(version.indexOf(json[i]) !== -1)
					return json[i];
			}

			if(version.length-1 > 0)
				version = version.substr(0, version.length-1);
			else
				return json[0];
		}
	}

	GetChampionImgName(id)
	{
		for( let i = 0 ; i < this.JSON_DATA_CHAMP_IMG.length ; ++i )
		{
			if ( id == this.JSON_DATA_CHAMP_IMG[i].id )
				return this.JSON_DATA_CHAMP_IMG[i].image.full;
		}
	}

	GetChampionName(id)
	{
		for( let i = 0 ; i < this.JSON_DATA_CHAMP_IMG.length ; ++i )
		{
			if ( id == this.JSON_DATA_CHAMP_IMG[i].id )
				return this.JSON_DATA_CHAMP_IMG[i].name;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////

	Show()
	{
		let frame = this.TIMELINE_WORK_DATA.frame.length;
		frame = this.TIMELINE_WORK_DATA.frame.length-1;

		this.ShowWinLose();
		this.ShowTeamName();

		for( let i = 1 ; i <= 5 ; ++i )
		{
			this.ShowChampionImg(i);
			this.ShowName(i);
		}

		$('#frame_slidebar').trigger('change');

		this.isShow = true;
	}

	ShowChampionImg(player_index)
	{
		let champ_index;
		let champ_img;
		let champ_name;

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
		{
			for( let j = 0 ; j < this.JSON_DATA_CHAMP_IMG.length ; ++j )
			{
				if(this.JSON_DATA_CHAMP_IMG[j].key == this.JSON_DATA_MATCHDETAIL.teams[i].player[player_index-1].championId)
				{
					champ_index = j;
					break;
				}
			}

			champ_img = this.JSON_DATA_CHAMP_IMG[champ_index].image.full;
			champ_name = this.JSON_DATA_CHAMP_IMG[champ_index].name;

			const tag = "<img src='" + this.CDN_URL + "/" + this.VERSION + "/img/champion/" + champ_img + "' title='" + champ_name +"' class='champion_img'>";
			$("#player > player"+ player_index +" > champion_img > " + this.TEAM_TAG[i]).html(tag);
		}
	}
	
	ShowName(player_index)
	{
		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > Name > " + this.TEAM_TAG[i]).html(this.JSON_DATA_MATCHDETAIL.teams[i].player[player_index-1].name);
	}

	ShowCS(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].cs,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].cs
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > CS > " + this.TEAM_TAG[i]).html("CS : " + num[i]);
	}

	ShowCSBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].cs,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].cs
		];
		
		this.ShowBar($("#player > player"+ player_index +" > CS > canvas")[0], num);
	}

	ShowLv(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].lv,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].lv
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > Lv > " + this.TEAM_TAG[i]).html("レベル : " + num[i]);
	}

	ShowLvBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].lv,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].lv
		];
		
		this.ShowBar($("#player > player"+ player_index +" > Lv > canvas")[0], num);
	}

	ShowXp(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].xp,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].xp
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > Xp > " + this.TEAM_TAG[i]).html(isVisible ? "経験値 : " + num[i] : "");
	}

	ShowXpBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].xp,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].xp
		];
		
		this.ShowBar($("#player > player"+ player_index +" > Xp > canvas")[0], num, isVisible);
	}

	ShowKill(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].kill,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].kill
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > Kill > " + this.TEAM_TAG[i]).html("キル : " + num[i]);
	}

	ShowKillBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].kill,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].kill
		];
		
		this.ShowBar($("#player > player"+ player_index +" > Kill > canvas")[0], num);
	}

	ShowDeath(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].death,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].death
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > Death > " + this.TEAM_TAG[i]).html("デス : " + num[i]);
	}

	ShowDeathBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].death,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].death
		];
		
		this.ShowBar($("#player > player"+ player_index +" > Death > canvas")[0], num);
	}

	ShowAssist(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].assist,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].assist
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > Assist > " + this.TEAM_TAG[i]).html("アシスト : " + num[i]);
	}

	ShowAssistBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].assist,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].assist
		];
		
		this.ShowBar($("#player > player"+ player_index +" > Assist > canvas")[0], num);
	}

	ShowMinionCS(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].minionKill,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].minionKill
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > MinionCS > " + this.TEAM_TAG[i]).html("ミニオンCS : " + num[i]);
	}

	ShowMinionCSBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].minionKill,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].minionKill
		];
		
		this.ShowBar($("#player > player"+ player_index +" > MinionCS > canvas")[0], num);
	}

	ShowJungleMinionCS(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].jungleMinionKill,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].jungleMinionKill
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > JungleCS > " + this.TEAM_TAG[i]).html("ジャングルCS : " + num[i]);
	}

	ShowJungleMinionCSBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].jungleMinionKill,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].jungleMinionKill
		];
		
		this.ShowBar($("#player > player"+ player_index +" > JungleCS > canvas")[0], num);
	}

	ShowGold(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].gold,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].gold
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > Gold > " + this.TEAM_TAG[i]).html("ゴールド : " + num[i]);
	}

	ShowGoldBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].gold,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].gold
		];
		
		this.ShowBar($("#player > player"+ player_index +" > Gold > canvas")[0], num);
	}
	
	ShowPhysicalDamageDealtToChampion(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].physicalDamageDealtToChampions,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].physicalDamageDealtToChampions
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > PhysicalDamageDealtToChampion > " + this.TEAM_TAG[i]).html(isVisible ? "与物理ダメージ<br>敵チャンピオン : " + num[i] : "");
	}

	ShowPhysicalDamageDealtToChampionBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].physicalDamageDealtToChampions,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].physicalDamageDealtToChampions
		];
		
		this.ShowBar($("#player > player"+ player_index +" > PhysicalDamageDealtToChampion > canvas")[0], num, isVisible);
	}

	ShowPhysicalDamageDealtToPlayer(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].physicalDamageDealtPlayer,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].physicalDamageDealtPlayer
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > PhysicalDamageDealtToPlayer > " + this.TEAM_TAG[i]).html(isVisible ? "与物理ダメージ<br>プレイヤー : " + num[i] : "");
	}

	ShowPhysicalDamageDealtToPlayerBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].physicalDamageDealtPlayer,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].physicalDamageDealtPlayer
		];
		
		this.ShowBar($("#player > player"+ player_index +" > PhysicalDamageDealtToPlayer > canvas")[0], num, isVisible);
	}

	ShowMagicDamageDealtToChampion(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].magicDamageDealtToChampions,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].magicDamageDealtToChampions
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > MagicDamageDealtToChampion > " + this.TEAM_TAG[i]).html(isVisible ? "与魔法ダメージ<br>敵チャンピオン : " + num[i] : "");
	}

	ShowMagicDamageDealtToChampionBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].magicDamageDealtToChampions,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].magicDamageDealtToChampions
		];
		
		this.ShowBar($("#player > player"+ player_index +" > MagicDamageDealtToChampion > canvas")[0], num, isVisible);
	}

	ShowMagicDamageDealtToPlayer(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].magicDamageDealtPlayer,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].magicDamageDealtPlayer
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > MagicDamageDealtToPlayer > " + this.TEAM_TAG[i]).html(isVisible ? "与魔法ダメージ<br>プレイヤー : " + num[i] : "");
	}

	ShowMagicDamageDealtToPlayerBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].magicDamageDealtPlayer,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].magicDamageDealtPlayer
		];
		
		this.ShowBar($("#player > player"+ player_index +" > MagicDamageDealtToPlayer > canvas")[0], num, isVisible);
	}

	ShowTrueDamageDealtToChampion(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].trueDamageDealtToChampions,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].trueDamageDealtToChampions
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TrueDamageDealtToChampion > " + this.TEAM_TAG[i]).html(isVisible ? "確定ダメージ <br>敵チャンピオン : " + num[i] : "");
	}

	ShowTrueDamageDealtToChampionBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].trueDamageDealtToChampions,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].trueDamageDealtToChampions
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TrueDamageDealtToChampion > canvas")[0], num, isVisible);
	}

	ShowTrueDamageDealtToPlayer(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].trueDamageDealtToPlayer,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].trueDamageDealtToPlayer
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TrueDamageDealtToPlayer > " + this.TEAM_TAG[i]).html(isVisible ? "確定ダメージ<br>プレイヤー : " + num[i] : "");
	}

	ShowTrueDamageDealtToPlayerBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].trueDamageDealtToPlayer,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].trueDamageDealtToPlayer
		];
		
		this.ShowBar($("#player > player"+ player_index +" > trueDamageDealtToPlayer > canvas")[0], num, isVisible);
	}
	
	ShowTotalDamageDealt(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalDamageDealt,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalDamageDealt
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TotalDamageDealt > " + this.TEAM_TAG[i]).html(isVisible ? "与ダメージ合計 : " + num[i] : "");
	}

	ShowTotalDamageDealtBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalDamageDealt,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalDamageDealt
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TotalDamageDealt > canvas")[0], num, isVisible);
	}
	ShowTotalDamageDealtToBuilding(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalDamageDealtToBuildings,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalDamageDealtToBuildings
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TotalDamageDealtToBuilding > " + this.TEAM_TAG[i]).html(isVisible ? "与ダメージ<br>建物 : " + num[i] : "");
	}

	ShowTotalDamageDealtToBuildingBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalDamageDealtToBuildings,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalDamageDealtToBuildings
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TotalDamageDealtToBuilding > canvas")[0], num, isVisible);
	}
	
	ShowTotalDamageDealtToChampion(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalDamageDealtToChampions,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalDamageDealtToChampions
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TotalDamageDealtToChampion > " + this.TEAM_TAG[i]).html(isVisible ? "与ダメージ<br>チャンピオン : " + num[i] : "");
	}

	ShowTotalDamageDealtToChampionBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalDamageDealtToChampions,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalDamageDealtToChampions
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TotalDamageDealtToChampion > canvas")[0], num, isVisible);
	}

	ShowTotalCrawdControlDamageDealt(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalTimeCrowdControlDealt,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalTimeCrowdControlDealt
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TotalCrawdControlDamageDealt > " + this.TEAM_TAG[i]).html(isVisible ? "クラウドコントロールタイム合計 : " + num[i] : "");
	}

	ShowTotalCrawdControlDamageDealtBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalTimeCrowdControlDealt,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalTimeCrowdControlDealt
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TotalCrawdControlDamageDealt > canvas")[0], num, isVisible);
	}
	
	ShowTotalDamageTaken(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalDamageTaken,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalDamageTaken
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TotalDamageTaken > " + this.TEAM_TAG[i]).html(isVisible ? "受けたダメージ量 : " + num[i] : "");
	}

	ShowTotalDamageTakenBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalDamageTaken,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalDamageTaken
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TotalDamageTaken > canvas")[0], num, isVisible);
	}
	
	ShowPhysicalDamageTaken(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].physicalDamageTaken,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].physicalDamageTaken
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > PhysicalDamageTaken > " + this.TEAM_TAG[i]).html(isVisible ? "被物理ダメージ : " + num[i] : "");
	}

	ShowPhysicalDamageTakenBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].physicalDamageTaken,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].physicalDamageTaken
		];
		
		this.ShowBar($("#player > player"+ player_index +" > PhysicalDamageTaken > canvas")[0], num, isVisible);
	}
	
	ShowMagicDamageTaken(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].magicDamageTaken,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].magicDamageTaken
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > MagicDamageTaken > " + this.TEAM_TAG[i]).html(isVisible ? "被魔法ダメージ : " + num[i] : "");
	}

	ShowMagicDamageTakenBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].magicDamageTaken,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].magicDamageTaken
		];
		
		this.ShowBar($("#player > player"+ player_index +" > MagicDamageTaken > canvas")[0], num, isVisible);
	}
	
	ShowTrueDamageTaken(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].trueDamageTaken,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].trueDamageTaken
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TrueDamageTaken > " + this.TEAM_TAG[i]).html(isVisible ? "被確定ダメージ<br>チャンピオン : " + num[i] : "");
	}

	ShowTrueDamageTakenBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].trueDamageTaken,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].trueDamageTaken
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TrueDamageTaken > canvas")[0], num, isVisible);
	}
	
	ShowTotalHeal(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalHeal,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalHeal
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TotalHeal > " + this.TEAM_TAG[i]).html(isVisible ? "合計ヒール量 : " + num[i] : "");
	}

	ShowTotalHealBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalHeal,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalHeal
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TotalHeal > canvas")[0], num, isVisible);
	}
	
	ShowTotalHealToUnit(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalUnitsHealed,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalUnitsHealed
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TotalHealToUnit > " + this.TEAM_TAG[i]).html(isVisible ? "ユニットヒール量 : " + num[i] : "");
	}

	ShowTotalHealToUnitBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].totalUnitsHealed,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].totalUnitsHealed
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TotalHealToUnit > canvas")[0], num, isVisible);
	}

	ShowTowerKill(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].turretsKill,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].turretsKill
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > TowerKill > " + this.TEAM_TAG[i]).html("タワー破壊数 : " + num[i]);
	}

	ShowTowerKillBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].turretsKill,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].turretsKill
		];
		
		this.ShowBar($("#player > player"+ player_index +" > TowerKill > canvas")[0], num);
	}

	ShowBuyVisionWard(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].buyVisionWard,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].buyVisionWard
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > BuyVisionWard > " + this.TEAM_TAG[i]).html("ビジョンワード購入数 : " + num[i]);
	}

	ShowBuyVisionWardBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].buyVisionWard,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].buyVisionWard
		];
		
		this.ShowBar($("#player > player"+ player_index +" > BuyVisionWard > canvas")[0], num);
	}

	ShowWardPlace(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardPlace,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardPlace
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > WardPlace > " + this.TEAM_TAG[i]).html("ワードを置いた合計数 : " + num[i]);
	}

	ShowWardPlaceBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardPlace,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardPlace
		];
		
		this.ShowBar($("#player > player"+ player_index +" > WardPlace > canvas")[0], num);
	}

	ShowWardKill(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardKill,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardKill
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > WardKill > " + this.TEAM_TAG[i]).html("ワードを壊した数 : " + num[i]);
	}

	ShowWardKillBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardKill,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardKill
		];
		
		this.ShowBar($("#player > player"+ player_index +" > WardKill > canvas")[0], num);
	}

	ShowDragonKill(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].dragonKill,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].dragonKill
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > DragonKill > " + this.TEAM_TAG[i]).html("ドラゴンキル数 : " + num[i]);
	}

	ShowDragonKillBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].dragonKill,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].dragonKill
		];
		
		this.ShowBar($("#player > player"+ player_index +" > DragonKill > canvas")[0], num);
	}

	ShowRiftheraldKill(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].riftheraldKill,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].riftheraldKill
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > RiftheraldKill > " + this.TEAM_TAG[i]).html("リフトヘラルドキル数 : " + num[i]);
	}

	ShowRiftheraldKillBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].riftheraldKill,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].riftheraldKill
		];
		
		this.ShowBar($("#player > player"+ player_index +" > RiftheraldKill > canvas")[0], num);
	}

	ShowBaronKill(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].baronKill,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].baronKill
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > BaronKill > " + this.TEAM_TAG[i]).html("バロンキル数 : " + num[i]);
	}

	ShowBaronKillBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].baronKill,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].baronKill
		];
		
		this.ShowBar($("#player > player"+ player_index +" > BaronKill > canvas")[0], num);
	}

	ShowInhibitorKill(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].inhibitorKill,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].inhibitorKill
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > InhibitorKill > " + this.TEAM_TAG[i]).html("インヒビター破壊数 : " + num[i]);
	}

	ShowInhibitorKillBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].inhibitorKill,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].inhibitorKill
		];
		
		this.ShowBar($("#player > player"+ player_index +" > InhibitorKill > canvas")[0], num);
	}

	ShowWardPlaceWard(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardPlaceWard,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardPlaceWard
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > WardPlaceWard > " + this.TEAM_TAG[i]).html( "ワードを置いた数 : " + num[i]);
	}

	ShowWardPlaceWardBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardPlaceWard,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardPlaceWard
		];
		
		this.ShowBar($("#player > player"+ player_index +" > WardPlaceWard > canvas")[0], num);
	}

	ShowWardPlaceVision(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardPlaceVision,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardPlaceVision
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > WardPlaceVision > " + this.TEAM_TAG[i]).html( "ビジョンワードを置いた数 : " + num[i]);
	}

	ShowWardPlaceVisionBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardPlaceVision,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardPlaceVision
		];
		
		this.ShowBar($("#player > player"+ player_index +" > WardPlaceVision > canvas")[0], num);
	}
	
	ShowWardPlaceTrinket(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardPlaceTrinket,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardPlaceTrinket
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > WardPlaceTrinket > " + this.TEAM_TAG[i]).html( "トリンケットワードを置いた数 : " + num[i]);
	}

	ShowWardPlaceTrinketBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardPlaceTrinket,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardPlaceTrinket
		];
		
		this.ShowBar($("#player > player"+ player_index +" > WardPlaceTrinket > canvas")[0], num);
	}

	ShowWardKillWard(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardKillWard,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardKillWard
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > WardKillWard > " + this.TEAM_TAG[i]).html("ワード破壊数 : " + num[i]);
	}

	ShowWardKillWardBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardKillWard,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardKillWard
		];
		
		this.ShowBar($("#player > player"+ player_index +" > WardKillWard > canvas")[0], num);
	}
	
	ShowWardKillVision(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardKillVision,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardKillVision
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > WardKillVision > " + this.TEAM_TAG[i]).html("ビジョンワード破壊数 : " + num[i]);
	}

	ShowWardKillVisionBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardKillVision,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardKillVision
		];
		
		this.ShowBar($("#player > player"+ player_index +" > WardKillVision > canvas")[0], num);
	}
	
	ShowWardKillTrinket(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardKillTrinket,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardKillTrinket
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > WardKillTrinket > " + this.TEAM_TAG[i]).html("トリンケットワード破壊数 : " + num[i]);
	}

	ShowWardKillTrinketBar(player_index, frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].wardKillTrinket,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].wardKillTrinket
		];
		
		this.ShowBar($("#player > player"+ player_index +" > WardKillTrinket > canvas")[0], num);
	}
	
	ShowJungleCSEnemy(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].neutralMinionsKilledEnemyJungle,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].neutralMinionsKilledEnemyJungle
		];

		if( isNaN(this.TIMELINE_WORK_DATA.frame[frame].player[player_index].neutralMinionsKilledEnemyJungle) || isNaN(this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].neutralMinionsKilledEnemyJungle) )
			isVisible = false;
		
		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > JungleCSEnemy > " + this.TEAM_TAG[i]).html(isVisible ? "ジャングルCS<br>敵サイド : " + num[i] : "");
	}

	ShowJungleCSEnemyBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].neutralMinionsKilledEnemyJungle,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].neutralMinionsKilledEnemyJungle
		];
		
		if( isNaN(this.TIMELINE_WORK_DATA.frame[frame].player[player_index].neutralMinionsKilledEnemyJungle) || isNaN(this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].neutralMinionsKilledEnemyJungle) )
			isVisible = false;
		
		this.ShowBar($("#player > player"+ player_index +" > JungleCSEnemy > canvas")[0], num, isVisible);
	}
	
	ShowJungleCSTeam(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].neutralMinionsKilledTeamJungle,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].neutralMinionsKilledTeamJungle
		];

		if( isNaN(this.TIMELINE_WORK_DATA.frame[frame].player[player_index].neutralMinionsKilledTeamJungle) || isNaN(this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].neutralMinionsKilledTeamJungle) )
			isVisible = false;
		
		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > JungleCSTeam > " + this.TEAM_TAG[i]).html(isVisible ? "ジャングルCS<br>自サイド : " + num[i] : "");
	}

	ShowJungleCSTeamBar(player_index, frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index].neutralMinionsKilledTeamJungle,
			this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].neutralMinionsKilledTeamJungle
		];
		
		if( isNaN(this.TIMELINE_WORK_DATA.frame[frame].player[player_index].neutralMinionsKilledTeamJungle) || isNaN(this.TIMELINE_WORK_DATA.frame[frame].player[player_index+5].neutralMinionsKilledTeamJungle) )
			isVisible = false;
		
		this.ShowBar($("#player > player"+ player_index +" > JungleCSTeam > canvas")[0], num, isVisible);
	}

	////////////////////////////////////////////////////////////////////////////////////

	ShowBar(target, num_array, isVisible = true)
	{
		let num_blue = num_array[0];
		let num_red = num_array[1];
		
		if(num_blue == 0 && num_red == 0)
		{
			num_blue = 1;
			num_red = 1;
		}

		const per = num_blue / ( num_blue + num_red );

		let ctx = target.getContext('2d');

		if( isVisible )
		{
			target.width = $("main").width();
			target.height = 20;

			ctx.save();

			ctx.font = "16px Arial";
			// ctx.font = "italic bold 18px 'ＭＳ Ｐゴシック'";
			ctx.textAlign = 'center';

			ctx.beginPath();
			ctx.fillStyle = 'rgb(20, 20, 180)'; // blue
			const blue_width = target.width * per;
			ctx.fillRect(0, 0, blue_width, target.height);

			ctx.beginPath();
			ctx.fillStyle = 'rgb(180, 20, 20)'; // red
			const red_width = target.width - blue_width;
			ctx.fillRect(blue_width, 0, red_width, target.height);

			const blue_par = this.FloatFormat(per * 100, 1);
			const text_b = blue_par + "%";
			const red_par = this.FloatFormat(100 - blue_par, 1);
			const text_r = red_par + "%";
			const blue_x = Math.floor(blue_width/2);
			const red_x = Math.floor(blue_width + (red_width/2));

			ctx.beginPath();
			ctx.fillStyle = 'rgb(0, 0, 0)';

			ctx.fillText(text_b, blue_x+1, 16+1, blue_width);
			ctx.fillText(text_b, blue_x-1, 16+1, blue_width);

			ctx.beginPath();
			ctx.fillText(text_r, red_x+1, 16+1, red_width);
			ctx.fillText(text_r, red_x-1, 16+1, red_width);
			
			ctx.beginPath();
			ctx.fillStyle = 'rgb(255, 255, 255)';
			ctx.fillText(text_b, blue_x, 16, blue_width);

			ctx.beginPath();
			ctx.fillText(text_r, red_x, 16, red_width);

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

	ShowWinLose()
	{
		let num = [];

		num[0] = this.JSON_DATA_MATCHDETAIL.teams[0].win ? "勝利" : "敗北";
		num[1] = this.JSON_DATA_MATCHDETAIL.teams[1].win ? "勝利" : "敗北";

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > WinLose > " + this.TEAM_TAG[i]).html(num[i]);
	}

	ShowTeamName()
	{
		const num = [
			this.JSON_DATA_MATCHDETAIL.teams[0].team_name,
			this.JSON_DATA_MATCHDETAIL.teams[1].team_name,
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > Name > " + this.TEAM_TAG[i]).html(num[i] + ((i == this.TEAM_TAG.length -1) ? "<br>" : ""));
	}

	ShowTeamKill(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].kill,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].kill
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > Kill > " + this.TEAM_TAG[i]).html("キル : " + num[i]);
	}

	ShowTeamKillBar(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].kill,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].kill
		];
		
		this.ShowBar($("#team > Kill > canvas")[0], num);
	}

	ShowTeamDeath(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].death,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].death
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > Death > " + this.TEAM_TAG[i]).html("デス : " + num[i]);
	}

	ShowTeamDeathBar(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].death,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].death
		];
		
		this.ShowBar($("#team > Death > canvas")[0], num);
	}

	ShowTeamAssist(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].assist,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].assist
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > Assist > " + this.TEAM_TAG[i]).html("アシスト : " + num[i]);
	}

	ShowTeamAssistBar(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].assist,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].assist
		];
		
		this.ShowBar($("#team > Assist > canvas")[0], num);
	}

	ShowTeamGold(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].gold,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].gold
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > Gold > " + this.TEAM_TAG[i]).html("ゴールド : " + num[i]);
	}

	ShowTeamGoldBar(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].gold,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].gold
		];
		
		this.ShowBar($("#team > Gold > canvas")[0], num);
	}

	ShowTeamCS(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].cs,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].cs
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > CS > " + this.TEAM_TAG[i]).html("CS : " + num[i]);
	}

	ShowTeamCSBar(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].cs,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].cs
		];
		
		this.ShowBar($("#team > CS > canvas")[0], num);
	}

	ShowTeamDragonKill(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].dragonKill,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].dragonKill
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > DragonKill > " + this.TEAM_TAG[i]).html("ドラゴンキル数 : " + num[i]);
	}

	ShowTeamDragonKillBar(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].dragonKill,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].dragonKill
		];
		
		this.ShowBar($("#team > DragonKill > canvas")[0], num);
	}

	ShowTeamRiftHeraldKill(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].riftheraldKill,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].riftheraldKill
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > RiftHeraldKill > " + this.TEAM_TAG[i]).html("リフトヘラルドキル数 : " + num[i]);
	}

	ShowTeamRiftHeraldKillBar(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].riftheraldKill,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].riftheraldKill
		];
		
		this.ShowBar($("#team > RiftHeraldKill > canvas")[0], num);
	}

	ShowTeamBaronKill(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].baronKill,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].baronKill
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > BaronKill > " + this.TEAM_TAG[i]).html("バロンキル数 : " + num[i]);
	}

	ShowTeamBaronKillBar(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].baronKill,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].baronKill
		];
		
		this.ShowBar($("#team > BaronKill > canvas")[0], num);
	}

	ShowTeamTowerKill(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].turretsKill,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].turretsKill
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > TowerKill > " + this.TEAM_TAG[i]).html("タワー破壊数 : " + num[i]);
	}

	ShowTeamTowerKillBar(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].turretsKill,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].turretsKill
		];
		
		this.ShowBar($("#team > TowerKill > canvas")[0], num);
	}
	
	ShowTeamInhibitorKill(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].inhibitorKill,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].inhibitorKill
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > InhibitorKill > " + this.TEAM_TAG[i]).html("インヒビター破壊数 : " + num[i]);
	}

	ShowTeamInhibitorKillBar(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].inhibitorKill,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].inhibitorKill
		];
		
		this.ShowBar($("#team > InhibitorKill > canvas")[0], num);
	}
	
	ShowTeamWardPlace(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].wardPlace,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].wardPlace
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > WardPlace > " + this.TEAM_TAG[i]).html("ワードを置いた数 : " + num[i]);
	}

	ShowTeamWardPlaceBar(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].wardPlace,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].wardPlace
		];
		
		this.ShowBar($("#team > WardPlace > canvas")[0], num);
	}
	
	ShowTeamWardKill(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].wardKill,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].wardKill
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > WardKill > " + this.TEAM_TAG[i]).html("ワードを壊した数 : " + num[i]);
	}

	ShowTeamWardKillBar(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].wardKill,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].wardKill
		];
		
		this.ShowBar($("#team > WardKill > canvas")[0], num);
	}
	
	ShowTeamBuyVisionWard(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].buyVisionWard,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].buyVisionWard
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > BuyVisionWard > " + this.TEAM_TAG[i]).html("購入したビジョンワード数 : " + num[i]);
	}
	
	ShowTeamBuyVisionWardBar(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].buyVisionWard,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].buyVisionWard
		];
		
		this.ShowBar($("#team > BuyVisionWard > canvas")[0], num);
	}

	ShowTeamJungleCS(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].jungleMinionKill,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].jungleMinionKill
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > JungleCS > " + this.TEAM_TAG[i]).html( "ジャングルCS数 : " + num[i]);
	}
	
	ShowTeamJungleCSBar(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].jungleMinionKill,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].jungleMinionKill
		];
		
		this.ShowBar($("#team > JungleCS > canvas")[0], num);
	}

	ShowTeamMinionCS(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].minionKill,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].minionKill
		];

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > MinionCS > " + this.TEAM_TAG[i]).html("ミニオンCS数 : " + num[i]);
	}
	
	ShowTeamMinionCSBar(frame)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].minionKill,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].minionKill
		];
		
		this.ShowBar($("#team > MinionCS > canvas")[0], num);
	}

	ShowTeamJungleCSEnemy(frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].neutralMinionsKilledEnemyJungle,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].neutralMinionsKilledEnemyJungle
		];

		if( isNaN(this.TIMELINE_WORK_DATA.frame[frame].team[0].neutralMinionsKilledEnemyJungle) || isNaN(this.TIMELINE_WORK_DATA.frame[frame].team[1].neutralMinionsKilledEnemyJungle) )
			isVisible = false;

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > JungleCSEnemy > " + this.TEAM_TAG[i]).html(isVisible ? "ジャングルCS数 <br>敵サイド : " + num[i] : "");
	}
	
	ShowTeamJungleCSEnemyBar(frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].neutralMinionsKilledEnemyJungle,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].neutralMinionsKilledEnemyJungle
		];
		
		if( isNaN(this.TIMELINE_WORK_DATA.frame[frame].team[0].neutralMinionsKilledEnemyJungle) || isNaN(this.TIMELINE_WORK_DATA.frame[frame].team[1].neutralMinionsKilledEnemyJungle) )
			isVisible = false;

		this.ShowBar($("#team > JungleCSEnemy > canvas")[0], num, isVisible);
	}

	ShowTeamJungleCSTeam(frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].neutralMinionsKilledTeamJungle,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].neutralMinionsKilledTeamJungle
		];
		
		if( isNaN(this.TIMELINE_WORK_DATA.frame[frame].team[0].neutralMinionsKilledTeamJungle) || isNaN(this.TIMELINE_WORK_DATA.frame[frame].team[1].neutralMinionsKilledTeamJungle) )
			isVisible = false;

		for( let i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#team > JungleCSTeam > " + this.TEAM_TAG[i]).html(isVisible ? "ジャングルCS数 <br>自サイド : " + num[i] : "");
	}
	
	ShowTeamJungleCSTeamBar(frame, isVisible)
	{
		const num = [
			this.TIMELINE_WORK_DATA.frame[frame].team[0].neutralMinionsKilledTeamJungle,
			this.TIMELINE_WORK_DATA.frame[frame].team[1].neutralMinionsKilledTeamJungle
		];
		
		if( isNaN(this.TIMELINE_WORK_DATA.frame[frame].team[0].neutralMinionsKilledTeamJungle) || isNaN(this.TIMELINE_WORK_DATA.frame[frame].team[1].neutralMinionsKilledTeamJungle) )
			isVisible = false;
		
		this.ShowBar($("#team > JungleCSTeam > canvas")[0], num, isVisible);
	}

	////////////////////////////////////////////////////////////////////////////////////

	FloatFormat( number, n )
	{
		const _pow = Math.pow( 10 , n ) ;

		return Math.round( number * _pow ) / _pow;
	}

	////////////////////////////////////////////////////////////////////////////////////

	ChangeFrame(handle)
	{
		let self = handle.data;
		self.frame = $("#frame_slidebar").val();
		const frame = self.frame;
		self.isEndFrame = false;

		if( frame >= self.JSON_DATA_TIMELINE.frames.length )
			self.isEndFrame = true;
		
		const isEnd = self.isEndFrame;

		document.getElementById("frame").innerHTML = isEnd ? "ゲーム終了" : frame + ":00";

		self.ChangeParam(frame, isEnd);
		self.ChangeBar(frame, isEnd);
	}

	ChangeParam(frame, isEnd)
	{
		this.ShowTeamKill(frame);
		this.ShowTeamDeath(frame);
		this.ShowTeamAssist(frame);
		this.ShowTeamGold(frame);
		this.ShowTeamCS(frame);
		this.ShowTeamDragonKill(frame);
		this.ShowTeamRiftHeraldKill(frame);
		this.ShowTeamBaronKill(frame);
		this.ShowTeamTowerKill(frame);
		this.ShowTeamInhibitorKill(frame);
		this.ShowTeamWardPlace(frame);
		this.ShowTeamWardKill(frame);
		this.ShowTeamBuyVisionWard(frame);
		this.ShowTeamJungleCS(frame);
		this.ShowTeamMinionCS(frame);
		this.ShowTeamJungleCSEnemy(frame, isEnd);
		this.ShowTeamJungleCSTeam(frame, isEnd);

		for(let player_index = 1 ; player_index <= 5 ; ++player_index )
		{
			this.ShowLv(player_index, frame);
			this.ShowXp(player_index, frame, !isEnd);
			this.ShowGold(player_index, frame);
			this.ShowCS(player_index, frame);
			this.ShowMinionCS(player_index, frame);
			this.ShowJungleMinionCS(player_index, frame);
			this.ShowJungleCSEnemy(player_index, frame, isEnd);
			this.ShowJungleCSTeam(player_index, frame, isEnd);
			this.ShowKill(player_index, frame);
			this.ShowDeath(player_index, frame);
			this.ShowAssist(player_index, frame);
			this.ShowPhysicalDamageDealtToChampion(player_index, frame, isEnd);
			this.ShowPhysicalDamageDealtToPlayer(player_index, frame, isEnd);
			this.ShowMagicDamageDealtToChampion(player_index, frame, isEnd);
			this.ShowMagicDamageDealtToPlayer(player_index, frame, isEnd);
			this.ShowTrueDamageDealtToChampion(player_index, frame, isEnd);
			this.ShowTrueDamageDealtToPlayer(player_index, frame, isEnd);
			this.ShowTotalDamageDealt(player_index, frame, isEnd);
			this.ShowTotalDamageDealtToBuilding(player_index, frame, isEnd);
			this.ShowTotalDamageDealtToChampion(player_index, frame, isEnd);
			this.ShowTotalCrawdControlDamageDealt(player_index, frame, isEnd);
			this.ShowPhysicalDamageTaken(player_index, frame, isEnd);
			this.ShowMagicDamageTaken(player_index, frame, isEnd);
			this.ShowTrueDamageTaken(player_index, frame, isEnd);
			this.ShowTotalDamageTaken(player_index, frame, isEnd);
			this.ShowTotalHeal(player_index, frame, isEnd);
			this.ShowTotalHealToUnit(player_index, frame, isEnd);
			this.ShowTowerKill(player_index, frame);
			this.ShowInhibitorKill(player_index, frame);
			this.ShowDragonKill(player_index, frame);
			this.ShowRiftheraldKill(player_index, frame);
			this.ShowBaronKill(player_index, frame);
			this.ShowBuyVisionWard(player_index, frame);
			this.ShowWardPlace(player_index, frame);
			this.ShowWardPlaceWard(player_index, frame);
			this.ShowWardPlaceVision(player_index, frame);
			this.ShowWardPlaceTrinket(player_index, frame);
			this.ShowWardKill(player_index, frame);
			this.ShowWardKillWard(player_index, frame);
			this.ShowWardKillVision(player_index, frame);
			this.ShowWardKillTrinket(player_index, frame);
		}
	}

	ChangeBar(frame, isEnd)
	{
		this.ShowTeamKillBar(frame);
		this.ShowTeamDeathBar(frame);
		this.ShowTeamAssistBar(frame);
		this.ShowTeamGoldBar(frame);
		this.ShowTeamCSBar(frame);
		this.ShowTeamDragonKillBar(frame);
		this.ShowTeamRiftHeraldKillBar(frame);
		this.ShowTeamBaronKillBar(frame);
		this.ShowTeamTowerKillBar(frame);
		this.ShowTeamInhibitorKillBar(frame);
		this.ShowTeamWardPlaceBar(frame);
		this.ShowTeamWardKillBar(frame);
		this.ShowTeamBuyVisionWardBar(frame);
		this.ShowTeamJungleCSBar(frame);
		this.ShowTeamMinionCSBar(frame);
		this.ShowTeamJungleCSEnemyBar(frame, isEnd);
		this.ShowTeamJungleCSTeamBar(frame, isEnd);

		for(let player_index = 1 ; player_index <= 5 ; ++player_index )
		{
			this.ShowLvBar(player_index, frame);
			this.ShowXpBar(player_index, frame, !isEnd);
			this.ShowGoldBar(player_index, frame);
			this.ShowCSBar(player_index, frame);
			this.ShowMinionCSBar(player_index, frame, !isEnd);
			this.ShowJungleMinionCSBar(player_index, frame, !isEnd);
			this.ShowJungleCSEnemyBar(player_index, frame, isEnd);
			this.ShowJungleCSTeamBar(player_index, frame, isEnd);
			this.ShowKillBar(player_index, frame);
			this.ShowDeathBar(player_index, frame);
			this.ShowAssistBar(player_index, frame);
			this.ShowPhysicalDamageDealtToChampionBar(player_index, frame, isEnd);
			this.ShowPhysicalDamageDealtToPlayerBar(player_index, frame, isEnd);
			this.ShowMagicDamageDealtToChampionBar(player_index, frame, isEnd);
			this.ShowMagicDamageDealtToPlayerBar(player_index, frame, isEnd);
			this.ShowTrueDamageDealtToChampionBar(player_index, frame, isEnd);
			this.ShowTrueDamageDealtToPlayerBar(player_index, frame, isEnd);
			this.ShowTotalDamageDealtBar(player_index, frame, isEnd);
			this.ShowTotalDamageDealtToBuildingBar(player_index, frame, isEnd);
			this.ShowTotalDamageDealtToChampionBar(player_index, frame, isEnd);
			this.ShowTotalCrawdControlDamageDealtBar(player_index, frame, isEnd);
			this.ShowPhysicalDamageTakenBar(player_index, frame, isEnd);
			this.ShowMagicDamageTakenBar(player_index, frame, isEnd);
			this.ShowTrueDamageTakenBar(player_index, frame, isEnd);
			this.ShowTotalDamageTakenBar(player_index, frame, isEnd);
			this.ShowTotalHealBar(player_index, frame, isEnd);
			this.ShowTotalHealToUnitBar(player_index, frame, isEnd);
			this.ShowTowerKillBar(player_index, frame);
			this.ShowInhibitorKillBar(player_index, frame);
			this.ShowDragonKillBar(player_index, frame);
			this.ShowRiftheraldKillBar(player_index, frame);
			this.ShowBaronKillBar(player_index, frame);
			this.ShowBuyVisionWardBar(player_index, frame);
			this.ShowWardPlaceBar(player_index, frame);
			this.ShowWardPlaceWardBar(player_index, frame);
			this.ShowWardPlaceVisionBar(player_index, frame);
			this.ShowWardPlaceTrinketBar(player_index, frame);
			this.ShowWardKillBar(player_index, frame);
			this.ShowWardKillWardBar(player_index, frame);
			this.ShowWardKillVisionBar(player_index, frame);
			this.ShowWardKillTrinketBar(player_index, frame);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////

	ResizeBar()
	{
		if(!this.isShow)
			return;

		const isEnd = this.isEndFrame;
		const frame = this.frame;	

		this.ChangeBar(frame,isEnd);
	}

	////////////////////////////////////////////////////////////////////////////////////

	CheckLiveServer(region)
	{
		for( let i = 0 ; i < this.REGION_CODE.length ; ++i )
		{
			if( region.toUpperCase() == this.REGION_CODE[i] )
			{
				this.isLiveSever = true;
				break;
			}
		}
	}
}

let timeline = new TimeLine();
timeline.Init(location.href);

let resizeTimer;
const interval = Math.floor(1000 / 60 * 10);

$(window).on('resize', function()
{
	if (resizeTimer !== false)
		clearTimeout(resizeTimer);
  
	resizeTimer = setTimeout(function ()
	{
		timeline.ResizeBar();
	}, interval);
});
