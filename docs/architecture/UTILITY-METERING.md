# Utility Metering, Readings & Validation Engine

## Core Mechanics
1. **Meter Types**: Main, Sub-meter, Generation, Export, Flow, Virtual.
2. **Assignments**: Effective-dated links to Units, Common Areas, Amenities, and Assets.
3. **Replacements**: Decommissions old meter with final reading, commissions new meter with opening reading, and transfers active assignments atomically.
4. **Validation**: Detects negative deltas, handles rollover at maximum counter value, rejects unauthorized resets, and enforces multiplier snapshots.
