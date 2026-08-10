// ======================================================
// ASHTEAD MATCH CENTRE V4
// tv.js
// ======================================================

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
// Config (saved from admin.html) + Play-Cricket live scores
// ------------------------------------------------------

const CONFIG_KEY = "matchCentreConfig";
const CLUB_NAME_MATCH = "ashtead";
const REFRESH_INTERVAL_MS = 30000;
const PLAY_CRICKET_MATCH_DETAIL_URL = "https://play-cricket.com/api/v2/match_detail.json";

const CARD_SLOTS = ["second", "third", "fourth"];

function getConfig() {

    try {

        const raw = localStorage.getItem(CONFIG_KEY);

        return raw ? JSON.parse(raw) : null;

    } catch (err) {

        console.warn("Match Centre: could not read saved config:", err);

        return null;

    }

}

// Layer the admin-entered manual fields on top of the built-in sample
// data. These are the fields shown until (or unless) a Play-Cricket Match
// ID is configured and a live fetch succeeds for that fixture.

function buildDataFromConfig(config) {

    const data = JSON.parse(JSON.stringify(sampleData));

    if (!config) return data;

    const featured = config.featured || {};

    if (featured.fixtureType) data.featured.fixtureType = featured.fixtureType;

    if (featured.team && featured.opponent) {
        data.featured.title = `${featured.team} v ${featured.opponent}`;
    }

    if (featured.score) data.featured.score = featured.score;
    if (featured.overs) data.featured.overs = featured.overs;
    if (featured.batterOne) data.featured.batterOne = featured.batterOne;
    if (featured.batterTwo) data.featured.batterTwo = featured.batterTwo;
    if (featured.bowler) data.featured.bowler = featured.bowler;
    if (featured.youtubeUrl) data.featured.youtube = featured.youtubeUrl;

    CARD_SLOTS.forEach((slotKey) => {

        const slot = config[slotKey];

        if (!slot) return;

        if (slot.title) data[slotKey].title = slot.title;
        if (slot.score) data[slotKey].score = slot.score;
        if (slot.status) data[slotKey].status = slot.status;

    });

    if (config.sponsorImage) data.sponsorImage = config.sponsorImage;
    if (config.announcement) data.announcement = config.announcement;

    return data;

}

// ------------------------------------------------------
// Play-Cricket live scores (best-effort — see admin.html note).
//
// NOTE: this has not been tested against a live Play-Cricket API from
// this environment (its network is sandboxed). If scores don't appear,
// open the browser console and look for "[PlayCricket]" warnings — the
// most likely causes are (a) the API rejecting cross-origin browser
// requests (CORS), which would need a small server-side proxy, or (b)
// the response field names below not matching your data. Set
// window.PLAY_CRICKET_DEBUG = true in the console to log raw responses.
// ------------------------------------------------------

async function fetchPlayCricketMatch(matchId, apiToken, siteId) {

    const params = new URLSearchParams({
        match_id: matchId,
        api_token: apiToken
    });

    if (siteId) params.set("site_id", siteId);

    const response = await fetch(`${PLAY_CRICKET_MATCH_DETAIL_URL}?${params.toString()}`);

    if (!response.ok) {
        throw new Error(`Play-Cricket API returned ${response.status}`);
    }

    const json = await response.json();
    const match = json && json.match_details && json.match_details[0];

    if (!match) {
        throw new Error("Play-Cricket response had no match_details");
    }

    if (window.PLAY_CRICKET_DEBUG) {
        console.log("[PlayCricket] raw match", matchId, match);
    }

    return match;

}

function isOurClub(name) {
    return typeof name === "string" && name.toLowerCase().includes(CLUB_NAME_MATCH);
}

function latestInnings(match) {

    if (!Array.isArray(match.innings) || match.innings.length === 0) return null;

    return match.innings[match.innings.length - 1];

}

function formatScoreLine(innings) {

    const wickets = Number(innings.wickets);

    if (Number.isFinite(wickets) && wickets >= 10) {
        return `${innings.runs} all out`;
    }

    return `${innings.runs} / ${innings.wickets}`;

}

function notOutBatters(innings) {

    if (!innings || !Array.isArray(innings.bat)) return [];

    return innings.bat
        .filter((b) => {
            const howOut = (b.how_out || "").trim().toLowerCase();
            return howOut === "" || howOut === "not out";
        })
        .slice(-2)
        .map((b) => `${b.batsman_name} ${b.runs}*`);

}

function currentBowlerLine(innings) {

    if (!innings || !Array.isArray(innings.bowl) || innings.bowl.length === 0) return "";

    const bowler = innings.bowl[innings.bowl.length - 1];

    return `${bowler.bowler_name} ${bowler.overs}-${bowler.maidens}-${bowler.runs}-${bowler.wickets}`;

}

function applyFeaturedLiveData(data, match) {

    const innings = latestInnings(match);

    if (!innings) return;

    data.featured.score = formatScoreLine(innings);

    if (innings.overs) data.featured.overs = `${innings.overs} overs`;

    const batters = notOutBatters(innings);

    if (batters[0]) data.featured.batterOne = batters[0];
    if (batters[1]) data.featured.batterTwo = batters[1];

    const bowler = currentBowlerLine(innings);

    if (bowler) data.featured.bowler = bowler;

}

function applyCardLiveData(data, slotKey, match) {

    const homeIsUs = isOurClub(match.home_club_name);
    const oppositionName = homeIsUs ? match.away_club_name : match.home_club_name;

    if (oppositionName) data[slotKey].title = `v ${oppositionName}`;

    const innings = latestInnings(match);

    if (innings) data[slotKey].score = formatScoreLine(innings);

    if (match.status) data[slotKey].status = match.status;

}

async function refreshLiveScores(config, data) {

    const apiToken = config && config.playCricket && config.playCricket.apiToken;

    if (!apiToken) return data;

    const siteId = config.playCricket.siteId;
    const jobs = [];

    if (config.featured && config.featured.matchId) {

        jobs.push(
            fetchPlayCricketMatch(config.featured.matchId, apiToken, siteId)
                .then((match) => applyFeaturedLiveData(data, match))
                .catch((err) => console.warn("[PlayCricket] featured match fetch failed:", err.message))
        );

    }

    CARD_SLOTS.forEach((slotKey) => {

        const slot = config[slotKey];

        if (!slot || !slot.matchId) return;

        jobs.push(
            fetchPlayCricketMatch(slot.matchId, apiToken, siteId)
                .then((match) => applyCardLiveData(data, slotKey, match))
                .catch((err) => console.warn(`[PlayCricket] ${slotKey} match fetch failed:`, err.message))
        );

    });

    await Promise.all(jobs);

    return data;

}

// ------------------------------------------------------
// Default data
// (used until admin.html config and/or Play-Cricket data override it)
// ------------------------------------------------------

const sampleData = {

    featured: {

        fixtureType: "1ST XI • HOME",

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

    document.getElementById("fixtureType").textContent =
        data.featured.fixtureType;

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
// Boot + refresh loop
// ------------------------------------------------------

async function refreshAndRender() {

    const config = getConfig();
    const data = buildDataFromConfig(config);

    await refreshLiveScores(config, data);

    loadData(data);

}

refreshAndRender();

setInterval(refreshAndRender, REFRESH_INTERVAL_MS);

scaleScreen();
