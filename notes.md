# Merge Unity Project + Dissonity Build Files into separate repo

## How project functions

### Rough outline of process

Discord Embedded-App Sdk allows for embedded iframes within discord activities.
Activities are a sandboxed environment that provides information pertaining to Discord Users
Users join the activity and proceed through the Colyseus logic, leading to instantiation of Player in a GameRoom
Colyseus logic handles Matchmaking and Networking, Network state changes are accepted from players and change the overall networking state.
Unity receives all game messages from the Discord-Bridge npm package, relaying them into the Unity client.

### Breakdown of submodules

Unity Project and samples live in the /Unity module
Colyseus Server and Unity Client Build lives in the /Colyseus module

### .env vars

your .env file needs:

- DISCORD CLIENT_ID + SECRET

## Steps and necessary information to run

### Necessary steps to run the application

- Enter the Discord client_id and secret into the .env file
- Build your Unity Project as a WebGL project into `Colyseus/src/client/nested/`
- Build your schema files with the included `npm run colyseus`
    `npx schema-codegen src/server/utils/structures.ts --csharp --output _unity_colyseus/`
- Launch a tunnel to your hosted port (by default this is 63232) using cloudflared
`cloudflared tunnel --url http://localhost:{PORT}`
- Find Activity Registered to your Discord Developer page and update URL Mappings
  / => {TEMP_CLOUDFLARE_URL}
- Run Colyseus Server and your Matchmaking/Game logic lives in `/Colyseus/src/server/utils/rooms.ts`

### Important insights in the codebase

`Dissonity/examples/node_project/src/client/nested/` is the folder where the Unity Editor builds to.

`Dissonity/examples/node_project/src/server` is the Colyseus logic, including

- Room Logic, Matchmaking, Networking Logic `rooms.ts`
- Structures and shared types that the Unity Colyseus library recognizes `structures.ts` & `types.ts`
