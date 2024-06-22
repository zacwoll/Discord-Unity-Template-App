using TMPro;
using UnityEngine;
using static Dissonity.Api;

public class ParticipantsUpdate : MonoBehaviour
{
    int lastParticipantCount;
    public TMP_Text text;
    async void Start()
    {
        DissonityLog("ParticipantsUpdate Start()");
        text.text = "ParticipantsUpdate Start()\n";
        lastParticipantCount = (await GetInstanceParticipants()).participants.Length;

        DissonityLog($"There are {lastParticipantCount} users");

        // Discord may send an event multiple times, so if you're
        // just trying to detect when a user joins or leaves, don't
        // do anything when (lastParticipantCount == data.participants.Length)
        SubActivityInstanceParticipantsUpdate((data) => {
            if (lastParticipantCount == data.participants.Length)
            {
                return;
            }

            //? Someone left
            if (data.participants.Length < lastParticipantCount)
            {
                lastParticipantCount = data.participants.Length;

                DissonityLog("Received a user leave!");
            }

            //? Some joined
            else if (data.participants.Length > lastParticipantCount)
            {
                lastParticipantCount = data.participants.Length;
                
                DissonityLog("Received a new user!");
            }
        });
    }
}
