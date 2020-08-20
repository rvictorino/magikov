
const Mastodon = require('mastodon-api');

// Mastodon.getAuthorizationUrl('49278f382984d5855bd2e31fd9f76c1f08158e1c76d278d88adf35ec6a391744', '5f07ea3eedd63ab2ffa9a51d54e2c3f795e77e0e998ccab6c9e61cc64ee7c1c8', 'https://hostux.social', 'read')
// .then(console.log)

Mastodon.getAccessToken('49278f382984d5855bd2e31fd9f76c1f08158e1c76d278d88adf35ec6a391744', '5f07ea3eedd63ab2ffa9a51d54e2c3f795e77e0e998ccab6c9e61cc64ee7c1c8', 'bdeb039e5ce323d0af7b16108b814b6a984f8267ef9958a289588b3f499b250f', 'https://hostux.social')
.then(console.log);

//bdeb039e5ce323d0af7b16108b814b6a984f8267ef9958a289588b3f499b250f
