// src/flows/framework/tokens.ts
//
// Back-compat shim. The design tokens moved to src/design/tokens.ts (the neutral,
// app-wide home). This re-export keeps every existing flows2 importer working.

export { tokens } from '../../design/tokens';
