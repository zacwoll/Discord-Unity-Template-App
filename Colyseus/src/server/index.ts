
import { config } from "dotenv";
  config();
import path from "path";
import fetch from "cross-fetch";
import express from "express";

// Colyseus
import { Server } from "colyseus";
import { createServer } from "http";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { MatchmakingRoom, GameRoom } from "./utils/rooms";
import { monitor } from "@colyseus/monitor";

// Log the cloudflared hostname
console.log(`hostname: ${process.env.CLOUDFLARED_URL}`);

//\ Prepare express server
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client"), {
  setHeaders: (res, path) => {

    if (path.endsWith(".gz")) {
      res.appendHeader("Content-Encoding", "gzip");
    }

    if (path.endsWith(".br")) {
      res.appendHeader("Content-Encoding", "br");
    }

    if (path.endsWith(".wasm.gz") || path.endsWith(".wasm.br") || path.endsWith(".wasm")) {
      res.appendHeader("Content-Type", "application/wasm");
    }

    if (path.endsWith(".js.gz") || path.endsWith(".js.br") || path.endsWith(".js")) {
      res.appendHeader("Content-Type", "application/javascript");
    }

    if (path.endsWith(".data") || path.endsWith(".mem")) {
      res.appendHeader('Content-Type', 'application/octet-stream');
    }
  }
}));

//# HTTP ROUTES - - - - -
/**
 * You can add  your server routes here
 */
//\ Fetch token from developer portal and return to the embedded app
app.post("/api/token", async (req, res) => {

  //? No code
  if (!req.body.code) return res.status(400);

  //\ Fetch token from dev portal
  try {
    const response = await fetch(`https://discord.com/api/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.PUBLIC_CLIENT_ID!,
        client_secret: process.env.CLIENT_SECRET!,
        grant_type: "authorization_code",
        code: req.body.code,
        redirect_uri:
          process.env.CLOUDFLARED_URL || '',
      }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Failed to fetch token");

    if (!data.access_token) throw new Error("No access token");

    const { access_token } = data;
    res.send({access_token});
  } catch (error) {
    console.log(`[Server]: Error: ${error}`);
    res.status(500).send({ error: "Internal Server Error" });
  }

  return;
});

//? Colyseus server
if (process.env.COLYSEUS!.toLowerCase() == "true") {
    const colyseusServer = new Server({
    transport: new WebSocketTransport({
      server: createServer(app),
    }),
  });

  //\ Expose the rooms
  colyseusServer
    .define("matchmaking", MatchmakingRoom)
    .filterBy(["instanceId"]);

  colyseusServer.define("game", GameRoom).filterBy(["instanceId", "userId"]);

  //\ Listen to port
  colyseusServer.listen(Number(process.env.PORT!));
}

//? Just express server
else {
  app.listen(Number(process.env.PORT!));
}

app.use("/colyseus", monitor());

console.log(`Server initialized with port ${Number(process.env.PORT!)}`);
