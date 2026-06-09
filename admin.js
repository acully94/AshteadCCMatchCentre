function saveConfig() {

  const config = {
    featuredTeam: featuredTeam.value,
    featuredOpponent: featuredOpponent.value,
    featuredScore: featuredScore.value,
    featuredOvers: featuredOvers.value,

    youtubeUrl: youtubeUrl.value,

    secondTitle: secondTitle.value,
    secondScore: secondScore.value,
    secondStatus: secondStatus.value,

    thirdTitle: thirdTitle.value,
    thirdScore: thirdScore.value,
    thirdStatus: thirdStatus.value,

    fourthTitle: fourthTitle.value,
    fourthScore: fourthScore.value,
    fourthStatus: fourthStatus.value,

    sponsorMessage: sponsorMessage.value,
    clubAnnouncement: clubAnnouncement.value
  };

  localStorage.setItem(
    "matchCentreConfig",
    JSON.stringify(config)
  );

  alert("Saved");
}