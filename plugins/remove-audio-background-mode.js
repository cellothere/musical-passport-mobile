// Strips `audio` from UIBackgroundModes after `expo-audio` injects it.
// Musical Passport plays only 30-second previews in the foreground; we do
// not ship a background-audio feature. Declaring the entitlement caused
// App Store rejection under Guideline 2.5.4 (Performance — Software
// Requirements), so this plugin removes it.
//
// Must be listed AFTER `expo-audio` in app.json plugins, so it runs later
// in the config-plugin chain.

const { withInfoPlist } = require('@expo/config-plugins');

module.exports = function removeAudioBackgroundMode(config) {
  return withInfoPlist(config, (cfg) => {
    const modes = cfg.modResults.UIBackgroundModes;
    if (Array.isArray(modes)) {
      const next = modes.filter((m) => m !== 'audio');
      if (next.length === 0) {
        delete cfg.modResults.UIBackgroundModes;
      } else {
        cfg.modResults.UIBackgroundModes = next;
      }
    }
    return cfg;
  });
};
