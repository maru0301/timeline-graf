<?php

require_once('aws.phar');
use Aws\S3\S3Client;
use Aws\Common\Enum\Region;

if( !isset( $_GET['func'] ) ) return;

//-------------------------------------------------

class RiotApi
{
	private function GetS3File()
	{
		$config = [
			'version' => 'latest',
			'region' => 'ap-northeast-1', // バケットのリージョン;
			'credentials' => array(
				'key'       => '',
				'secret'    => '',
			),
		];

		$s3 = S3Client::factory($config);
		$s3->registerStreamWrapper();
		$bucket = "lol-staticdata";
		$key = "Json";
		$path = sprintf("s3://%s/%s", $bucket, $key);

		return $path;
	}

	public function GetRealm()
	{
		$json = file_get_contents('../data/json/realms.json');
		
		return $json;
	}
	
	public function GetChampionImage()
	{
		$path = $this->GetS3File();
		$json = file_get_contents($path.'/champions.json');

		return $json;
	}
	
	public function GetItem()
	{
		$json = file_get_contents('../data/json/items.json');
		
		return $json;
	}

	public function GetVersion()
	{
		$json = file_get_contents('../data/json/versions.json');
		
		return $json;
	}

	public function GetMatchDetails()
	{
		$gameRealm = $_GET['realm'];
		$gameId = $_GET['id'];
		$gameHash = $_GET['hash'];

		$url = "https://acs.leagueoflegends.com/v1/stats/game/" . $gameRealm . "/" . $gameId . "?gameHash=" . $gameHash;

		$ctx = stream_context_create(array(
			'http' => array(
			'method' => 'GET',
			'header' => 'User-Agent: Mozilla/5.0 (Windows NT 6.3; WOW64; Trident/7.0; Touch; rv:11.0) like Gecko')
			)
		);
		$json = file_get_contents($url, false, $ctx);
		
		return $json;
	}

	public function GetMatchTimeline()
	{
		$gameRealm = $_GET['realm'];
		$gameId = $_GET['id'];
		$gameHash = $_GET['hash'];

		$url = "https://acs.leagueoflegends.com/v1/stats/game/" . $gameRealm . "/" . $gameId . "/timeline?gameHash=" . $gameHash;

		$ctx = stream_context_create(array(
			'http' => array(
			'method' => 'GET',
			'header' => 'User-Agent: Mozilla/5.0 (Windows NT 6.3; WOW64; Trident/7.0; Touch; rv:11.0) like Gecko')
			)
		);

		$json = file_get_contents($url, false, $ctx);
		
		return $json;
	}
}

//-------------------------------------------------

$api = new RiotApi;

$func_tbl = array(
			"GetRealm" => "GetRealm",
			"GetChampionImage" => "GetChampionImage",
			"GetItem" => "GetItem",
			"GetVersion" => "GetVersion",
			"GetMatchDetails" => "GetMatchDetails",
			"GetMatchTimeline" => "GetMatchTimeline",
);

//-------------------------------------------------

$func_name = $_GET['func'];

echo $api->{$func_tbl[$func_name]}();

//-------------------------------------------------

?>