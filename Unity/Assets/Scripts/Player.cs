using UnityEngine;
using Colyseus.Schema;
using Action = System.Action;
using static Dissonity.Api;

public partial class Player : Schema
{
	public Vector3 serverPosition;
	NetworkManager _networkManager;
	public bool isMine() {
		DissonityLog($"{this.sessionId} {_networkManager.GameRoom.SessionId}");
		return this.sessionId == _networkManager.GameRoom.SessionId;
	}
}