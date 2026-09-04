# ADR 091: Serial-Controlled Inventory & Asset Conversion Readiness

## Status

**ACCEPTED**

## Context

High-value spare parts (pumps, motors, controllers, meters) require individual serial number tracking while in store, and may transition into permanent Assets upon installation.

## Decision

Create InventorySerial records representing unique physical units in store with bounded statuses (IN_STOCK, RESERVED, ISSUED, CONSUMED, RETURNED, INSTALLED, SCRAPPED, CONVERTED_TO_ASSET). Duplicate serial numbers for the same item are rejected. Serial-tracked issues require exact serial selection. An operational ConvertToAsset command links the serial history to the newly created Asset.

## Consequences

Complete lifecycle lineage from manufacturer receipt, to warehouse bin, to installation inside an operational physical asset.
