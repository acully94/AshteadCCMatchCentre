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

const SLOT_IDS = ["slot1", "slot2", "slot3", "slot4"];
const SIDE_CARD_KEYS = ["second", "third", "fourth"];

function getConfig() {

    try {

        const raw = localStorage.getItem(CONFIG_KEY);

        return raw ? JSON.parse(raw) : null;

    } catch (err) {

        console.warn("Match Centre: could not read saved config:", err);

        return null;

    }

}

// ------------------------------------------------------
// Default data
// (used until admin.html config and/or Play-Cricket data override it)
// ------------------------------------------------------

const sampleData = {

    featuredSlotId: "slot1",

    featuredIsLiveStream: false,

    featuredYoutubeUrl: "",

    slots: {

        slot1: {
            teamName: "1st XI",
            fixtureType: "1ST XI • HOME",
            opponent: "Reigate Priory",
            score: "184 / 4",
            overs: "34.2 overs",
            status: "",
            batterOne: "J Smith 82*",
            batterTwo: "T Brown 36*",
            bowler: "A Jones 7-0-42-1"
        },

        slot2: {
            teamName: "2nd XI",
            fixtureType: "",
            opponent: "Banstead",
            score: "147 / 5",
            overs: "",
            status: "Need 88 from 96 balls",
            batterOne: "",
            batterTwo: "",
            bowler: ""
        },

        slot3: {
            teamName: "3rd XI",
            fixtureType: "",
            opponent: "Leatherhead",
            score: "212 all out",
            overs: "",
            status: "Leatherhead 58/2",
            batterOne: "",
            batterTwo: "",
            bowler: ""
        },

        slot4: {
            teamName: "4th XI",
            fixtureType: "",
            opponent: "Old Rutlishians",
            score: "Rain Delay",
            overs: "",
            status: "Restart 15:20",
            batterOne: "",
            batterTwo: "",
            bowler: ""
        }

    },

    announcements: [
        "Welcome to Ashtead Cricket Club",
        "Bar open all day",
        "BBQ from 12:30",
        "Junior training Sunday 9:30"
    ],

    sponsorImages: []

};

// Layer the admin-entered manual fields on top of the built-in sample
// data. These are the fields shown until (or unless) a Play-Cricket Match
// ID is configured and a live fetch succeeds for that fixture.

