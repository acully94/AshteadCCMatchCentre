const config =
  JSON.parse(
    localStorage.getItem("matchCentreConfig")
  ) || {};

featuredTitle.innerText =
  `${config.featuredTeam || "Ashtead 1st XI"} vs ${config.featuredOpponent || "Opponent"}`;

featuredScore.innerText =
  config.featuredScore || "184/4";

featuredOvers.innerText =
  config.featuredOvers || "34.2 overs";

secondTitle.innerText = config.secondTitle || "";
secondScore.innerText = config.secondScore || "";
secondStatus.innerText = config.secondStatus || "";

thirdTitle.innerText = config.thirdTitle || "";
thirdScore.innerText = config.thirdScore || "";
thirdStatus.innerText = config.thirdStatus || "";

fourthTitle.innerText = config.fourthTitle || "";
fourthScore.innerText = config.fourthScore || "";
fourthStatus.innerText = config.fourthStatus || "";

sponsorMessage.innerText =
  config.sponsorMessage || "";

clubAnnouncement.innerText =
  config.clubAnnouncement || "";

if(config.youtubeUrl){
  youtubeFrame.src = config.youtubeUrl;
}

function updateClock() {

  const now = new Date();

  date.innerText =
    now.toLocaleDateString('en-GB');

  clock.innerText =
    now.toLocaleTimeString('en-GB');
}

updateClock();
setInterval(updateClock,1000);