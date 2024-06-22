using System.Collections.Generic;
using UnityEngine;
using Colyseus;
using static Dissonity.Api;
using TMPro;
using System.Threading.Tasks;
using Unity.VisualScripting;
using UnityEngine.InputSystem;

// You need to place the generated C# classes from running "npm run colyseus"
// inside the Unity project.

public class NetworkManager : ColyseusManager<NetworkManager>
{
    // ColyseusClient client;
    ColyseusRoom<GameState> room;
    public TMP_Text text;
    public string instanceId;
    public string userId;
    public string localSessionId;
    public GameObject playerPrefab;
    // PlayerObjects : Dictionary<sessionId | userId, GameObject>
    private Dictionary<string, GameObject> playerObjects = new Dictionary<string, GameObject>();

    protected override async void Start()
    {
        // Initialize Dissonity
        await Dissonity.Api.WaitForLoad();
        text.text += "Dissonity Bridge Initialized: " + Dissonity.Api.bridgeInitialized.ToString() + "\n";
        text.text += "NPM Library loaded: " + Dissonity.Api.npmLoaded.ToString() + "\n";

        // Get necessary Discord data
        instanceId = await GetSDKInstanceId();
        DissonityLog("instanceId: " + instanceId);

        userId = await GetUserId();
        text.text += "New User: " + userId + "\n";
        DissonityLog("userId: " + userId);


        // Connect to matchmaking room
        // (This implementation can be improved, but this should do)
        client = new ColyseusClient("wss://1232815021562527835.discordsays.com");
        var matchmakingRoom = await client.Create<MatchmakingState>("matchmaking", new Dictionary<string, object> { { "instanceId", instanceId }, { "userId", userId } });

        // Listen for matchmaking room instructions
        matchmakingRoom.OnMessage<Dictionary<string, object>>("matchmake", async data =>
        {
            // Leave matchmaking room
            await matchmakingRoom.Leave();

            //? Room already exists
            if ((bool)data["exists"])
            {
                //\ Join the existing activity room
                room = await client.JoinById<GameState>(instanceId, new Dictionary<string, object> { { "userId", userId } });
                // Client is now connected to the room!
                DissonityLog("Room joined! InstanceID: " + instanceId);
                DissonityLog("Player Joined: " + userId);
            }

            //? Doesn't exist
            else
            {
                //\ Create the activity room
                room = await client.Create<GameState>("game", new Dictionary<string, object> { { "instanceId", instanceId }, { "userId", userId } });
                this.localSessionId = room.SessionId;
                // Client is now connected to the room!
                DissonityLog("Room created! InstanceID: " + instanceId + " SessionID: " + room.SessionId);
            }

            room.State.players.OnAdd((sessionId, joinedPlayer) => {
                DissonityLog("Player joined: " + sessionId + " " + JsonUtility.ToJson(joinedPlayer));

                if (sessionId == this.localSessionId) {
                    playerObjects[sessionId] = Instantiate(playerPrefab, Vector3.zero, Quaternion.identity);
                } else {
                    var playerPosition = new Vector3(joinedPlayer.position.x, joinedPlayer.position.y, joinedPlayer.position.z);
                    playerObjects[sessionId] = Instantiate(playerPrefab, playerPosition, Quaternion.identity);
                }
                playerObjects[sessionId].GetComponent<PlayerController>().player = joinedPlayer;

                // Listen for player position changes
                joinedPlayer.position.OnChange(() => {
                    // if joinedPlayer not the current player
                    if (joinedPlayer.sessionId != this.localSessionId)
                    {
                        joinedPlayer.serverPosition = new Vector3(joinedPlayer.position.x, joinedPlayer.position.y, joinedPlayer.position.z);
                    }
                });
            }, false);

            room.State.players.OnRemove((sessionId, leftPlayer) => {
                Destroy(playerObjects[sessionId]);
                DissonityLog("Player left: " + sessionId);
            });

            room.OnJoin += () => {
                DissonityLog("Joined room successfully!");
            };

            // room.State.OnChange(() =>
            // {
            //     DissonityLog("Room state changed!");
            // });
            
        });
    }

    public ColyseusRoom<GameState> GameRoom
    {
        get
        {
            if (room == null)
            {
                DissonityLog("[Client]: Error! Room hasn't been initialized yet!");
            }
            return room;
        }
    }

    public void updatePosition(Vector3 position)
    {
        _ = GameRoom.Send("position", new Dictionary<string, object> { { "x", position.x }, { "y", position.y }, { "z", position.z } });
    }

    protected override void FixedUpdate() {
        foreach (var sessionId in playerObjects.Keys) {
            if (sessionId != this.localSessionId) {
                var player = playerObjects[sessionId].GetComponent<PlayerController>().player;
                var playerObj = playerObjects[sessionId];
                var moveSpeed = playerObj.GetComponent<PlayerController>().moveSpeed;
                if (playerObj != null) {
                    playerObj.transform.position = Vector3.Lerp(playerObj.transform.position, player.serverPosition, moveSpeed * Time.deltaTime);
                }
            }
        }
    }

    void Update() {
        // foreach (var sessionId in playerObjects.Keys)
        // {
        //     if (sessionId != this.localSessionId)
        //     {
        //         var player = playerObjects[sessionId].GetComponent<PlayerController>().player;
        //         var playerObj = playerObjects[sessionId];
        //         var moveSpeed = playerObj.GetComponent<PlayerController>().moveSpeed;
        //         if (playerObj != null)
        //         {
        //             playerObj.transform.position = Vector3.Lerp(playerObj.transform.position, player.serverPosition, moveSpeed * Time.deltaTime);
        //         }
        //     }
        // }
    }
}
