/**
 * Here you can add your Colyseus rooms
 * (https://docs.colyseus.io/server/room/)
 */

import { Room } from "colyseus";
import { GameState, MatchmakingState, Player, Position } from "./structures";

import type { Client } from "colyseus";
import type { ExpectedCreateOptions, ExpectedJoinOptions } from "./types";

// Used to keep track of existing rooms. The keys are activity instance ids.
const roomsMap = new Map<string, boolean>();

// Users can connect to this room to know whether they have to create a new room
// or connect to an existing one. They'll connect, receive instructions and disconnect.
export class MatchmakingRoom extends Room {
    override maxClients: number = 1;

    private disconnectTimeout: NodeJS.Timeout | null = null;

    override onCreate(options: ExpectedCreateOptions): void | Promise<any> {
        
        //? Check validity
        if (typeof options.instanceId != "string") return this.disconnect();

        this.roomId = `matchmake-${options.instanceId}`;

        console.log(`[Server]: MatchmakingRoom created with room id: ${this.roomId}`)

        //\ Set state
        this.setState(new MatchmakingState());
    }

    override onJoin(client: Client, options: Required<ExpectedCreateOptions>): void | Promise<any> {
        console.log(`[Server]: MatchmakingRoom: ${this.roomId} joined by client ${options.userId}`)

        // Client should receive the instructions and disconnect before 5s
        this.disconnectTimeout = setTimeout(() => { client.leave(); }, 5_000);
        
        //? Room exists
        const roomValue = roomsMap.get(options.instanceId);

        client.send("matchmake", {
            exists: roomValue ?? false,
        });
    }

    override onLeave(_client: Client, _consented?: boolean): void | Promise<any> {
        console.log(`[Server]: Client left MatchmakingRoom ${this.roomId}`)
        clearTimeout(this.disconnectTimeout as NodeJS.Timeout);
    }

    onError(_client: Client, _err: Error): void | Promise<any> {
        console.log(`[Server]: Error in MatchmakingRoom ${this.roomId}`)
    }
}

// This is your actual game room!
export class GameRoom extends Room {
  override maxClients: number = 1000;

  override onCreate(options: ExpectedCreateOptions): void | Promise<any> {
    console.log(
      `[Server]: GameRoom created with instance id: ${options.instanceId}`,
    );

    //? Check validity
    if (typeof options.instanceId != "string") return this.disconnect();

    roomsMap.set(options.instanceId, true);

    // Increasing the reservation time to increase flexibility with the client
    this.setSeatReservationTime(300);

    //\ Set id and state
    this.roomId = options.instanceId;
    this.setState(new GameState());

    // You can set up your listeners here
    // this.onMessage("someMessage", () => {});
    this.onMessage("position", (client, data) => {
      const pos = new Position(data.x, data.y, data.z);
      // console.log(`[Server]: Received position from ${client.sessionId}: ${pos.x}:${pos.y}:${pos.z}`);

      const state = this.state as GameState;
      state.players.get(client.sessionId)!.position = pos;
    });
  }

  override onJoin(
    client: Client,
    options?: ExpectedJoinOptions,
  ): void | Promise<any> {

    //? Check validity
    if (typeof options?.userId != "string") return client.leave();

    console.log(
      `[Server]: Client ${options.userId} joined to GameRoom: ${this.roomId}`,
    );

    //\ Set user id to player
    const player = new Player(client.sessionId, options.userId);

    //\ Save player to state (for other clients to receive it)
    const state = this.state as GameState;
    state.players.set(client.sessionId, player);
  }

  override async onLeave(
    client: Client,
    consented?: boolean | undefined,
  ): Promise<any> {
    const state = this.state as GameState;

    // Mark player as disconnected
    state.players.get(client.sessionId)!.connected = false;

    try {
      if (consented) {
        throw new Error("Consented disconnect");
      }

      // Client has 5 seconds to reconnect
      await this.allowReconnection(client, 5);

      // Client's saved
      state.players.get(client.sessionId)!.connected = true;
    } catch (err) {
      console.log(
        `[Server]: Client left GameRoom with instance id: ${this.roomId}`,
      );

      // Client will be removed
      state.players.delete(client.sessionId);
    }
  }

  override onDispose(): void | Promise<any> {
    console.log(
      `[Server]: GameRoom disposed with instance id ${this.roomId}\n`,
    );

    roomsMap.delete(this.roomId);
  }
}