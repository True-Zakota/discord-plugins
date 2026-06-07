import { after } from "@lib/api/patcher";
import { onJsxCreate } from "@lib/api/react/jsx";
import { findByNameLazy } from "@metro";
import { UserStore } from "@metro/common";
import { defineCorePlugin } from "..";

// Le pseudo que TU veux voir affiché (modifie ici)
const FAKE_USERNAME = "MonFauxPseudo";
const FAKE_DISPLAY_NAME = "Mon Faux Nom"; // laisser "" pour ne pas changer

export default defineCorePlugin({
    manifest: {
        id: "bunny.fake-username",
        version: "1.0.0",
        type: "plugin",
        spec: 3,
        main: "",
        display: {
            name: "Fake Username",
            description: "Affiche un faux pseudo sur ton propre profil (côté client uniquement)",
            authors: [{ name: "toi" }]
        }
    },

    start() {
        onJsxCreate("UserProfileUsername", (component, ret) => {
            if (!ret?.props) return;

            const currentUser = UserStore.getCurrentUser();
            if (!currentUser) return;

            // Patch uniquement ton propre profil
            const patchText = (nodes: any): any => {
                if (typeof nodes === "string") {
                    if (nodes === currentUser.username || nodes === `@${currentUser.username}`) {
                        return nodes.startsWith("@") ? `@${FAKE_USERNAME}` : FAKE_USERNAME;
                    }
                    if (FAKE_DISPLAY_NAME && nodes === (currentUser.globalName ?? currentUser.username)) {
                        return FAKE_DISPLAY_NAME;
                    }
                    return nodes;
                }
                if (Array.isArray(nodes)) return nodes.map(patchText);
                if (nodes?.props?.children) {
                    nodes.props.children = patchText(nodes.props.children);
                }
                return nodes;
            };

            ret.props.children = patchText(ret.props.children);
        });
    }
});
