
import { setupSdk } from "dissonity";


window.addEventListener('DOMContentLoaded', () => {
  setupSdk({
    clientId: process.env.PUBLIC_CLIENT_ID!,
    // More info on scopes here: https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes
    scope: [
      // "applications.builds.upload",
      // "applications.builds.read",
      // "applications.store.update",
      // "applications.entitlements",
      // "bot",
      "identify",
      // "connections",
      // "email",
      // "gdm.join",
      "guilds",
      // "guilds.join",
      "guilds.members.read",
      // "messages.read",
      // "relationships.read",
      // 'rpc.activities.write',
      // "rpc.notifications.read",
      // "rpc.voice.write",
      "rpc.voice.read",
      // "webhook.incoming",
    ],
    tokenRoute: "/api/token",
  }).then(() => console.log("[Client]: SDK is ready!"))
  .catch((err) => console.error("[Client]: Error setting up SDK", err));
});