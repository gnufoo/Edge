using System.Collections;
using System.Collections.Generic;
using UnityEngine.Networking;
using System.Text;
using UnityEngine;
using Newtonsoft.Json.Linq;
using TMPro;
using System;


// deepseek api key: sk-a0b6775d70714faca9425b3d088f2927
public class Interaction : MonoBehaviour
{
    public TMP_InputField inputField;
    public TMP_Text outputText;
    public ActionList actor;
    public void OnEndEdit(string text)
    {
        StartCoroutine(SendDeepSeekChatRequest(inputField.text));
        outputText.text = outputText.text + "User: " + inputField.text + "\n";
        // Debug.Log("end edit: " + inputField.text);
    }
    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    private string GatheringNavigationPoints()
    {
        // get all the navigation points
        NavigationPoint[] navigationPoints = FindObjectsOfType<NavigationPoint>();
        string navigationPointsString = "";
        foreach (NavigationPoint navigationPoint in navigationPoints)
        {
            navigationPointsString += navigationPoint.name + ": " + navigationPoint.description;
        }
        return navigationPointsString;
    }

    private string ContentBuilder()
    {
        string content = "";
        content += "You are a robot with the ability to perform actions. Here are the navigation points: " + GatheringNavigationPoints();
        content += "if you decided to perform navigation, please reply within the ACTIONLIST the format 'navigation: <navigation point name>'";
        content += "if you decided to perform interaction, please reply within the ACTIONLIST the format 'interaction: <interaction point name>'";
        content += "generate a TEXTREPLY and a ACTIONLIST for the user's input. The action list should be a list of actions that the robot can perform. The text reply should be a friendly and helpful reply to the user's input.";
        return content;
    }

    private IEnumerator SendDeepSeekChatRequest(string text)
    {
        // The URL endpoint
        string url = "https://api.deepseek.com/chat/completions";

        // Your DeepSeek API Key
        string apiKey = "sk-a0b6775d70714faca9425b3d088f2927";

        // Prepare the JSON body for the request
        string jsonBody = @"
        {
            ""model"": ""deepseek-chat"",
            ""messages"": [
                { ""role"": ""system"", ""content"": """ + ContentBuilder() + @""" },
                { ""role"": ""user"", ""content"": """ + text + @""" }
            ],
            ""temperature"": 0,
            ""stream"": false
        }";

        // Debug.Log(jsonBody);

        // Convert JSON string to bytes
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonBody);

        // Create a UnityWebRequest with the POST method
        using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
        {
            // Set the headers
            request.SetRequestHeader("Content-Type", "application/json");
            request.SetRequestHeader("Authorization", "Bearer " + apiKey);

            // Set the body to send
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();

            // Send the request and wait for response
            yield return request.SendWebRequest();

            // Check for errors
#if UNITY_2020_2_OR_NEWER
            if (request.result == UnityWebRequest.Result.ConnectionError 
                || request.result == UnityWebRequest.Result.ProtocolError)
#else
            if (request.isNetworkError || request.isHttpError)
#endif
            {
                Debug.LogError("Error: " + request.error);
            }
            else
            {
                // Get the response text
                string responseText = request.downloadHandler.text;
                JObject response = JObject.Parse(responseText);
                string content = response["choices"][0]["message"]["content"].ToString();
                ParseContent(content, out string textReply, out List<string> actionList);

                outputText.text = outputText.text + "Robot: " + textReply + "\n";
                
                List<RobotAction> robotActions = new List<RobotAction>();
                foreach (string action in actionList) {
                    RobotAction robotAction = new RobotAction();
                    if (action.ToLower().Contains("navigation")) {
                        robotAction.actionType = RobotAction.ActionType.Navigation;
                    } else {
                        robotAction.actionType = RobotAction.ActionType.Interaction;
                    }
                    robotAction.description = action;
                    robotAction.target = action.Substring(action.IndexOf(":")+1).Trim();
                    robotActions.Add(robotAction);
                }
                actor.actions = robotActions;
            }
        }
    }

    private void ParseContent(string content, out string textReply, out List<string> actionList)
    {
        textReply = "";
        actionList = new List<string>();

        // Split the content into lines
        string[] lines = content.Split(new[] { '\n' }, StringSplitOptions.RemoveEmptyEntries);

        bool isActionList = false;
        foreach (var line in lines)
        {
            // Debug.Log("debug line: " + line);
            if (line.StartsWith("ACTIONLIST:"))
            {
                isActionList = true;
                continue;
            }

            if (isActionList)
            {
                // It's part of the action list
                actionList.Add(line.Trim());
            }
            else if (line.StartsWith("TEXTREPLY:"))
            {
                textReply = line.Substring(line.IndexOf("TEXTREPLY:") + 10);
            }
        }
    }
}


