using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class RobotMotion : MonoBehaviour
{
    private UnityEngine.AI.NavMeshAgent agent;
    private Animator animator;

    public Transform target;

    void Start()
    {
        agent = GetComponent<UnityEngine.AI.NavMeshAgent>();
        animator = GetComponent<Animator>();

        // Disable automatic updates so animation can drive movement
        agent.updatePosition = false;
        agent.updateRotation = false;
    }


    // Update is called once per frame
    void Update()
    {
        // Check if we need to move
        if (agent.remainingDistance > agent.stoppingDistance)
        {
            // Calculate direction to the target
            Vector3 direction = (agent.steeringTarget - transform.position).normalized;
            
            // Calculate the angle between forward direction and target direction
            float angle = Vector3.SignedAngle(transform.forward, direction, Vector3.up);
            Debug.Log("debug angle: " + angle);
            
            // Map angle to 0-1 range where:
            // 0 = left 90 degrees
            // 0.5 = no turn
            // 1 = right 90 degrees
            float turnValue = angle;

            Debug.Log("debug turnValue: " + turnValue);
            // Clamp to ensure we stay in 0-1 range
            turnValue = Mathf.Clamp(turnValue, -90f, 90f);
            animator.SetFloat("Turn", turnValue);
            
            // If we're roughly facing the right direction, start walking
            if (Mathf.Abs(angle) < 25f)
            {
                animator.SetBool("StartTurn", false);
                animator.SetBool("Walk", true);
            }
            else
            {
                animator.SetBool("StartTurn", true);
                animator.SetBool("Walk", false);
            }
        }
        else
        {
            // We've reached the destination, stop walking
            animator.SetBool("Walk", false);
            animator.SetBool("StartTurn", false);
            
            // If we have a target, face it
            if (target != null)
            {
                Vector3 directionToTarget = (target.position - transform.position).normalized;
                float finalAngle = Vector3.SignedAngle(transform.forward, directionToTarget, Vector3.up);
                
                // Set turn parameter for final orientation
                float normalizedFinalAngle = Mathf.Abs(finalAngle) / 180f;
                animator.SetFloat("Turn", normalizedFinalAngle * Mathf.Sign(finalAngle));
            }
            else
            {
                // No target to face, reset turn parameter
                animator.SetFloat("Turn", 0f);
            }
        }
    }

    void OnAnimatorMove()
    {
        // Apply root motion
        transform.position = animator.rootPosition;
        transform.rotation = animator.rootRotation;

        // Sync the NavMeshAgent position
        agent.nextPosition = transform.position;
    }
}
