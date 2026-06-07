import { after } from "@lib/api/patcher";
import { onJsxCreate } from "@lib/api/react/jsx";
import { findByNameLazy } from "@metro";
import { UserStore, FluxDispatcher } from "@metro/common";
import { defineCorePlugin } from "..";

// Tes badges custom (modifie ici)
const MY_FAKE_BADGES = [
    {
        label: "Mon Badge Custom",
        url: "https://cdn.discordapp.com/emojis/TON_EMOJI_ID.png", // remplace par une vraie URL d'image
    },
    // Ajoute d'autres badges ici si tu veux
    // { label: "Badge 2", url: "https://..." },
];

const badgeProps = new Map<string, Record<string, any>>();

export default defineCorePlugin({
    manifest: {
        id: "bunny.fake-badge",
        version: "1.0.0",
        type: "plugin",
        spec: 3,
        main: "",
        display: {
            name: "Fake Badge",
            description: "Ajoute des badges custom sur ton propre profil (côté client uniquement)",
            authors: [{ name: "toi" }]
        }
    },

    start() {
        const currentUser = UserStore.getCurrentUser();
        if (!currentUser) return;

        const userId = currentUser.id;

        // Prépare les props des badges
        MY_FAKE_BADGES.forEach((badge, i) => {
            const badgeId = `fakebadge-${userId}-${i}`;
            badgeProps.set(badgeId, {
                id: badgeId,
                source: { uri: badge.url },
                label: badge.label,
                userId,
            });
        });

        // Patch l'affichage des badges (comme le plugin badges de référence)
        onJsxCreate("ProfileBadge", (component, ret) => {
            if (ret.props.id?.startsWith("fakebadge-")) {
                const cachedProps = badgeProps.get(ret.props.id);
                if (cachedProps) {
                    ret.props.source = cachedProps.source;
                    ret.props.label = cachedProps.label;
                    ret.props.id = cachedProps.id;
                }
            }
        });

        onJsxCreate("RenderedBadge", (component, ret) => {
            if (ret.props.id?.startsWith("fakebadge-")) {
                const cachedProps = badgeProps.get(ret.props.id);
                if (cachedProps) {
                    Object.assign(ret.props, cachedProps);
                }
            }
        });

        // Injecte les badges dans useBadges uniquement pour toi
        const useBadgesModule = findByNameLazy("useBadges", false);

        after("default", useBadgesModule, ([user], result) => {
            if (!user || user.userId !== userId) return;

            MY_FAKE_BADGES.forEach((badge, i) => {
                const badgeId = `fakebadge-${userId}-${i}`;
                result.unshift({
                    id: badgeId,
                    description: badge.label,
                    icon: " _",
                });
            });
        });
    }
});
