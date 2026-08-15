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
// Config (saved from admin.html)
// ------------------------------------------------------

const CONFIG_KEY = "matchCentreConfig";
const REFRESH_INTERVAL_MS = 30000;
const SCORECARD_POLL_INTERVAL_MS = 5000;
const CLUB_NAME_MATCH = "ashtead";

const SLOT_IDS = ["slot1", "slot2", "slot3", "slot4"];

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
// (used until admin.html config overrides it)
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

    sponsors: [],

    sponsorImageHeight: 64

};

// Layer the admin-entered manual fields on top of the built-in sample data.

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

    if (Array.isArray(config.sponsors)) {
        data.sponsors = config.sponsors;
    }

    if (config.sponsorImageHeight) {
        data.sponsorImageHeight = config.sponsorImageHeight;
    }

    return data;

}

function buildLiveScorecardConfig(config) {

    if (!config || !config.scorecardProxyUrl) return null;

    const slots = {};

    SLOT_IDS.forEach((slotId) => {

        const slot = config.slots && config.slots[slotId];

        if (slot && slot.matchId) slots[slotId] = slot.matchId;

    });

    if (Object.keys(slots).length === 0) return null;

    return { proxyUrl: normalizeProxyUrl(config.scorecardProxyUrl), slots };

}

// Tolerate a proxy URL pasted without "https://" — otherwise the browser
// treats it as relative to the current page and the fetch silently fails.

function normalizeProxyUrl(url) {

    const trimmed = (url || "").trim();

    if (!trimmed || /^https?:\/\//i.test(trimmed)) return trimmed;

    return `https://${trimmed}`;

}

// ------------------------------------------------------
// Live scorecard polling (via the scorecard proxy — see
// scorecard-proxy-worker.js for what it does and why it's needed).
// ------------------------------------------------------

async function fetchLiveScorecard(proxyUrl, matchId) {

    const separator = proxyUrl.includes("?") ? "&" : "?";
    const url = `${proxyUrl}${separator}matchId=${encodeURIComponent(matchId)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Scorecard proxy returned ${response.status}`);
    }

    return response.json();

}

function isOurClub(name) {
    return typeof name === "string" && name.toLowerCase().includes(CLUB_NAME_MATCH);
}

function cleanPlayerName(name) {
    return (name || "").replace(/[*†]+$/g, "").trim();
}

function latestInnings(scorecard) {

    const innings = scorecard.Innings;

    if (!Array.isArray(innings) || innings.length === 0) return null;

    return innings[innings.length - 1];

}

function formatInningsScore(innings) {

    if (innings.TotalWickets >= 10) {
        return `${innings.TotalRuns} all out`;
    }

    return `${innings.TotalRuns} / ${innings.TotalWickets}`;

}

function activeBatters(innings) {

    if (!innings || !Array.isArray(innings.BattingCard)) return [];

    return innings.BattingCard
        .filter((b) => !b.IsSummary && (b.IsFirstActive || b.IsSecondActive))
        .map((b) => `${cleanPlayerName(b.PlayerName)} ${b.Runs}*`);

}

function currentBowlerLine(innings) {

    if (!innings || !Array.isArray(innings.BowlingCard)) return "";

    const bowler = innings.BowlingCard.find((b) => b.IsCurrentBowler);

    if (!bowler) return "";

    return `${cleanPlayerName(bowler.PlayerName)} ${bowler.Overs}-${bowler.Maidens}-${bowler.Runs}-${bowler.Wickets}`;

}

// Applies a live scorecard to a slot. `detailed` also fills batting/
// bowling — used for whichever slot is currently featured.

function applyLiveScorecard(slot, scorecard, detailed) {

    const match = scorecard.Match;

    if (!match) return;

    const homeIsUs = isOurClub(match.Team1Club || match.Team1Name);
    const oppositionName = homeIsUs
        ? (match.Team2Name || match.Team2Club)
        : (match.Team1Name || match.Team1Club);

    if (oppositionName) slot.opponent = oppositionName;

    const innings = latestInnings(scorecard);

    if (innings) {

        slot.score = formatInningsScore(innings);

        if (detailed) {

            if (innings.TotalOvers) slot.overs = `${innings.TotalOvers} overs`;

            const batters = activeBatters(innings);

            if (batters[0]) slot.batterOne = batters[0];
            if (batters[1]) slot.batterTwo = batters[1];

            const bowler = currentBowlerLine(innings);

            if (bowler) slot.bowler = bowler;

        }

    }

    if (match.MatchSituation) slot.status = match.MatchSituation;

}

