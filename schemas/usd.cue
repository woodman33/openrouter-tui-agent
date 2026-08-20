// TIMMY USD geometry spine (V-02 rung 1, v0.7.7) — typed parametric 3D
// scene description. Compiles to a deterministic .usda stage (native
// UsdGeom prims) plus an OpenSCAD CSG script for boolean trees; the stage
// is content-hashed so handoffs are sha-pinnable like every other artifact.
package usdcue

#Prim: {
	id:        string & != ""
	kind:      "cube" | "sphere" | "cylinder"
	size?:     [...number]          // cube extents (3)
	radius?:   number & > 0
	height?:   number & > 0
	translate?: [...number]
	rotate?:    [...number]
	color?:     [...number]         // rgb 0..1
	op?:        "union" | "difference" | "intersection"
	children?: [...#Prim]           // CSG tree (requires op)
}

#Scene: {
	schema_version: "usd/0.1"
	name:           string & != ""
	meters_per_unit: number & > 0
	up_axis:         "Y" | "Z"
	root?:          string & != "" // stage root prim (default "World")
	prims: [...#Prim]
}
