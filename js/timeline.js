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
		this.ERROR_ID_MASTERY_IMG_GET_ERROR 		= "マスタリーイメージ情報が取得出来ませんでした";
		this.ERROR_ID_MATCH_DETAILS_GET_ERROR	= "試合情報が取得出来ませんでした";
		this.ERROR_ID_MATCH_TIMELINE_GET_ERROR	= "タイムライン情報が取得出来ませんでした";

		this.VERSION = "";
		this.CDN_URL = "";

		this.JSON_DATA_MATCHDETAIL = {};
		this.JSON_DATA_TIMELINE = {};
		this.JSON_DATA_CHAMP_IMG = new Array();
		this.JSON_DATA_SPELL_IMG = new Array();
		this.JSON_DATA_ITEM_IMG = new Array();
		this.JSON_DATA_MASTERY_IMG = new Array();

		this.CANVAS_CHAMPION_IMG = new Array();
		this.CANVAS_MAP_IMG = "";

		this.TEAM_TAG = [ "blue", "red" ];

		this.TIMELINE_WORK_DATA = {};
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
		index = url.search('[\?]');

		var gameId = url.substr(0, index);

		url = url.substr(index+1);
		index = url.search('=');
		url = url.substr(index+1);
		index = url.search('&');

		if( index != -1 )
			url = url.substr(0, index);

		var gameHash = url;

		var request = [
			{ error_id: this.ERROR_ID_MATCH_DETAILS_GET_ERROR,	url: './php/main.php', data: { func:"GetMatchDetails", realm:gameRealm, id:gameId, hash:gameHash },  },
			{ error_id: this.ERROR_ID_MATCH_TIMELINE_GET_ERROR,	url: './php/main.php', data: { func:"GetMatchTimeline", realm:gameRealm, id:gameId, hash:gameHash },  },
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
						case "ITEM_PURCHASED" :
						case "ITEM_DESTROYED" :
						case "ITEM_SOLD" :
						case "ITEM_UNDO" :
						case "SKILL_LEVEL_UP" :
						case "WARD_PLACED" :
						case "WARD_KILL" :
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
			{ error_id: this.ERROR_ID_SUMMONER_SPELL_GET_ERROR,	url: './php/main.php', data: { func:"GetSummonerSpells", ver:this.VERSION },  },
			{ error_id: this.ERROR_ID_ITEM_IMG_GET_ERROR,		url: './php/main.php', data: { func:"GetItem", ver:this.VERSION },  },
			{ error_id: this.ERROR_ID_MASTERY_IMG_GET_ERROR,	url: './php/main.php', data: { func:"GetMasteryImage", ver:this.VERSION },  },
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
			var spellJson = json[2];
			var itemImgJson = json[3];
			var masteryImgJson = json[4];

			var championImgData = new Array();
			var spellImgData = new Array();
			var itemImgImgData = new Array();
			var masteryImgData = new Array();

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

			self.CDN_URL = realmJson.cdn;

			// ReworkJson();
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
			{	name:"CS",				isCanvas:true	},
			{	name:"Kill",			isCanvas:true	},
/*			{	name:"Death",			isCanvas:true	},
			{	name:"Assist",			isCanvas:true	},
*/
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
//				player_target.innerHTML = player_target.innerHTML + "<br>";
			}
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
			this.TIMELINE_WORK_DATA.frame[i].team = {};
//			this.TIMELINE_WORK_DATA.frame[i].events = [];

