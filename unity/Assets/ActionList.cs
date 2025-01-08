using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;

public class RobotAction
{
    public enum ActionType { Navigation, Interaction };  
    public ActionType actionType;
    public string description;
    public string target;
}

public class ActionList : MonoBehaviour
{
    public List<RobotAction> actions = new List<RobotAction>();
    public NavMeshAgent navigationAgent;
    public NavmeshPathDraw navmeshDraw;
    public int currentAction;
    // Start is called before the first frame update
    void Start()
    {
        currentAction = -1;
    }

    // Update is called once per frame
    void Update()
    {
        if (actions.Count > 0)
        {
            if (currentAction == -1)
            {
                // Start the first action
                currentAction = 0;
                ExecuteCurrentAction();
            }
            else
            {
                // Check if the current action is complete
                if (IsCurrentActionComplete())
                {
                    currentAction++;
                    if (currentAction < actions.Count)
                    {
                        ExecuteCurrentAction();
                    }
                    else
                    {
                        // All actions completed
                        currentAction = -1;
                        actions.Clear();
                        Debug.Log("All actions have been completed.");
                    }
                }
            }
        }
    }

    void ExecuteCurrentAction()
    {
        RobotAction action = actions[currentAction];
        Debug.Log($"Executing Action {currentAction}: {action.description}");

        if (action.actionType == RobotAction.ActionType.Navigation)
        {
            GameObject targetObject = GameObject.Find(action.target);
            if (targetObject != null)
            {
                navigationAgent.SetDestination(targetObject.transform.position);
                navmeshDraw.destination = targetObject.transform.position;
            }
            else
            {
                Debug.LogWarning($"Target '{action.target}' not found.");
                // Skip to the next action if the target is not found
                currentAction++;
            }
        }
        else if (action.actionType == RobotAction.ActionType.Interaction)
        {
            // Implement your interaction logic here
            // For example: interaction.InteractWith(action.target);
            Debug.Log($"Interacting with {action.target}");
        }
    }

    bool IsCurrentActionComplete()
    {
        RobotAction action = actions[currentAction];

        if (action.actionType == RobotAction.ActionType.Navigation)
        {
            // Check if the agent has reached its destination
            if (!navigationAgent.pathPending)
            {
                if (navigationAgent.remainingDistance <= navigationAgent.stoppingDistance)
                {
                    if (!navigationAgent.hasPath || navigationAgent.velocity.sqrMagnitude == 0f)
                    {
                        Debug.Log($"Navigation to '{action.target}' complete.");
                        return true;
                    }
                }
            }
            return false;
        }
        else if (action.actionType == RobotAction.ActionType.Interaction)
        {
            // Implement your interaction completion logic here
            // For now, we'll assume the interaction completes immediately
            Debug.Log($"Interaction with '{action.target}' complete.");
            return true;
        }

        return false;
    }
}

