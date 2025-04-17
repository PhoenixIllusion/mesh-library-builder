
# Mesh Library builder

This plugin was written for use in Godot 4.x

This is a tool for [Godot Engine](https://godotengine.org) to create [MeshLibrary](https://docs.godotengine.org/en/stable/classes/class_meshlibrary.html)s for use in [GridMaps](https://docs.godotengine.org/en/stable/classes/class_gridmap.html)

This tool uses [ThreeJS](https://threejs.org/) for rendering of data and [Three-Mesh-BVH](https://github.com/gkjohnson/three-mesh-bvh/) for assisting in bounding-box creation.


## Usage:

View: https://phoenixillusion.github.io/mesh-library-builder/

### Mesh Library Editor: https://phoenixillusion.github.io/mesh-library-builder/mesh-library-editor.html
* Open a directory or zip of GLTF models
  * Models must have the structure
    * Previews
    * Models/GLB format
    * Models/GLTF format
      * Textures (if required)

Files will be stored to the Browser and added as a tab in the "Toolbox".
Create a MeshLibrary map, and specify the width/height of the grid.
Drag models up to the grid to place them in the MeshLibrary.

Once configured with the Model Editor to add collision objects as desired, use the Export functionality.

* Export - GLTF
  * This will export a GLTF that Godot can load to use as a MeshLibrary
  * Tiled PNG - This is a tilemap of the available previews
  * Tiled TSX - This is an associated TSX file to use for a Tiled map

### Model Editor: https://phoenixillusion.github.io/mesh-library-builder/model-editor.html

Select or load a model collection to the Model Editor
Using the top-right options, configure the model for Collision Maps with one of the options:
* Bounding Box
* BVH Bounding Box (will attempt to fit the triangles into smaller but more numerous boxes)
* Convex Hull
* Mesh


### GridMap Preview: https://phoenixillusion.github.io/mesh-library-builder/gridmap-viewer.html

Use the avaible menu to open up a TSCN that has a GridMap in it to preview the gridmap.
You must first open the file, then use the drop-down to select one of the available MeshLibraries you have in the browser's IDB storage.


## Features:

Included in the repo is a `tiled-extension` is a file [`dist/tiled-godot-gridmap.js`](./tiled-extension/dist/tiled-godot-gridmap.js).
By placing this in the [Tiled ScriptExtensions directory](https://docs.mapeditor.org/en/stable/manual/scripting/#scripted-extensions) you can enable limited support for editing of GridMaps in a TSCN using the TiledEditor in combination with the above "Export Tiled PNG & TSX". Tiled will expect a TSX file of the same name as the TSCN's referenced `<MeshLibrary>.tres` .

## Options:

