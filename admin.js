// ======================================================
// ASHTEAD MATCH CENTRE — ADMIN
// admin.js
// ======================================================

const CONFIG_KEY = "matchCentreConfig";

const CARD_SLOTS = ["second", "third", "fourth"];

function loadConfig() {

    try {

        const raw = localStorage.getItem(CONFIG_KEY);

        return raw ? JSON.parse(raw) : null;

    } catch (err) {

        console.warn("Match Centre Admin: could not read saved config:", err);

        return null;

    }

}

function fillForm(config) {

    if (!config) return;

    const pc = config.playCricket || {};
    const featured = config.featured || {};

    document.getElementById("pcSiteId").value = pc.siteId || "";
    document.getElementById("pcApiToken").value = pc.apiToken || "";

    document.getElementById("featuredMatchId").value = featured.matchId || "";
    document.getElementById("featuredFixtureType").value = featured.fixtureType || "";
    document.getElementById("featuredTeam").value = featured.team || "";
    document.getElementById("featuredOpponent").value = featured.opponent || "";
    document.getElementById("featuredScore").value = featured.score || "";
    document.getElementById("featuredOvers").value = featured.overs || "";
    document.getElementById("featuredBatterOne").value = featured.batterOne || "";
    document.getElementById("featuredBatterTwo").value = featured.batterTwo || "";
    document.getElementById("featuredBowler").value = featured.bowler || "";
    document.getElementById("youtubeUrl").value = featured.youtubeUrl || "";

    CARD_SLOTS.forEach((slotKey) => {

        const slot = config[slotKey] || {};

        document.getElementById(`${slotKey}MatchId`).value = slot.matchId || "";
        document.getElementById(`${slotKey}Title`).value = slot.title || "";
        document.getElementById(`${slotKey}Score`).value = slot.score || "";
        document.getElementById(`${slotKey}Status`).value = slot.status || "";

    });

    document.getElementById("sponsorImage").value = config.sponsorImage || "";
    document.getElementById("clubAnnouncement").value = config.announcement || "";

}

function readForm() {

    const config = {

        playCricket: {
            siteId: document.getElementById("pcSiteId").value.trim(),
            apiToken: document.getElementById("pcApiToken").value.trim()
        },

        featured: {
            matchId: document.getElementById("featuredMatchId").value.trim(),
            fixtureType: document.getElementById("featuredFixtureType").value.trim(),
            team: document.getElementById("featuredTeam").value.trim(),
            opponent: document.getElementById("featuredOpponent").value.trim(),
            score: document.getElementById("featuredScore").value.trim(),
            overs: document.getElementById("featuredOvers").value.trim(),
            batterOne: document.getElementById("featuredBatterOne").value.trim(),
            batterTwo: document.getElementById("featuredBatterTwo").value.trim(),
            bowler: document.getElementById("featuredBowler").value.trim(),
            youtubeUrl: document.getElementById("youtubeUrl").value.trim()
        },

        sponsorImage: document.getElementById("sponsorImage").value.trim(),
        announcement: document.getElementById("clubAnnouncement").value.trim()

    };

    CARD_SLOTS.forEach((slotKey) => {

        config[slotKey] = {
            matchId: document.getElementById(`${slotKey}MatchId`).value.trim(),
            title: document.getElementById(`${slotKey}Title`).value.trim(),
            score: document.getElementById(`${slotKey}Score`).value.trim(),
            status: document.getElementById(`${slotKey}Status`).value.trim()
        };

    });

    return config;

}

function saveConfig() {

    const config = readForm();

    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));

    const statusMessage = document.getElementById("statusMessage");

    statusMessage.textContent = "Saved " + new Date().toLocaleTimeString("en-GB");
    statusMessage.classList.add("admin-status--ok");

    setTimeout(() => statusMessage.classList.remove("admin-status--ok"), 2000);

}

document.getElementById("saveButton").addEventListener("click", saveConfig);

fillForm(loadConfig());