function buildDataFromConfig(config) {

    const data = JSON.parse(JSON.stringify(sampleData));

    if (!config) return data;

    if (config.featuredSlotId) data.featuredSlotId = config.featuredSlotId;

    data.featuredIsLiveStream = !!config.featuredIsLiveStream;
    if (config.featuredYoutubeUrl) data.featuredYoutubeUrl = config.featuredYoutubeUrl;

    SLOT_IDS.forEach((slotId) => {

        const slot = config.slots && config.slots[slotId];

        if (!slot) return;

        const target = data.slots[slotId];

        if (slot.teamName) target.teamName = slot.teamName;
        if (slot.fixtureType) target.fixtureType = slot.fixtureType;
        if (slot.opponent) target.opponent = slot.opponent;
        if (slot.score) target.score = slot.score;
        if (slot.overs) target.overs = slot.overs;
        if (slot.status) target.status = slot.status;
        if (slot.batterOne) target.batterOne = slot.batterOne;
        if (slot.batterTwo) target.batterTwo = slot.batterTwo;
        if (slot.bowler) target.bowler = slot.bowler;

    });

    if (Array.isArray(config.announcements) && config.announcements.length > 0) {
        data.announcements = config.announcements;
    }

    if (Array.isArray(config.sponsorImages)) {
        data.sponsorImages = config.sponsorImages;
    }

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

// Applies live data to a slot. `detailed` also fills batting/bowling —
// used for whichever slot is currently featured.

function applySlotLiveData(slot, match, detailed) {

    const homeIsUs = isOurClub(match.home_club_name);
    const oppositionName = homeIsUs ? match.away_club_name : match.home_club_name;

    if (oppositionName) slot.opponent = oppositionName;

    const innings = latestInnings(match);

    if (innings) {

        slot.score = formatScoreLine(innings);

        if (detailed) {

            if (innings.overs) slot.overs = `${innings.overs} overs`;

            const batters = notOutBatters(innings);

            if (batters[0]) slot.batterOne = batters[0];
            if (batters[1]) slot.batterTwo = batters[1];

            const bowler = currentBowlerLine(innings);

            if (bowler) slot.bowler = bowler;

        }

    }

    if (match.status) slot.status = match.status;

}

async function refreshLiveScores(config, data) {

    const apiToken = config && config.playCricket && config.playCricket.apiToken;

    if (!apiToken) return data;

    const siteId = config.playCricket.siteId;
    const jobs = [];

    SLOT_IDS.forEach((slotId) => {

        const configSlot = config.slots && config.slots[slotId];

        if (!configSlot || !configSlot.matchId) return;

        const isFeatured = slotId === data.featuredSlotId;

        jobs.push(
            fetchPlayCricketMatch(configSlot.matchId, apiToken, siteId)
                .then((match) => applySlotLiveData(data.slots[slotId], match, isFeatured))
                .catch((err) => console.warn(`[PlayCricket] ${slotId} match fetch failed:`, err.message))
        );

    });

    await Promise.all(jobs);

    return data;

}

// ------------------------------------------------------
// Populate screen
// ------------------------------------------------------

function loadData(data) {

    const featured = data.slots[data.featuredSlotId] || data.slots.slot1;

    document.getElementById("fixtureType").textContent = featured.fixtureType;

    document.getElementById("featuredTitle").textContent =
        featured.opponent ? `${featured.teamName} v ${featured.opponent}` : featured.teamName;

    document.getElementById("featuredScore").textContent = featured.score;

    document.getElementById("featuredOvers").textContent = featured.overs;

    document.getElementById("batterOne").textContent = featured.batterOne;

    document.getElementById("batterTwo").textContent = featured.batterTwo;

    document.getElementById("bowler").textContent = featured.bowler;

    // Live stream mode: the stream itself (e.g. Frogbox overlay) shows the
    // score, so hide our own score/batting overlay and just show the video.

    const featuredFooter = document.querySelector(".featured-footer");
    const iframe = document.getElementById("youtubeFrame");
    const ground = document.getElementById("groundImage");

    const showStream = data.featuredIsLiveStream && data.featuredYoutubeUrl;

    if (showStream) {

        iframe.src = data.featuredYoutubeUrl;
        iframe.style.display = "block";
        ground.style.display = "none";

    } else {

        iframe.style.display = "none";
        ground.style.display = "block";

    }

    featuredFooter.style.display = data.featuredIsLiveStream ? "none" : "flex";

    // Sidebar: whichever slots are not currently featured, in order

    const sideSlotIds = SLOT_IDS.filter((id) => id !== data.featuredSlotId);

    sideSlotIds.forEach((slotId, index) => {

        const slot = data.slots[slotId];
        const cardKey = SIDE_CARD_KEYS[index];
        const num = index + 2; // matches existing DOM ids match2/3/4

        document.getElementById(`cardName${num}`).textContent = slot.teamName;

        document.getElementById(`match${num}Title`).textContent =
            slot.opponent ? `v ${slot.opponent}` : "";

        document.getElementById(`match${num}Score`).textContent = slot.score;

        document.getElementById(`match${num}Status`).textContent = slot.status;

    });

    renderAnnouncements(data.announcements);
    renderSponsors(data.sponsorImages);

}

// ------------------------------------------------------
// Scrolling marquees (club news + sponsors)
// ------------------------------------------------------

const MARQUEE_SPEED_PX_PER_SEC = 70;
const MARQUEE_MIN_DURATION_SEC = 10;

function buildMarqueeTrack(trackEl, items, appendItem) {

    trackEl.textContent = "";

    if (!items || items.length === 0) {
        trackEl.style.animation = "none";
        return;
    }

    for (let copy = 0; copy < 2; copy++) {

        items.forEach((item) => {

            appendItem(trackEl, item);

            const separator = document.createElement("span");
            separator.className = "marquee-separator";
            separator.textContent = "•";
            trackEl.appendChild(separator);

        });

    }

    trackEl.style.animation = "";

    const halfWidth = trackEl.scrollWidth / 2;
    const duration = Math.max(halfWidth / MARQUEE_SPEED_PX_PER_SEC, MARQUEE_MIN_DURATION_SEC);

    trackEl.style.animationDuration = `${duration}s`;

}

function renderAnnouncements(announcements) {

    const track = document.getElementById("announcementTrack");

    buildMarqueeTrack(track, announcements, (el, text) => {

        const span = document.createElement("span");
        span.textContent = text;
        el.appendChild(span);

    });

}

function renderSponsors(sponsorImages) {

    const sponsorPanel = document.getElementById("sponsorPanel");
    const bottomPanels = document.getElementById("bottomPanels");
    const track = document.getElementById("sponsorTrack");

    if (!sponsorImages || sponsorImages.length === 0) {

        sponsorPanel.style.display = "none";
        bottomPanels.style.gridTemplateColumns = "1fr";

        return;

    }

    sponsorPanel.style.display = "flex";
    bottomPanels.style.gridTemplateColumns = "420px 1fr";

    buildMarqueeTrack(track, sponsorImages, (el, src) => {

        const img = document.createElement("img");
        img.src = src;
        img.alt = "Sponsor";
        el.appendChild(img);

    });

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
