// ======================================================
// ASHTEAD MATCH CENTRE V4
// tv.js
// ======================================================

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

// ------------------------------------------------------
// Auto-scale the 1920x1080 canvas to fit any screen
// ------------------------------------------------------

function scaleScreen() {

    const screen = document.getElementById("screen");

    const scale = Math.min(
        window.innerWidth / DESIGN_WIDTH,
        window.innerHeight / DESIGN_HEIGHT
    );

    screen.style.transform = `scale(${scale})`;

}

window.addEventListener("resize", scaleScreen);
window.addEventListener("load", scaleScreen);
/* ============================================
   AUTO SCALE 1920x1080 TV LAYOUT
============================================ */

function scaleScreen() {

    const screen = document.getElementById("screen");

    if (!screen) return;

    const scale = Math.min(
    1,
    window.innerWidth / 1920,
    window.innerHeight / 1080
);

    screen.style.transform = `scale(${scale})`;

    screen.style.transformOrigin = "top left";

    screen.style.position = "absolute";

    screen.style.left =
        ((window.innerWidth - (1920 * scale)) / 2) + "px";

    screen.style.top =
        ((window.innerHeight - (1080 * scale)) / 2) + "px";

}

window.addEventListener("resize", scaleScreen);

window.addEventListener("load", scaleScreen);
// ------------------------------------------------------
// Clock
// ------------------------------------------------------

function updateClock() {

    const now = new Date();

    document.getElementById("clock").textContent =
        now.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit"
        });

    document.getElementById("date").textContent =
        now.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long"
        });

}

setInterval(updateClock, 1000);
updateClock();

// ------------------------------------------------------
// Default data
// (until Play-Cricket is connected)
// ------------------------------------------------------

const sampleData = {

    featured: {

        title: "Ashtead 1st XI v Reigate Priory",

        score: "184 / 4",

        overs: "34.2 overs",

        batterOne: "J Smith 82*",

        batterTwo: "T Brown 36*",

        bowler: "A Jones 7-0-42-1",

        youtube: ""

    },

    second: {

        title: "v Banstead",

        score: "147 / 5",

        status: "Need 88 from 96 balls"

    },

    third: {

        title: "v Leatherhead",

        score: "212 all out",

        status: "Leatherhead 58/2"

    },

    fourth: {

        title: "v Old Rutlishians",

        score: "Rain Delay",

        status: "Restart 15:20"

    },

    sponsorImage: "",

    announcement:
        "Welcome to Ashtead Cricket Club. Bar open all day. BBQ from 12:30. Junior training Sunday 9:30."

};

// ------------------------------------------------------
// Populate screen
// ------------------------------------------------------

function loadData(data) {

    document.getElementById("featuredTitle").textContent =
        data.featured.title;

    document.getElementById("featuredScore").textContent =
        data.featured.score;

    document.getElementById("featuredOvers").textContent =
        data.featured.overs;

    document.getElementById("batterOne").textContent =
        data.featured.batterOne;

    document.getElementById("batterTwo").textContent =
        data.featured.batterTwo;

    document.getElementById("bowler").textContent =
        data.featured.bowler;

    // Sidebar

    document.getElementById("match2Title").textContent =
        data.second.title;

    document.getElementById("match2Score").textContent =
        data.second.score;

    document.getElementById("match2Status").textContent =
        data.second.status;

    document.getElementById("match3Title").textContent =
        data.third.title;

    document.getElementById("match3Score").textContent =
        data.third.score;

    document.getElementById("match3Status").textContent =
        data.third.status;

    document.getElementById("match4Title").textContent =
        data.fourth.title;

    document.getElementById("match4Score").textContent =
        data.fourth.score;

    document.getElementById("match4Status").textContent =
        data.fourth.status;

    // Announcement

    document.getElementById("announcementText").textContent =
        data.announcement;

    // Sponsor

    const sponsor = document.getElementById("sponsorImage");

    if (data.sponsorImage !== "") {

        sponsor.src = data.sponsorImage;
        sponsor.style.display = "block";

    } else {

        sponsor.style.display = "none";

    }

    // YouTube

    const iframe = document.getElementById("youtubeFrame");
    const ground = document.getElementById("groundImage");

    if (data.featured.youtube !== "") {

        iframe.src = data.featured.youtube;

        iframe.style.display = "block";
        ground.style.display = "none";

    } else {

        iframe.style.display = "none";
        ground.style.display = "block";

    }

}

// ------------------------------------------------------

loadData(sampleData);

scaleScreen();
