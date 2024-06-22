using System;
using System.Collections;
using System.Collections.Generic;
using Unity.VisualScripting;
using UnityEngine;
using UnityEngine.InputSystem;
using static Dissonity.Api;

public class PlayerController : MonoBehaviour
{
    private NetworkManager _networkManager;
    private Vector2 playerInput;
    public bool IsMine { get; private set; }
    public Player player;
    [SerializeField] public string playerName;
    [SerializeField] private Rigidbody rb;
    public float moveSpeed = 8f;

    [SerializeField] private float jumpPower = 8f;
    // Start is called before the first frame update
    void Start()
    {
        DissonityLog("PlayerController player" + JsonUtility.ToJson(player));
        _networkManager = NetworkManager.Instance;
        IsMine = player.isMine();
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    void FixedUpdate()
    {
        // Vector3 (x, y, z)
        rb.velocity = new Vector3(playerInput.x * moveSpeed, rb.velocity.y, playerInput.y * moveSpeed);
        _networkManager.updatePosition(transform.position);
    }

    public void MovePlayer(InputAction.CallbackContext context) {
        if (_networkManager.GameRoom.SessionId != player.sessionId) {
            return;
        }
        playerInput = context.ReadValue<Vector2>();
    }

    public void Jump(InputAction.CallbackContext context) {
        if (_networkManager.GameRoom.SessionId != player.sessionId) {
            return;
        }
        
        if (context.performed) {
            rb.velocity = new Vector3(rb.velocity.x, jumpPower, rb.velocity.z);
        }
    }
}
