---
title: Project File Format
---

# Project File Format

Projects are stored as JSON. Use **Export JSON** and **Import** in the top bar to save and load files. Old files without `layers` / `timeline` are auto-migrated on load.

## Schema

```json
{
  "rootId": "root_abc",
  "components": {
    "root_abc": { "id": "root_abc", "type": "container" }
  },
  "termCols": 100,
  "termRows": 30,
  "theme": "tokyo-night",
  "layers": [
    {
      "id": "layer_1",
      "name": "Dashboard",
      "rootId": "root_abc",
      "components": {}
    }
  ],
  "activeLayerIndex": 0,
  "timelineSteps": [
    { "id": "step_1", "layerId": "layer_1", "label": "Dashboard" }
  ],
  "timelineTransitions": [
    {
      "id": "trans_1",
      "fromStepId": "step_1",
      "toStepId": "step_2",
      "event": "keypress",
      "trigger": "q"
    }
  ]
}
```

## Fields

| Field | Type | Description |
|-------|------|-------------|
| `rootId` | string | ID of the root component for the active layer |
| `components` | object | Flat map of all components (legacy single-layer format) |
| `termCols` | number | Terminal width in characters |
| `termRows` | number | Terminal height in rows |
| `theme` | string | Active color theme name |
| `layers` | array | List of screen layers, each with its own component tree |
| `activeLayerIndex` | number | Index of the currently active layer |
| `timelineSteps` | array | Ordered list of timeline steps (one per screen) |
| `timelineTransitions` | array | Connections between steps with event and trigger info |
