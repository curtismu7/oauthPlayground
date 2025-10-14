# Section Header Color & Icon Reference

| Theme Attribute | Color | Icon Component | Usage |
|-----------------|-------|----------------|-------|
| `theme="orange"` | 🟠 Orange | `<FiSettings />` | Configuration and credentials sections |
| `theme="blue"` | 🔵 Blue | `<FiSend />` | Flow execution steps and request actions |
| `theme="yellow"` | 🟡 Yellow | `<FiBook />` | Educational sections (1st, 3rd, 5th, …) |
| `theme="green"` | 🟢 Green | `<FiBook />` (education) / `<FiCheckCircle />` (success) | Educational sections (2nd, 4th, 6th, …) and success/completion summaries |
| `theme="highlight"` or omitted | 💙 Default | `<FiPackage />` | Results, responses, and received tokens |

Use this table when migrating any flow to the new `CollapsibleHeader` service to ensure consistent visuals across configuration, education, execution, and results sections.
