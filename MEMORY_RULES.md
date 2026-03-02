# Memory Management Rules for OAuth Playground

## 🧠 Memory System Requirements

### **Project Memory Structure**
This project uses a granular memory system designed for large applications:

```
project/
├── memory.md                    # Lightweight project memory (under 100 lines)
├── docs/
│   └── adr/                    # Architecture Decision Records
│       ├── 001-multi-version-services.md
│       ├── 002-biome-first.md
│       └── 003-service-contracts.md
└── plan/
    └── v7-cleanup-migration.md  # Implemented plans with status
```

### **MANDATORY: Memory Updates**

You **MUST** update the memory system when:

#### **1. Major Architectural Decisions**
- Create new ADR in `docs/adr/` with format `XXX-decision-name.md`
- Update `memory.md` with brief summary and reference
- Include tradeoffs, context, and consequences

#### **2. Migration Milestones**
- Update relevant plan files with progress
- Update `memory.md` metrics and status
- Mark completed items

#### **3. Quality Standard Changes**
- Document new standards in ADRs
- Update `memory.md` with impact
- Include implementation results

#### **4. Service Contract Changes**
- Update service documentation
- Reference in `memory.md` summary
- Note breaking changes

#### **5. Session Context**
- At start of session: Read `memory.md` for context
- During session: Update progress and decisions
- At end of session: Update next steps and status

### **When to Create ADRs**
Create ADRs for:
- Major architectural decisions
- Significant tradeoffs made
- Migration strategies
- Quality standards changes
- Service architecture changes

### **When to Update Plans**
Update plan files for:
- Multi-phase implementation work
- Complex migration projects
- Major refactoring efforts
- Quality improvement initiatives

### **Memory Update Process**

#### **At Session Start**
1. Read `memory.md` for project context
2. Review relevant ADRs for recent decisions
3. Check plan files for current implementation status
4. Understand current priorities and blockers

#### **During Development**
1. For major decisions: Create ADR first, then update memory.md
2. For progress: Update plan files, then memory.md
3. For issues: Document in ADRs, reference in memory.md
4. For next steps: Update memory.md session notes

#### **At Session End**
1. Update memory.md with session results
2. Update plan files with completed work
3. Create new ADRs for any major decisions made
4. Set clear next session priorities

### **Content Guidelines**

#### **memory.md** (Keep under 100 lines)
- Project status and metrics
- Recent major decisions (summary)
- Current session context
- Next session priorities
- References to detailed documentation

#### **ADRs** (Detailed decisions)
- Context and problem
- Decision made
- Consequences (positive/negative)
- Implementation details
- Related decisions

#### **Plan Files** (Implementation tracking)
- Phases and status
- Metrics and results
- Blockers and risks
- Next steps

### **What NOT to Include**
- Method signatures (in source files)
- Function lists (in source files)
- Config values (in config files)
- Dependencies (in package.json)
- Detailed explanations (use ADRs)

### **Quality Standards**
- Keep memory.md concise and scannable
- Make ADRs comprehensive but focused
- Maintain plan files with clear status
- Use consistent formatting and structure
- Always include file references

### **Failure Modes to Avoid**
- ❌ Forgetting to update memory after major decisions
- ❌ Letting memory.md grow beyond 100 lines
- ❌ Creating ADRs for minor decisions
- ❌ Not updating plan files with progress
- ❌ Losing context between sessions

### **Success Indicators**
- ✅ New sessions get context quickly from memory.md
- ✅ Major decisions are preserved in ADRs
- ✅ Implementation progress is trackable in plans
- ✅ Memory system stays maintainable
- ✅ No architectural knowledge is lost

---

## 🎯 Current Project Context

### **Recent Achievements**
- V7 flows: 100% Biome clean ✅
- Service architecture: Complete V7-V8-V9 mapping ✅
- Memory system: Granular approach implemented ✅

### **Current Priorities**
1. Execute V7→V9 migration
2. Replace V8 dependencies with V9
3. Archive unused services
4. Maintain code quality standards

### **Key Files**
- `memory.md` - Project memory and context
- `V7_V8_V9_SERVICES_CONTRACTS.md` - Complete service documentation
- `docs/adr/` - Architecture decision records
- `plan/` - Implementation plans and status

---

**REMEMBER: The memory system is critical for project continuity. Always update it when making significant decisions or progress.**
