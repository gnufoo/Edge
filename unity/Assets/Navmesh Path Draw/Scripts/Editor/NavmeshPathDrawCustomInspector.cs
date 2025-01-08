using UnityEngine;
using UnityEditor;

[CustomEditor(typeof(NavmeshPathDraw))]
public class NavmeshPathDrawCustomInspector : Editor
{
    SerializedProperty destination,
    recalculatePath,
    recalculationTime,
    groundLayers,
    offsetHeight;

    void OnEnable(){
        destination = serializedObject.FindProperty("destination");
        recalculatePath = serializedObject.FindProperty("recalculatePath");
        recalculationTime = serializedObject.FindProperty("recalculationTime");
        groundLayers = serializedObject.FindProperty("groundLayers");
        offsetHeight = serializedObject.FindProperty("offsetHeight");
    }


    public override void OnInspectorGUI(){
        var button = GUILayout.Button("Click for more tools");
        if (button) Application.OpenURL("https://bit.ly/3CyjBzT");
        EditorGUILayout.Space(10);

        NavmeshPathDraw script = (NavmeshPathDraw) target;

        EditorGUILayout.PropertyField(destination);
        EditorGUILayout.PropertyField(recalculatePath);
        
        EditorGUI.BeginDisabledGroup(script.recalculatePath == false);
            EditorGUILayout.PropertyField(recalculationTime);
        EditorGUI.EndDisabledGroup ();

        EditorGUILayout.PropertyField(groundLayers);

        EditorGUILayout.PropertyField(offsetHeight);
        

        serializedObject.ApplyModifiedProperties();
    }
}
