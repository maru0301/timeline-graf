<?php

if( !isset( $_GET['func'] ) ) return;

//-------------------------------------------------

class RiotApi
{
	private $api_key = '';
	
	private function GetJson( $url )
	{
		$master_url = $url . $this->api_key;
		$json = file_get_contents($master_url);

		return $json;
	}
	
	public function GetRealm()
	{
		$json = $this->GetJson('https://na1.api.riotgames.com/lol/static-data/v3/realms?api_key=');
		
		return $json;
	}
	
	public function GetChampionImage()
	{
		$version = $_GET['ver'];
		
		$json = $this->GetJson('https://na1.api.riotgames.com/lol/static-data/v3/champions?champListData=image&version=' . $version . '&api_key=');
		
		return $json;
	}
	
	public function GetSummonerSpells()
	{
		$version = $_GET['ver'];
		$json = $this->GetJson('https://na1.api.riotgames.com/lol/static-data/v3/summoner-spells?spellData=image&version=' . $version . '&api_key=');
		
		return $json;
	}
	
	public function GetItem()
	{
		$version = $_GET['ver'];
		$json = $this->GetJson('https://na1.api.riotgames.com/lol/static-data/v3/items?version=' . $version . '&itemListData=all&api_key=');
		
		return $json;
	}
	
	public function GetMasteryImage()
	{
		$version = $_GET['ver'];
		$json = $this->GetJson('https://na1.api.riotgames.com/lol/static-data/v3/masteries?version=' . $version . '&masteryListData=image&api_key=');
		
		return $json;
	}

	public function GetMatchDetails()
	{
		$gameRealm = $_GET['realm'];
		$gameId = $_GET['id'];
		$gameHash = $_GET['hash'];

		$url = "https://acs.leagueoflegends.com/v1/stats/game/" . $gameRealm . "/" . $gameId . "?gameHash=" . $gameHash;

		$json = file_get_contents($url);
		
		return $json;
	}

	public function GetMatchTimeline()
	{
		$gameRealm = $_GET['realm'];
		$gameId = $_GET['id'];
		$gameHash = $_GET['hash'];

		$url = "https://acs.leagueoflegends.com/v1/stats/game/" . $gameRealm . "/" . $gameId . "/timeline?gameHash=" . $gameHash;

		$json = file_get_contents($url);
		
		return $json;
	}
	
	public function GetVersion()
	{
		$json = $this->GetJson('https://global.api.pvp.net/api/lol/static-data/JP/v1.2/versions?api_key=');
		
		return $json;
	}
}

//-------------------------------------------------

$api = new RiotApi;

$func_tbl = array(
			"GetRealm" => "GetRealm",
			"GetChampionImage" => "GetChampionImage",
			"GetSummonerSpells" => "GetSummonerSpells",
			"GetItem" => "GetItem",
			"GetMasteryImage" => "GetMasteryImage",
			"GetMatchDetails" => "GetMatchDetails",
			"GetMatchTimeline" => "GetMatchTimeline",
			"GetVersion" => "GetVersion",
);

//-------------------------------------------------

$func_name = $_GET['func'];

echo $api->{$func_tbl[$func_name]}();

//-------------------------------------------------

?>