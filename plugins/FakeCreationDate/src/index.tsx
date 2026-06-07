import { after } from "@lib/api/patcher";
import { onJsxCreate } from "@lib/api/react/jsx";
import { findByNameLazy, findByPropsLazy } from "@metro";
import { defineCorePlugin } from "..";

// La date que TU veux afficher (modifie ici)
const FAKE_DATE = new Date("2019-04-01");

const formattedFakeDate = FAKE_DATE.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
});

export default defineCorePlugin({
    manifest: {
        id: "bunny.fake-creation-date",
        version: "1.0.0",
        type: "plugin",
        spec: 3,
        main: "",
        display: {
            name: "Fake Creation Date",
            description: "Modifie la date de création affichée sur ton profil (côté client uniquement)",
            authors: [{ name: "toi" }]
        }
    },

    start() {
        // Patch le composant qui affiche la date dans le profil
        onJsxCreate("UserProfileMemberSinceSection", (component, ret) => {
            if (!ret?.props?.children) return;

            const children = Array.isArray(ret.props.children)
                ? ret.props.children
                : [ret.props.children];

            // Parcourt les enfants pour trouver et remplacer la date
            const patchChildren = (nodes: any[]): any[] => {
                return nodes.map((child) => {
                    if (!child) return child;
                    if (typeof child === "string" && /\d{4}/.test(child)) {
                        return formattedFakeDate;
                    }
                    if (child?.props?.children) {
                        child.props.children = Array.isArray(child.props.children)
                            ? patchChildren(child.props.children)
                            : typeof child.props.children === "string" && /\d{4}/.test(child.props.children)
                                ? formattedFakeDate
                                : child.props.children;
                    }
                    return child;
                });
            };

            ret.props.children = patchChildren(children);
        });
    }
});
