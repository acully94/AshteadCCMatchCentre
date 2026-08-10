// ======================================================
// ASHTEAD MATCH CENTRE — ADMIN
// admin.js
// ======================================================

const CONFIG_KEY = "matchCentreConfig";

const SLOT_IDS = ["slot1", "slot2", "slot3", "slot4"];
const SLOT_FIELDS = [
    "teamName", "opponent", "matchId", "fixtureType",
    "score", "overs", "status", "batterOne", "batterTwo", "bowler"
];

function loadConfig() {

    try {

        const raw = localStorage.getItem(CONFIG_KEY);

        return raw ? JSON.parse(raw) : null;

    } catch (err) {

        console.warn("Match Centre Admin: could not read saved config:", err);

        return null;

    }

}

function linesToList(text) {

    return text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

}

function fillForm(config) {

    if (!config) return;

    const pc = config.playCricket || {};

    document.getElementById("pcSiteId").value = pc.siteId || "";
    document.getElementById("pcApiToken").value = pc.apiToken || "";

    document.getElementById("featuredSlotSelect").value = config.featuredSlotId || "slot1";
    document.getElementById("featuredIsLiveStream").checked = !!config.featuredIsLiveStream;
    document.getElementById("youtubeUrl").value = config.featuredYoutubeUrl || "";

    SLOT_IDS.forEach((slotId) => {

        const slot = (config.slots && config.slots[slotId]) || {};

        SLOT_FIELDS.forEach((field) => {

            const fieldId = slotId + field.charAt(0).toUpperCase() + field.slice(1);
            const el = document.getElementById(fieldId);

            if (el) el.value = slot[field] || "";

        });

    });

    document.getElementById("sponsorImages").value = (config.sponsorImages || []).join("\n");
    document.getElementById("clubAnnouncements").value = (config.announcements || []).join("\n");

}

function readForm() {

    const config = {

        playCricket: {
            siteId: document.getElementById("pcSiteId").value.trim(),
            apiToken: document.getElementById("pcApiToken").value.trim()
        },

        featuredSlotId: document.getElementById("featuredSlotSelect").value,
        featuredIsLiveStream: document.getElementById("featuredIsLiveStream").checked,
        featuredYoutubeUrl: document.getElementById("youtubeUrl").value.trim(),

        slots: {},

        sponsorImages: linesToList(document.getElementById("sponsorImages").value),
        announcements: linesToList(document.getElementById("clubAnnouncements").value)

    };

    SLOT_IDS.forEach((slotId) => {

        const slot = {};

        SLOT_FIELDS.forEach((field) => {

            const fieldId = slotId + field.charAt(0).toUpperCase() + field.slice(1);
            const el = document.getElementById(fieldId);

            slot[field] = el ? el.value.trim() : "";

        });

        config.slots[slotId] = slot;

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
