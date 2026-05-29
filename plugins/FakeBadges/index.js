// FakeBadges - Revenge/Vendetta plugin
const { storage } = vendetta.plugin;
const { after } = vendetta.patcher;
const { getByName, getByProps } = vendetta.metro;
const { React } = vendetta.metro.common;

const BADGES = {
    staff:                { label: "Staff Discord",           url: "https://cdn.discordapp.com/badge-icons/5e74e9b61934fc1f67c65515d1f7e60d.png" },
    partner:              { label: "Partenaire",              url: "https://cdn.discordapp.com/badge-icons/3f9748e53446a137a052f3454e2de41e.png" },
    hypesquad:            { label: "HypeSquad Events",        url: "https://cdn.discordapp.com/badge-icons/bf01d1073931f921909045f3a39fd264.png" },
    hypesquad_bravery:    { label: "HypeSquad Bravery",       url: "https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png" },
    hypesquad_brilliance: { label: "HypeSquad Brilliance",    url: "https://cdn.discordapp.com/badge-icons/011940fd013082d99d0e8b8c9ea3a5ea.png" },
    hypesquad_balance:    { label: "HypeSquad Balance",       url: "https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png" },
    bug_hunter_1:         { label: "Bug Hunter Niv.1",        url: "https://cdn.discordapp.com/badge-icons/2717692c7dca7289b35297368a940dd0.png" },
    bug_hunter_2:         { label: "Bug Hunter Niv.2",        url: "https://cdn.discordapp.com/badge-icons/848f79194d4be5ff5f81505cbd0ce1e6.png" },
    early_supporter:      { label: "Early Supporter",         url: "https://cdn.discordapp.com/badge-icons/7060786766c9c840eb3019e725d2b358.png" },
    active_developer:     { label: "Développeur Actif",       url: "https://cdn.discordapp.com/badge-icons/6bdc42827a38498929a4920da12695d9.png" },
    verified_developer:   { label: "Dev Bot Vérifié",         url: "https://cdn.discordapp.com/badge-icons/df199d2050d3ed4ebf84d64ae83989f8.png" },
    moderator:            { label: "Modérateur Certifié",     url: "https://cdn.discordapp.com/badge-icons/fee4a9a68e80d30f7a3e4fc6564bdd42.png" },
    nitro_bronze:         { label: "Nitro Bronze",            url: "https://cdn.discordapp.com/badge-icons/4f33c4a9c64ce221936bd256c356f91f.png" },
    nitro_silver:         { label: "Nitro Argent",            url: "https://cdn.discordapp.com/badge-icons/2ba85e8026a8614b640c2837bcdfe21b.png" },
    nitro_gold:           { label: "Nitro Or",                url: "https://cdn.discordapp.com/badge-icons/996b3e4102a2b977ad153d7cbf7f8e36.png" },
    early_verified_bot:   { label: "Bot Vérifié Précoce",     url: "https://cdn.discordapp.com/badge-icons/df199d2050d3ed4ebf84d64ae83989f8.png" },
    quest:                { label: "Quête complétée",         url: "https://cdn.discordapp.com/badge-icons/7d9ae358c8c5e118768335dbe68b4fb8.png" },
};

if (!storage.badgeIds) storage.badgeIds = "early_supporter,nitro_bronze";
if (!storage.enabled) storage.enabled = true;
if (storage.targetAll === undefined) storage.targetAll = false;

let patches = [];

function getSelectedBadges() {
    return storage.badgeIds.split(",").map(s => s.trim()).filter(Boolean)
        .map(id => BADGES[id] ? { id, ...BADGES[id] } : null).filter(Boolean);
}

export default {
    onLoad() {
        // Patch le composant UserBadges / ProfileBadges
        const BadgeList = getByName("ProfileBadges", { default: false })
            || getByName("UserBadges", { default: false })
            || getByProps("getBadges");

        if (!BadgeList) return;

        // Patch getBadges pour injecter nos faux badges
        if (BadgeList.getBadges) {
            patches.push(after("getBadges", BadgeList, ([userId], res) => {
                if (!storage.enabled) return res;
                const fakeBadges = getSelectedBadges().map(b => ({
                    id: `fake_${b.id}`,
                    description: b.label,
                    icon: b.url,
                    link: undefined,
                }));
                return [...(res || []), ...fakeBadges];
            }));
        }
    },

    onUnload() {
        patches.forEach(p => p());
        patches = [];
    },

    settings: vendetta.ui.components ? (() => {
        const { TextInput, Switch, FormRow, FormSection, Text } = vendetta.ui.components;
        return () => React.createElement(FormSection, { title: "FakeBadges" },
            React.createElement(FormRow, {
                label: "Activer",
                trailing: React.createElement(Switch, {
                    value: storage.enabled,
                    onValueChange: v => storage.enabled = v
                })
            }),
            React.createElement(TextInput, {
                value: storage.badgeIds,
                onChange: v => storage.badgeIds = v,
                placeholder: "early_supporter,nitro_bronze",
                title: "IDs des badges (séparés par virgules)"
            }),
            React.createElement(Text, { style: { fontSize: 11, opacity: 0.6, margin: 8 } },
                "IDs disponibles : " + Object.keys(BADGES).join(", ")
            )
        );
    })() : undefined
};
