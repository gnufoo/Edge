using UnityEngine;

public class DrawAndStopInputs : MonoBehaviour
{
    public Transform destinationTransform;
    public NavmeshPathDraw navmeshDraw;


    void Start()
    {
        navmeshDraw.destination = destinationTransform.position;
    }

    void Update()
    {
        if(Input.GetKeyDown(KeyCode.S)){
            navmeshDraw.Stop();
        }

        if(Input.GetKeyDown(KeyCode.A)){
            navmeshDraw.Draw();
        }
    }
}
