using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class testClickToMove : MonoBehaviour
{
    public UnityEngine.AI.NavMeshAgent navigationAgent;
    public Camera mainCamera;
    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        if (Input.GetMouseButtonDown(0)) {
            RaycastHit hit;
            if (Physics.Raycast(mainCamera.ScreenPointToRay(Input.mousePosition), out hit, 100)) {
                navigationAgent.SetDestination(hit.point);
                Debug.Log("debug hit: " + hit.point);
            }
        }
    }
}
