---
trigger: manual
description:
globs:
---

## 1️⃣ Project Rules

### **Isolation by Design**
- Prefer **flow-specific façades** wrapping shared libs.  
- Shared logic lives behind interfaces; swapping implementations should not affect other flows.  
- If a change could alter behavior for another flow, **fork & version**:---
alwaysApply: true
---
