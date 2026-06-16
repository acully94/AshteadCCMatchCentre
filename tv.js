async function loadConfig() {

  const response =
    await fetch("data/config.json");

  const config =
    await response.json();

  featuredTitle.textContent =
    `${config.featuredMatch.team} vs ${config.featuredMatch.opponent}`;

  featuredScore.textContent =
    config.featuredMatch.score;

  featuredOvers.textContent =
    `${config.featuredMatch.overs} overs`;

  match2Title.textContent =
    config.matches[0].opponent;

  match2Score.textContent =
    config.matches[0].score;

  match2Status.textContent =
    config.matches[0].status;

  match3Title.textContent =
    config.matches[1].opponent;

  match3Score.textContent =
    config.matches[1].score;

  match3Status.textContent =
    config.matches[1].status;

  match4Title.textContent =
    config.matches[2].opponent;

  match4Score.textContent =
    config.matches[2].score;

  match4Status.textContent =
    config.matches[2].status;

  let announcementIndex = 0;

  announcementText.textContent =
    config.announcements[0];

  setInterval(() => {

    announcementIndex++;

    if(
      announcementIndex >=
      config.announcements.length
    ){
      announcementIndex = 0;
    }

    announcementText.textContent =
      config.announcements[
        announcementIndex
      ];

  },10000);

  if(
    config.sponsors &&
    config.sponsors.length
  ){

    let sponsorIndex = 0;

    sponsorImage.src =
      config.sponsors[0];

    setInterval(() => {

      sponsorIndex++;

      if(
        sponsorIndex >=
        config.sponsors.length
      ){
        sponsorIndex = 0;
      }

      sponsorImage.src =
        config.sponsors[sponsorIndex];

    },15000);

  }

  if(
    config.featuredMatch.youtubeUrl &&
    config.featuredMatch.youtubeUrl.length
  ){

    groundImage.style.display =
      "none";

    youtubeFrame.style.display =
      "block";

    youtubeFrame.src =
      config.featuredMatch.youtubeUrl;

  }

}

loadConfig();

function updateClock(){

  const now = new Date();

  date.textContent =
    now.toLocaleDateString("en-GB");

  clock.textContent =
    now.toLocaleTimeString("en-GB");
}

updateClock();

setInterval(updateClock,1000);
