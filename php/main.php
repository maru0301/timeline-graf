<?php

require_once('aws.phar');
use Aws\S3\S3Client;
use Aws\Common\Enum\Region;

if( !isset( $_GET['func'] ) ) return;

//-------------------------------------------------

class RiotApi
{
	//-------------------------------------------------

	const ACS_URL = 'https://acs.leagueoflegends.com/v1/stats/game/';
	
	//-------------------------------------------------

	private function GetS3Path()
	{
		$config = [
			'version' => 'latest',
			'region' => '',
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

	private function GetFileGetCtx($url)
	{
		$ctx = stream_context_create(array(
			'http' => array(
			'method' => 'GET',
			'header' => 'User-Agent: Mozilla/5.0 (Windows NT 6.3; WOW64; Trident/7.0; Touch; rv:11.0) like Gecko')
			)
		);

		$json = file_get_contents($url, false, $ctx);

		return $json;
	}

	//-------------------------------------------------

	public function GetChampions()
	{
		$path = self::GetS3Path();
		$json = file_get_contents($path.'/champions.json');

		return $json;
	}
	
	public function GetItem()
	{
		$path = self::GetS3Path();
		$json = file_get_contents($path.'/items.json');
		
		return $json;
	}

	public function GetVersion()
	{
		$path = self::GetS3Path();
		$json = file_get_contents($path.'/versions.json');
		
		return $json;
	}

	public function GetMatchDetails()
	{
		$gameRealm = $_GET['realm'];
		$gameId = $_GET['id'];
		$gameHash = $_GET['hash'];

		$url = self::ACS_URL . $gameRealm . "/" . $gameId . "?gameHash=" . $gameHash;
		$json = self::GetFileGetCtx($url);
		
		return $json;
	}

	public function GetMatchTimeline()
	{
		$gameRealm = $_GET['realm'];
		$gameId = $_GET['id'];
		$gameHash = $_GET['hash'];

		$url = self::ACS_URL . $gameRealm . "/" . $gameId . "/timeline?gameHash=" . $gameHash;
		$json = self::GetFileGetCtx($url);

		return $json;
	}
}

//-------------------------------------------------

$api = new RiotApi;

$func_tbl = array(
			"GetChampions" => "GetChampions",
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