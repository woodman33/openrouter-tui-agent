# Multimodal Runtime

TIMMY's multimodal runtime is organized around clear planes of responsibility. The registry can describe providers from each plane without importing SDKs or making provider calls.

## Control Plane

Cloudflare is the control plane. It owns orchestration boundaries, Worker deployment, Durable Object state, queues, edge receipts, and high-level coordination between local TIMMY clients and hosted workflows.

Cloudflare should answer questions such as:

- Which run exists?
- Which receipt events have been recorded?
- Which queue or Worker should receive the next step?
- Which edge resource is responsible for state or delivery?

It should not become a dumping ground for private Spark hostnames, local NAS paths, or raw provider secrets.

## Private Compute Plane

Sparks are the private compute plane. A Spark runner can execute sensitive jobs near private data, private credentials, local models, or internal storage without sending source artifacts to external media providers.

Spark metadata belongs in the provider registry so TIMMY can audit readiness, but Spark runtime integration should remain explicit and opt-in.

## Burst Compute Plane

Modal is the burst compute plane. It is useful for short-lived external compute jobs that are too heavy for the local TUI process and do not need the privacy boundary of Sparks.

The registry stores Modal as metadata only. TIMMY does not import the Modal SDK or call Modal APIs in the current runtime.

## Delivery Plane

Mux is the replay and video delivery plane. It can be used later to publish sanitized run replays, rendered demos, or video artifacts derived from receipts.

Mux should receive publishable output artifacts, not raw secrets, private receipts, local tunnels, or unredacted terminal captures.

## External Artifact Generators

Media generation providers are external artifact generators. This group includes fal, RunComfy, ComfyDeploy, Kling, and Higgsfield.

Use them for generated images, videos, motion clips, or ComfyUI-style workflows when the artifact can safely leave the private compute plane. Keep private data on Sparks and NAS unless an operator explicitly moves sanitized inputs outward.

## Realtime Media

Agora and VideoSDK are metadata-only realtime media transport providers. They can support future live collaboration or session streaming, but they are not required by the current TIMMY runtime.
