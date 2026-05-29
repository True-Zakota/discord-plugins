// FakeUsername - Revenge/Vendetta plugin
const { storage } = vendetta.plugin;
const { after } = vendetta.patcher;
const { getByName, getByProps } = vendetta.metro;
const { React, UserStore } = vendetta.metro.common;

if (!storage.fakeDisplayName) storage.fakeDisplayName = "";
if (!storage.fakeTag) storage.fakeTag = "";
if (!storage.enabled) storage.enabled = true;
if (!storage.targetMode) storage.targetMode = "self"; // "self" | "all" | "specific"
if (!storage.targetIds) storage.targetIds = "";

let patches = [];

function getMyId() {
    try { return UserStore?.getCurrentUser()?.id ?? null; } catch { return null; }
}

function shouldPatch(userId) {
    if (!storage.enabled) return false;
    if (storage.targetMode === "all") return true;
    if (storage.targetMode === "self") return userId === getMyId();
    if (storage.targetMode === "specific") {
        return storage.targetIds.split(",").map(s => s.trim()).filter(Boolean).includes(userId);
    }
    return false;
}

export default {
    onLoad() {
        // Patch le UserStore pour retourner un faux display name / username
        if (UserStore) {
            patches.push(after("getUser", UserStore, ([userId], user) => {
                if (!user || !shouldPatch(userId)) return user;
                const patched = Object.assign(Object.create(Object.getPrototypeOf(user)), user);
                if (storage.fakeDisplayName) patched.globalName = storage.fakeDisplayName;
                if (storage.fakeTag) patched.username = storage.fakeTag;
                return patched;
            }));
        }

        // Patch aussi getCurrentUser pour son propre profil
        if (storage.targetMode === "self" && UserStore) {
            patches.push(after("getCurrentUser", UserStore, (_, user) => {
                if (!user || !storage.enabled) return user;
                const patched = Object.assign(Object.create(Object.getPrototypeOf(user)), user);
                if (storage.fakeDisplayName) patched.globalName = storage.fakeDisplayName;
                if (storage.fakeTag) patched.username = storage.fakeTag;
                return patched;
            }));
        }
    },

    onUnload() {
        patches.forEach(p => p());
        patches = [];
    },

    settings: vendetta.ui.components ? (() => {
        const { TextInput, Switch, FormRow, FormSection, Picker } = vendetta.ui.components;
        return () => React.createElement(FormSection, { title: "FakeUsername" },
            React.createElement(FormRow, {
                label: "Activer",
                trailing: React.createElement(Switch, {
                    value: storage.enabled,
                    onValueChange: v => storage.enabled = v
                })
            }),
            React.createElement(TextInput, {
                value: storage.fakeDisplayName,
                onChange: v => storage.fakeDisplayName = v,
                placeholder: "Faux display name",
                title: "Faux display name (laisser vide pour ne pas changer)"
            }),
            React.createElement(TextInput, {
                value: storage.fakeTag,
                onChange: v => storage.fakeTag = v,
                placeholder: "Faux tag (ex: zakotaa)",
                title: "Faux tag/username (laisser vide pour ne pas changer)"
            }),
            React.createElement(TextInput, {
                value: storage.targetIds,
                onChange: v => storage.targetIds = v,
                placeholder: "702631813063114753,123456789",
                title: "IDs ciblés (séparés par virgules, laisser vide = moi uniquement)"
            })
        );
    })() : undefined
};
