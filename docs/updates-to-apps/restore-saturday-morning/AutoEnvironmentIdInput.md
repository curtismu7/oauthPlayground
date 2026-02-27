# AutoEnvironmentIdInput — new component

**File:** `src/components/AutoEnvironmentIdInput.tsx`
**Change type:** New file

---

## Purpose

Drop-in replacement for any environment ID `<input>` field. Auto-fills from
the global store on mount, stays reactive, shows an "Auto-filled" badge when
the value came from the store rather than user typing.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | required | Controlled value |
| `onChange` | `(v: string) => void` | required | Change callback |
| `label` | `string` | — | Optional label text |
| `wrapperClassName` | `string` | — | CSS class for outer div |
| `inputClassName` | `string` | — | CSS class for input |
| `showBadge` | `boolean` | `true` | Show "Auto-filled" badge |
| `...rest` | `InputHTMLAttributes` | — | All standard input props forwarded |

## Auto-fill behaviour

- On mount: if `value` is empty and the global store has an envId, calls `onChange(autoEnvId)`
- While mounted: if the global store updates and the field still holds the previous auto-filled value, updates to the new value automatically
- If the user manually edits the field, the auto-fill tracking stops so manual input is not overridden

## Example

```tsx
import { AutoEnvironmentIdInput } from '../../components/AutoEnvironmentIdInput';

<AutoEnvironmentIdInput
  label="Environment ID"
  value={environmentId}
  onChange={setEnvironmentId}
/>
```

## Rollback

Delete the file. Replace any `<AutoEnvironmentIdInput>` usage with a standard
`<input type="text">` element and remove the import.