async function refreshLiveScorecards() {

    if (!currentData || !liveScorecardConfig) return;

    const jobs = Object.keys(liveScorecardConfig.slots).map(async (slotId) => {

        const matchId = liveScorecardConfig.slots[slotId];

        try {

            const scorecard = await fetchLiveScorecard(liveScorecardConfig.proxyUrl, matchId);
            const isFeatured = slotId === currentData.featuredSlotId;

            applyLiveScorecard(currentData.slots[slotId], scorecard, isFeatured);

        } catch (err) {

            console.warn(`[LiveScores] ${slotId} fetch failed:`, err.message);

        }

    });

    await Promise.all(jobs);

    loadData(currentData);

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
        const num = index + 2; // matches existing DOM ids match2/3/4

        document.getElementById(`cardName${num}`).textContent = slot.teamName;

        document.getElementById(`match${num}Title`).textContent =
            slot.opponent ? `v ${slot.opponent}` : "";

        document.getElementById(`match${num}Score`).textContent = slot.score;

        document.getElementById(`match${num}Status`).textContent = slot.status;

    });

    // Only rebuild the news marquee / sponsor slideshow when their content
    // actually changed — rebuilding on every 30s data refresh would reset
    // the scroll position / restart whichever slide is currently showing.

    const announcementsKey = JSON.stringify(data.announcements);

    if (announcementsKey !== lastAnnouncementsKey) {
        lastAnnouncementsKey = announcementsKey;
        renderAnnouncements(data.announcements);
    }

    const sponsorsKey = JSON.stringify(data.sponsors) + "|" + data.sponsorImageHeight;

    if (sponsorsKey !== lastSponsorsKey) {
        lastSponsorsKey = sponsorsKey;
        renderSponsors(data.sponsors, data.sponsorImageHeight);
    }

}

// ------------------------------------------------------
// Scrolling club news ticker
// ------------------------------------------------------

let lastAnnouncementsKey = null;
let lastSponsorsKey = null;

const MARQUEE_SPEED_PX_PER_SEC = 70;
const MARQUEE_MIN_DURATION_SEC = 10;

function renderAnnouncements(announcements) {

    const track = document.getElementById("announcementTrack");

    track.textContent = "";

    if (!announcements || announcements.length === 0) {
        track.style.animation = "none";
        return;
    }

    for (let copy = 0; copy < 2; copy++) {

        announcements.forEach((text) => {

            const span = document.createElement("span");
            span.textContent = text;
            track.appendChild(span);

            const separator = document.createElement("span");
            separator.className = "marquee-separator";
            separator.textContent = "•";
            track.appendChild(separator);

        });

    }

    track.style.animation = "";

    const halfWidth = track.scrollWidth / 2;
    const duration = Math.max(halfWidth / MARQUEE_SPEED_PX_PER_SEC, MARQUEE_MIN_DURATION_SEC);

    track.style.animationDuration = `${duration}s`;

}

// ------------------------------------------------------
// Sponsor slideshow (one sponsor at a time, PowerPoint-style)
// ------------------------------------------------------

const SPONSOR_FADE_MS = 400;
const SPONSOR_DEFAULT_DURATION_SEC = 6;

let sponsorSlideIndex = 0;
let sponsorSlideTimer = null;

function renderSponsors(sponsors, imageHeight) {

    const sponsorPanel = document.getElementById("sponsorPanel");
    const bottomPanels = document.getElementById("bottomPanels");
    const img = document.getElementById("sponsorSlideImage");

    clearTimeout(sponsorSlideTimer);

    if (!sponsors || sponsors.length === 0) {

        sponsorPanel.style.display = "none";
        bottomPanels.style.gridTemplateColumns = "1fr";

        return;

    }

    sponsorPanel.style.display = "flex";
    bottomPanels.style.gridTemplateColumns = "1fr 1fr";

    img.style.height = `${imageHeight}px`;

    if (sponsorSlideIndex >= sponsors.length) sponsorSlideIndex = 0;

    const showSlide = () => {

        const sponsor = sponsors[sponsorSlideIndex];
        const durationMs = Math.max(sponsor.durationSeconds || SPONSOR_DEFAULT_DURATION_SEC, 1) * 1000;

        img.style.opacity = 0;

        setTimeout(() => {
            img.src = sponsor.image;
            img.style.opacity = 1;
        }, SPONSOR_FADE_MS);

        sponsorSlideTimer = setTimeout(() => {
            sponsorSlideIndex = (sponsorSlideIndex + 1) % sponsors.length;
            showSlide();
        }, durationMs);

    };

    showSlide();

}

// ------------------------------------------------------
// Boot + refresh loop
// ------------------------------------------------------

let currentData = null;
let liveScorecardConfig = null;

async function refreshAndRender() {

    const config = getConfig();

    currentData = buildDataFromConfig(config);
    liveScorecardConfig = buildLiveScorecardConfig(config);

    loadData(currentData);

    await refreshLiveScorecards();

}

refreshAndRender();

setInterval(refreshAndRender, REFRESH_INTERVAL_MS);
setInterval(refreshLiveScorecards, SCORECARD_POLL_INTERVAL_MS);

scaleScreen();
