/**
 * You can add your Colyseus schemas in this file.
 * The Unity C# scripts will be generated inside _unity_colyseus
 * after running "npm run colyseus".
 */

import { Schema, type, MapSchema } from "@colyseus/schema";

export class Position extends Schema {
  @type("number")
  x: number;

  @type("number")
  y: number;

  @type("number")
  z: number;

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    super();
    this.x = x;
    this.y = y;
    this.z = z;
  }
}
// Example player schema, you could add more properties, a constructor...
export class Player extends Schema {

    @type("boolean")
    connected: boolean = true;

    @type("string")
    userId: string = "";

    @type("string")
    sessionId: string = "";

    @type(Position)
    position: Position = new Position();

    constructor(sessionId: string, userId: string) {
        super();
        this.userId = userId;
        this.sessionId = sessionId;
    }
}


// Matchmaking doesn't require state
export class MatchmakingState extends Schema {}

// Example game state
export class GameState extends Schema {

    @type({ map: Player })
    players = new MapSchema<Player>();
}