// FORGE timeline spec schema (p13; decisions.md D3/D6). Clip length, frame
// size, and transition defaults for the OTIO emitter are CUE-validated.
package forge

#TimelineSpec: {
	clip_seconds:  int & >= 1 & <= 30
	width:         int & >= 64 & <= 4096
	height:        int & >= 64 & <= 4096
	transition:    *"cut" | "xfade"
	xfade_seconds: *1 | int & >= 1 & <= 3
	rate:          *24 | int & >= 1 & <= 120
	rights_line:   string
	_rights_ok:    true
	_rights_ok:    len(rights_line) >= 4
}

spec: #TimelineSpec