//			this.TIMELINE_WORK_DATA.frame[i].events = this.JSON_DATA_TIMELINE.frames[i].events;

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
			}
		}

		this.TIMELINE_WORK_DATA.frame[this.JSON_DATA_TIMELINE.frames.length] = {};
		this.TIMELINE_WORK_DATA.frame[this.JSON_DATA_TIMELINE.frames.length].player = [];

		for( var j = 0, index = 1 ; j < detailData.teams.length ; ++j )
		{
			for( var k = 0 ; k < detailData.teams[j].player.length ; ++k, ++index )
				this.TIMELINE_WORK_DATA.frame[this.JSON_DATA_TIMELINE.frames.length].player[index] = detailData.teams[j].player[k];
		}

		this.TIMELINE_WORK_DATA.frame[this.JSON_DATA_TIMELINE.frames.length].team = $.extend(true, {}, detailData.teams);
		delete this.TIMELINE_WORK_DATA.frame[this.JSON_DATA_TIMELINE.frames.length].team["player"];
		// this.TIMELINE_WORK_DATA.frame[this.JSON_DATA_TIMELINE.frames.length].team[1].player = undefined;

		for( var i = 0 ; i < this.JSON_DATA_TIMELINE.frames.length ; ++i )
		{
			for( var j = 0 ; j < this.JSON_DATA_TIMELINE.frames[i].events.length ; ++j )
			{
	//			var index = 
	//			this.TIMELINE_WORK_DATA.frame[i].player[index] =
				var isEnd = i == (this.JSON_DATA_TIMELINE.frames.length-1);

				switch(this.JSON_DATA_TIMELINE.frames[i].events[j].type)
				{
					case "CHAMPION_KILL":
						if(isEnd)
							break;
						
						var set_work_frame = this.TIMELINE_WORK_DATA.frame[i+1];
						var now_work_frame = this.TIMELINE_WORK_DATA.frame[i];
						var killerId = this.JSON_DATA_TIMELINE.frames[i].events[j].killerId;
						var deathId = this.JSON_DATA_TIMELINE.frames[i].events[j].victimId;
						var assisteId = this.JSON_DATA_TIMELINE.frames[i].events[j].assistingParticipantIds;

						set_work_frame.player[killerId].kill = set_work_frame.player[killerId].kill + now_work_frame.player[killerId].kill + 1;
						set_work_frame.player[deathId].death = set_work_frame.player[deathId].death + now_work_frame.player[deathId].death + 1;
						for( var k = 0 ; k < assisteId.length ; ++k )
							set_work_frame.player[assisteId[k]].assiste = set_work_frame.player[assisteId[k]].assiste + now_work_frame.player[assisteId[k]].assiste + 1;

						for( var k = i+2 ; k < (this.TIMELINE_WORK_DATA.frame.length - 1) ; ++k )
						{
							this.TIMELINE_WORK_DATA.frame[k].player[killerId].kill = set_work_frame.player[killerId].kill;
							this.TIMELINE_WORK_DATA.frame[k].player[deathId].death = set_work_frame.player[deathId].death;

							for( var l = 0 ; l < assisteId.length ; ++l )
								set_work_frame.player[assisteId[l]].assiste = set_work_frame.player[assisteId[l]].assiste + now_work_frame.player[assisteId[l]].assiste + 1;
						}
						break;
					default :
						console.log(this.JSON_DATA_TIMELINE.frames[i].events[j].type);
						break;
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

	GetCS(player_index, frame)
	{
		var cs = [];

		if( this.TIMELINE_WORK_DATA.frame.length-1 < frame )
		{
			cs[0] = this.JSON_DATA_MATCHDETAIL.teams[0].player[player_index-1].cs;
			cs[1] = this.JSON_DATA_MATCHDETAIL.teams[1].player[player_index-1].cs;
		}
		else
		{
			cs[0] = this.TIMELINE_WORK_DATA.frame[frame].player[player_index-1].jungleMinionsKilled + this.TIMELINE_WORK_DATA.frame[frame].player[player_index-1].minionsKilled;
			cs[1] = this.TIMELINE_WORK_DATA.frame[frame].player[player_index+4].jungleMinionsKilled + this.TIMELINE_WORK_DATA.frame[frame].player[player_index-1].minionsKilled;
		}

		return cs;
	}

	GetLv(player_index, frame)
	{
		var lv = [];

		if( this.TIMELINE_WORK_DATA.frame.length-1 < frame )
		{
			lv[0] = this.JSON_DATA_MATCHDETAIL.teams[0].player[player_index-1].lv;
			lv[1] = this.JSON_DATA_MATCHDETAIL.teams[1].player[player_index-1].lv;
		}
		else
		{
			lv[0] = this.TIMELINE_WORK_DATA.frame[frame].player[player_index-1].level;
			lv[1] = this.TIMELINE_WORK_DATA.frame[frame].player[player_index+4].level;
		}

		return lv;
	}

	GetXp(player_index, frame)
	{
		var xp = [];

		if( this.TIMELINE_WORK_DATA.frame.length-1 < frame )
		{
			xp[0] = -1;
			xp[1] = -1;
		}
		else
		{
			xp[0] = this.TIMELINE_WORK_DATA.frame[frame].player[player_index-1].xp;
			xp[1] = this.TIMELINE_WORK_DATA.frame[frame].player[player_index+4].xp;
		}

		return xp;
	}

	GetKill(player_index, frame)
	{
		var num = [];

		if( this.TIMELINE_WORK_DATA.frame.length-1 < frame )
		{
			num[0] = this.JSON_DATA_MATCHDETAIL.teams[0].player[player_index-1].kill;
			num[1] = this.JSON_DATA_MATCHDETAIL.teams[1].player[player_index-1].kill;
		}
		else
		{
			num[0] = this.TIMELINE_WORK_DATA.frame[frame].player[player_index-1].kills;
			num[1] = this.TIMELINE_WORK_DATA.frame[frame].player[player_index+4].kills;
		}

		return num;
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
			//tag = "";
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
		var cs = this.GetCS(player_index, frame);

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > CS > " + this.TEAM_TAG[i]).html("CS : " + cs[i]);
	}

	ShowCSBar(player_index, frame)
	{
		var cs = this.GetCS(player_index , frame);

		var cs_blue = cs[0];
		var cs_red = cs[1];
		var per = cs_blue / ( cs_blue + cs_red );
		
		this.ShowBar($("#player > player"+ player_index +" > CS > canvas")[0], per);
	}

	ShowLv(player_index, frame)
	{
		var lv = this.GetLv(player_index, frame);

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > Lv > " + this.TEAM_TAG[i]).html("Lv : " + lv[i]);
	}

	ShowLvBar(player_index, frame)
	{
		var lv = this.GetLv(player_index , frame);

		var lv_blue = lv[0];
		var lv_red = lv[1];
		var per = lv_blue / ( lv_blue + lv_red );
		
		this.ShowBar($("#player > player"+ player_index +" > Lv > canvas")[0], per);
	}

	ShowXp(player_index, frame, isVisible)
	{
		var xp = this.GetXp(player_index, frame );

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > Xp > " + this.TEAM_TAG[i]).html(isVisible ? "Xp : " + xp[i] : "");
	}

	ShowXpBar(player_index, frame, isVisible)
	{
		var xp = this.GetXp(player_index , frame);

		var xp_blue = xp[0];
		var xp_red = xp[1];
		var per = xp_blue / ( xp_blue + xp_red );
		
		this.ShowBar($("#player > player"+ player_index +" > Xp > canvas")[0], per, isVisible);
	}

	ShowKill(player_index, frame, isVisible)
	{
		var num = this.GetKill(player_index, frame );

		for( var i = 0 ; i < this.TEAM_TAG.length ; ++i )
			$("#player > player"+ player_index + " > Kill > " + this.TEAM_TAG[i]).html(isVisible ? "Kill : " + num[i] : "");
	}

	ShowKillBar(player_index, frame, isVisible)
	{
		var num = this.GetKill(player_index , frame);

		var num_blue = num[0];
		var num_red = num[1];

		if(num[0] == 0 && num[1] == 0)
		{
			num_blue = 1;
			num_red = 1;
		}

		var per = num_blue / ( num_blue + num_red );
		
		this.ShowBar($("#player > player"+ player_index +" > Kill > canvas")[0], per, isVisible);
	}

	ShowBar(target, x, isVisible = true)
	{
		var ctx = target.getContext('2d');
		if( isVisible )
		{
			target.width = window.innerWidth;
			target.height = 20;

			ctx.save();
			ctx.font = "16px Arial";
	//		ctx.font = "italic bold 18px 'ＭＳ Ｐゴシック'";
			ctx.textAlign = 'center';

			ctx.beginPath();
			ctx.fillStyle = 'rgb(0, 0, 255)'; // blue
			var blue_width = target.width * x;
			ctx.fillRect(0, 0, blue_width, target.height);

			ctx.beginPath();
			ctx.fillStyle = 'rgb(255, 0, 0)'; // red
			var red_width = target.width - blue_width;
			ctx.fillRect(blue_width, 0, red_width, target.height);

			ctx.beginPath();
			ctx.fillStyle = 'rgb(255, 255, 255)';
			var blue_par = this.FloatFormat(x * 100, 1);
			var text_b = blue_par + "%";
			ctx.beginPath();
			ctx.fillText(text_b, Math.floor(blue_width/2), 16);
			var red_par = 100 - blue_par;
			var text_r = red_par + "%";
			ctx.fillText(text_r, Math.floor(blue_width + (red_width/2)), 16);

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
		
		document.getElementById("frame").innerHTML = isEnd ? "End Game" : frame+":00";

		for( var i = 1 ; i <= 5 ; ++i )
		{
			self.ShowLv(i, frame);
			self.ShowLvBar(i, frame);
			self.ShowXp(i, frame, !isEnd);
			self.ShowXpBar(i, frame, !isEnd);
			self.ShowCS(i, frame);
			self.ShowCSBar(i, frame);
			self.ShowKill(i, frame, isEnd);
			self.ShowKillBar(i, frame, isEnd);
		}
	}
}

var timeline = new TimeLine();
timeline.Init(location.href);