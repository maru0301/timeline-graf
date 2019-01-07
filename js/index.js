function CreateTimeLine(url)
{
	if(url !== "")
	{
		let index = url.search("#");
		url = url.substr(index);
		index = url.search("/");
		url = url.substr(index+1);
		index = url.search("/");

		let gameRealm = url.substr(0, index);

		url = url.substr(index+1);
		let isGameHash = url.search('gameHash') != -1;

		if( isGameHash )
			index = url.search('[\?]');
		else
			index = url.search("/");
		
		const gameId = url.substr(0, index);

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

		const gameHash = url;

		location.href = "next.html?data="+encodeURIComponent(gameRealm+"&"+gameId+"&"+gameHash);
	}
}