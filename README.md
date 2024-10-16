![image](https://github.com/user-attachments/assets/84efb547-908a-4c25-a15e-7ea469b843b3)

This app is for verifying that the arrangement and pipe routing can be performed in real-time in a web-based environment.

This example gets information about the relationship of the target objects that need to be connected and the diameter of the pipe from the Connection data, and the size and location of the target objects from the data. (from GunnerusData.js and GunnerusConnection.js.)

The pipe connecting each object is determined through the A* algorithm, and currently, minimization of pipe length is used as the objective function. This app will add various pipe path generation algorithms and objective functions in the future, and aims to optimize arrangements that minimize pipe costs. The research used in this app is based on the prior study (Method for pipe routing using the expert system and the heuristic pathfinding algorithm in shipbuilding (Ha et al. 2023)).
This app is implementing the methods and examples proposed in the paper and plans to make it publicly available on the web.
Features:

Currently grid size is 10cm, but it can be parametrized in the future.
Simple A* algorithm is used for pipe routing now.
We have a plan to develop a new grid-based pipe routing algorithm for web-app.
Click and drag a block to change its position and update its location used information and matches.
Connections between blocks are designed to be centroid-to-center connections. If we get information about the connection, we will update it to route the pipe to connect to the nozzle of the block or equipment.
