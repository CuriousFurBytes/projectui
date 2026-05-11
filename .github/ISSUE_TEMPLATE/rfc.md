---
name: RFC
about: Propose a significant design change
title: "rfc: "
labels: ["rfc"]
---

## Summary

_One or two sentences describing the change. Be specific enough that someone can understand the scope without reading the rest._

## Motivation

Why is this change needed now? What pain does it address? Include concrete examples — a workflow that's awkward today, a component type that can't be expressed, an exporter limitation, etc.

## Detailed Design

_The meat of the RFC. Describe the change in enough detail that a contributor could implement it without asking follow-up questions._

Consider covering:
- Public API / prop changes (new types, modified interfaces)
- Store / state shape changes
- Renderer impact (does the char-grid layout logic change?)
- Exporter impact (which of the three exporters are affected?)
- Migration path for existing project JSON files
- UI surface area (new panels, controls, keyboard shortcuts)

## Drawbacks

Honest reasons NOT to do this. Performance cost, added complexity, scope creep, maintenance burden, breaking changes, etc.

## Alternatives

Other approaches that were considered and why they were rejected. If this RFC closes the door on an alternative, explain why.

## Unresolved Questions

What still needs to be figured out before or during implementation? Flag open decisions that require community input.
