// FakeDateCreation - Revenge/Vendetta plugin
const { storage } = vendetta.plugin;
const { after } = vendetta.patcher;
const { getByName } = vendetta.metro;
const { React } = vendetta.metro.common;

// Valeurs par défaut
if (!storage.fakeDate) storage.fakeDate = "13 mai 2015";
if (!storage.enabled) storage.enabled = true;

let patches = [];

function patchDateComponent() {
    // On cherche le composant qui affiche les infos du profil utilisateur
    const UserProfileSection = getByName("UserProfileSection", { default: false })
        || getByName("ProfileBio", { default: false });

    if (!UserProfileSection) return false;

    patches.push(after("default", UserProfileSection, ([props], res) => {
        if (!storage.enabled) return;
        if (!res?.props) return;

        // Parcourt récursivement les enfants pour trouver la date
        function patchChildren(children) {
            if (!children) return;
            if (Array.isArray(children)) {
                children.forEach(patchChildren);
                return;
            }
            if (typeof children === "object" && children?.props) {
                const text = children.props.children;
                if (typeof text === "string" && /\d{1,2}.*\d{4}/.test(text)) {
                    children.props.children = storage.fakeDate;
                }
                patchChildren(children.props.children);
            }
        }
        patchChildren(res);
    }));
    return true;
}

// Patch via MutationObserver sur le DOM React Native (fallback)
function startDOMPatch() {
    // Sur mobile, on patche via le module de rendu de texte
    const Text = getByName("Text", { default: false });
    if (!Text) return;

    patches.push(after("render", Text.prototype || Text, ([props], res) => {
        if (!storage.enabled) return;
        if (typeof props?.children !== "string") return;
        // Détecter les dates au format Discord mobile (ex: "13 mai 2015", "May 13, 2015")
        if (/^\d{1,2}\s\w+\s\d{4}$/.test(props.children.trim()) ||
            /^\w+\s\d{1,2},\s\d{4}$/.test(props.children.trim())) {
            if (res?.props) res.props.children = storage.fakeDate;
        }
    }));
}

export default {
    onLoad() {
        if (!patchDateComponent()) {
            startDOMPatch();
        }
    },

    onUnload() {
        patches.forEach(p => p());
        patches = [];
    },

    settings: vendetta.ui.components ? (() => {
        const { TextInput, Switch, FormRow, FormSection } = vendetta.ui.components;
        return () => React.createElement(FormSection, { title: "FakeDateCreation" },
            React.createElement(FormRow, {
                label: "Activer",
                trailing: React.createElement(Switch, {
                    value: storage.enabled,
                    onValueChange: v => storage.enabled = v
                })
            }),
            React.createElement(TextInput, {
                value: storage.fakeDate,
                onChange: v => storage.fakeDate = v,
                placeholder: "13 mai 2015",
                title: "Date à afficher"
            })
        );
    })() : undefined
};
