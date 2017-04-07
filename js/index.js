function CreateTimeLine(url)
{
	if(url !== "")
	{
//		var data = url.split("?")[1];
//		var text = data.split("=")[1];
//		var url = decodeURIComponent(text);

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

		location.href = "next.html?data="+encodeURIComponent(gameRealm+"&"+gameId+"&"+gameHash);
	}
}