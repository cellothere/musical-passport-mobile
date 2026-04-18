<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Musical Passport Privacy Policy</title>
  <style>
    :root {
      --bg: #0b1120;
      --bg2: #121a2d;
      --card: rgba(16, 24, 40, 0.94);
      --text: #e8eefc;
      --muted: #aab6d3;
      --accent: #f0c35a;
      --border: #24324d;
      --link: #ffd87a;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font: 16px/1.7 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top, rgba(240, 195, 90, 0.12), transparent 28%),
        linear-gradient(180deg, var(--bg), var(--bg2));
    }
    .wrap { max-width: 900px; margin: 0 auto; padding: 48px 20px 72px; }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 36px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
    }
    h1, h2, h3 { line-height: 1.2; margin: 0 0 14px; }
    h1 { font-size: 2rem; margin-bottom: 10px; }
    h2 { font-size: 1.15rem; margin-top: 32px; color: var(--accent); }
    h3 { font-size: 1rem; margin-top: 22px; color: var(--text); }
    p { margin: 0 0 14px; color: var(--text); }
    ul { margin: 0 0 14px 0; padding-left: 22px; }
    li { margin: 0 0 8px; color: var(--text); }
    .muted { color: var(--muted); }
    a { color: var(--link); text-decoration: none; }
    a:hover { text-decoration: underline; }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      background: rgba(255,255,255,0.06);
      padding: 2px 6px;
      border-radius: 6px;
    }
    @media (max-width: 640px) {
      .card { padding: 24px; border-radius: 16px; }
      h1 { font-size: 1.7rem; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <main class="card">
      <h1>Privacy Policy for Musical Passport</h1>
      <p class="muted">Effective date: April 18, 2026</p>

      <p>Musical Passport ("Musical Passport," "we," "us," or "our") is a music-discovery app
      that helps you explore artists, genres, and songs from around the world.</p>

      <p>This Privacy Policy explains what information the app handles, where it is stored,
      and the choices available to you. In short: <strong>Musical Passport has no sign-in,
      no account system, and does not collect personally identifying information.</strong>
      Your activity in the app stays on your device.</p>

      <h2>1. Information Stored on Your Device</h2>
      <p>The following data is created and stored exclusively on your device using the
      operating system's local app storage. It never leaves your device, and we cannot
      access it:</p>
      <ul>
        <li>Tracks, artists, and countries you save as favorites</li>
        <li>Country stamps and passport activity (visited countries, genres explored)</li>
        <li>App preferences such as accessibility settings (haptic feedback, reduce motion)</li>
        <li>App-state housekeeping such as tester flags and recently viewed items</li>
        <li>Locally scheduled notifications for the "country of the day" feature</li>
      </ul>
      <p>To delete this data, uninstall the app or clear its storage from your device
      settings.</p>

      <h2>2. Information Sent to Our Backend</h2>
      <p>When you use the app, it makes anonymous requests to our backend to fetch music
      recommendations, artist information, and 30-second preview URLs. These requests do
      <strong>not</strong> include any account identifier, email address, name, or other
      personal information, because the app has no concept of an account.</p>
      <p>Like any web server, our backend automatically records standard request metadata
      (IP address, timestamp, requested URL, user-agent) in short-lived operational logs
      used for security and debugging. We do not link these logs to any user identity.</p>
      <p>If you choose to use the in-app "report this track" action because a recommendation
      seems incorrect, the report contains the track title, artist name, the country/genre
      context, and any optional comment you type. No user identifier is attached.</p>

      <h2>3. Third-Party Services</h2>
      <p>Musical Passport sources music metadata and 30-second previews from public
      developer APIs operated by the following services. These are server-to-server calls
      made by our backend; the third parties do not receive any information about you
      personally:</p>
      <ul>
        <li>Apple Music (catalog metadata and previews)</li>
        <li>Spotify (track previews; fallback only)</li>
        <li>Deezer (catalog metadata and previews)</li>
        <li>YouTube (music-video links for tracks without streaming previews)</li>
        <li>Last.fm, ListenBrainz, MusicBrainz, Discogs (artist metadata and discovery)</li>
        <li>Anthropic Claude API (server-side recommendation generation; queries contain
        only public artist names, country names, and genre names)</li>
      </ul>
      <p>If you tap a "Open in Spotify / Apple Music / Deezer" link in the app, your device
      will leave the app and open the corresponding service, at which point that service's
      own privacy policy applies.</p>

      <h2>4. How We Use Information</h2>
      <p>The limited information described above is used to:</p>
      <ul>
        <li>fulfill your in-app requests (return recommendations, fetch previews)</li>
        <li>operate, secure, and debug the backend</li>
        <li>improve the accuracy of recommendations when you submit a track report</li>
      </ul>

      <h2>5. How We Share Information</h2>
      <p>We do not sell or rent any information. We do not share information with
      advertisers. The app does not embed third-party analytics SDKs, advertising SDKs,
      or crash reporters that collect data about you.</p>
      <p>We may disclose limited information if required by law, to protect the safety
      of users, or to enforce our rights.</p>

      <h2>6. Notifications</h2>
      <p>If you allow notifications, Musical Passport may schedule local notifications on
      your device, such as reminders for the "country of the day" feature. These are
      generated and stored entirely on your device. We do not collect, store, or transmit
      push-notification tokens.</p>
      <p>You can disable notifications at any time in your device settings.</p>

      <h2>7. Data Retention</h2>
      <p>Data stored on your device persists until you delete it or uninstall the app.</p>
      <p>Anonymous server logs are retained for a short operational period and are then
      rotated and deleted. Track reports submitted via the "report this track" action are
      retained until acted upon by us to correct the cache.</p>

      <h2>8. Your Choices</h2>
      <p>Because Musical Passport has no account system, there is no profile to log into,
      modify, or delete. You can:</p>
      <ul>
        <li>disable haptic feedback or animations from the in-app Info screen</li>
        <li>disable notifications in your device settings</li>
        <li>delete all locally stored app data by clearing app storage or uninstalling
        the app</li>
        <li>contact us with any privacy questions at the address below</li>
      </ul>

      <h2>9. Children's Privacy</h2>
      <p>Musical Passport is not directed to children under 13, and we do not knowingly
      collect personal information from children under 13. If you believe a child has
      provided personal information to us, contact us and we will take appropriate steps
      to review and address it.</p>

      <h2>10. International Use</h2>
      <p>Our backend is operated in the United States. If you use the app from another
      country, the anonymous requests described in Section 2 will be processed by servers
      in the United States.</p>

      <h2>11. Security</h2>
      <p>We use reasonable administrative, technical, and organizational measures to
      protect our backend. Because no personal information is collected or stored about
      you, the security of your personal data is primarily a function of your own device's
      security.</p>

      <h2>12. Changes to This Privacy Policy</h2>
      <p>We may update this Privacy Policy from time to time. If we make material changes,
      we will update the effective date above and take other appropriate steps consistent
      with applicable law.</p>

      <h2>13. Contact Us</h2>
      <p>If you have questions or concerns about this Privacy Policy, contact:</p>
      <ul>
        <li>Email: <a href="mailto:musicalpassportapp@gmail.com">musicalpassportapp@gmail.com</a></li>
        <li>Website: <a href="https://cellothere.github.io/index.html">https://cellothere.github.io/index.html</a></li>
      </ul>
    </main>
  </div>
</body>
</html>
