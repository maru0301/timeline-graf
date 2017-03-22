function CreateTimeLine(url)
{
	if(url !== "")
	{
		location.href = "next.html?data="+encodeURIComponent(url);
	}
}