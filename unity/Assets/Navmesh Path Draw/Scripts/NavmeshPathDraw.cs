using UnityEngine;
using UnityEngine.AI;

[RequireComponent(typeof(LineRenderer))]

public class NavmeshPathDraw : MonoBehaviour
{
    [Tooltip("Position of the end destination.")]
    public Vector3 destination;

    [Tooltip("If set to true, the pathfinding will be recalculated every set amount of time.")]
    public bool recalculatePath = true;

    [Tooltip("The amount of time in seconds to recalculate the path. The higher the number, the more performant on CPU but slower to pathfind. It all depends on your game and target hardware. It's usually best to keep this from 0.1 - 0.5 seconds.")]
    public float recalculationTime = 0;

    public LayerMask groundLayers;

    [Tooltip("Offset the height of the rendered path draw.")]
    public float offsetHeight = 0;


    NavMeshPath path;
    LineRenderer lr;

    float time = 0f;
    bool stopped = false;


    void Awake()
    {
        lr = GetComponent<LineRenderer>();
        lr.useWorldSpace = true;
        path = new NavMeshPath();

        if (lr.materials.Length == 0) {
            lr.material = Resources.Load("material/path_mat", typeof(Material)) as Material;
        }

        Draw();
    }


    void Update()
    {
        if (!recalculatePath) return;

        if (!stopped) time += Time.deltaTime;

        if (time >= recalculationTime && !stopped) {
            time = 0f;
            Draw();
        }
    }
    
    // draw the path
    public void Draw()
    {
        if (destination == Vector3.zero) return;


        stopped = false;        
            
        Vector3 validatedDesPos;
        Vector3 validatedOriginPos;


        // validate destination position
        validatedDesPos = DownwardRay(destination);
                
        // validate origin position
        validatedOriginPos = DownwardRay(transform.position);


        NavMesh.CalculatePath(validatedOriginPos, validatedDesPos, NavMesh.AllAreas, path);
        Vector3[] corners = path.corners;
        int max = corners.Length;

        for (int i=0; i<max; i++) {
            corners[i] = corners[i] + new Vector3(0, offsetHeight, 0);
        }
        
        lr.positionCount = max;
        lr.SetPositions(corners);
    }


    // stop drawing the path
    public void Stop()
    {
        stopped = true;
        lr.positionCount = 0;
    }


    // get point of downward ray
    Vector3 DownwardRay(Vector3 origin)
    {
        RaycastHit downHit;

        if (Physics.Raycast(origin, -Vector3.up, out downHit, Mathf.Infinity, groundLayers)) {
            return new Vector3(origin.x, downHit.transform.position.y, origin.z);
        }

        return origin;
    }
}
