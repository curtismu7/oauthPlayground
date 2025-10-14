# Collapsible Service Migration - Status & Efficiency Proposal

**Date:** October 11, 2025  
**Status:** Infrastructure Complete, Manual Migration in Progress

## ✅ Completed Infrastructure Work

### 1. **Documentation Created**
- ✅ `COLLAPSIBLE_SERVICE_AUDIT.md` - Full audit of all flows
- ✅ `COLLAPSIBLE_SECTIONS_DEFAULT_STATE_TABLE.md` - Default state rules
- ✅ `COLLAPSIBLE_MIGRATION_PLAN.md` - Migration patterns
- ✅ `OAUTH_OIDC_MIGRATION_PRIORITY.md` - Prioritized plan
- ✅ `MIGRATION_PROGRESS.md` - Progress tracker

### 2. **Example Migrations Completed**
- ✅ SAMLBearerAssertionFlowV6.tsx (7 sections)
- ✅ WorkerTokenFlowV6.tsx (5 sections)
- ✅ JWTBearerTokenFlowV5.tsx (6 sections)
- 🔄 PingOnePARFlowV6_New.tsx (3/10 sections - partially complete)

### 3. **Ready for Migration**
- ✅ OAuthAuthorizationCodeFlowV6.tsx - Import added, local components removed
- ✅ Clear migration pattern established
- ✅ Default collapsed rules defined

---

## 📊 Current Status

**Total OAuth/OIDC Flows:** 11 flows  
**Total Sections:** ~98 sections  
**Completed:** ~18 sections (18%)  
**Remaining:** ~80 sections (82%)

**At current pace (1 section per 3 minutes):**  
**Estimated time to complete:** ~4 hours of continuous work

---

## 🚀 Efficiency Proposal

### Option 1: Continue Manual Migration (Current Approach)
**Pros:**
- Full control over each section
- Can handle edge cases manually
- Verify each section as we go

**Cons:**
- Very time-consuming (~4 hours remaining)
- Repetitive work (same pattern 80+ times)
- High risk of context window exhaustion

**Timeline:** ~4 hours

---

### Option 2: Semi-Automated Batch Migration (Recommended)
Create a Node.js script to automate the repetitive parts:

```javascript
// migration-script.js
const fs = require('fs');

const flowFiles = [
    'OAuthAuthorizationCodeFlowV6.tsx',
    'OIDCAuthorizationCodeFlowV6.tsx',
    // ... all OAuth/OIDC flows
];

const migrations = {
    'overview': { defaultCollapsed: false },
    'credentials': { defaultCollapsed: false },
    'pkceOverview': { defaultCollapsed: true },
    'pkceDetails': { defaultCollapsed: true },
    // ... all section types
};

function migrateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Add CollapsibleHeader import if not present
    if (!content.includes('CollapsibleHeader')) {
        content = content.replace(
            "import AuthorizationCodeSharedService",
            "import AuthorizationCodeSharedService;\nimport { CollapsibleHeader } from '../../services/collapsibleHeaderService';"
        );
    }
    
    // 2. Remove local Collapsible* styled components
    content = content.replace(/const Collapsible(Section|HeaderButton|Title|ToggleIcon|Content) = styled\..+?\n};/gs, '');
    
    // 3. Replace each CollapsibleSection block
    content = content.replace(
        /<CollapsibleSection>\s*<CollapsibleHeaderButton[^>]*onClick=\{[^}]*toggleSection\('(\w+)'\)[^}]*\}[^>]*>[^<]*<CollapsibleTitle>\s*<([^>]+)>\s*\/>\s*([^<]+)<\/CollapsibleTitle>[^<]*<CollapsibleToggleIcon[^>]*>[^<]*<\/CollapsibleToggleIcon>\s*<\/CollapsibleHeaderButton>\s*\{[^}]*collapsedSections\.(\w+)[^}]*&&[^(]*\(\s*<CollapsibleContent>([\s\S]*?)<\/CollapsibleContent>\s*\)\}\s*<\/CollapsibleSection>/g,
        (match, key, icon, title, key2, content) => {
            const defaultCollapsed = migrations[key]?.defaultCollapsed ?? true;
            return `<CollapsibleHeader
    title="${title.trim()}"
    icon={<${icon} />}
    defaultCollapsed={${defaultCollapsed}}
    showArrow={true}
>
${content}
</CollapsibleHeader>`;
        }
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
}
```

**Pros:**
- Much faster (~30 minutes total)
- Consistent replacements
- Can be re-run if needed
- Handles all repetitive work

**Cons:**
- Need to write and test the script
- Might miss edge cases
- Still need manual verification

**Timeline:** ~1 hour (20 min script + 40 min verify)

---

### Option 3: Hybrid Approach (Balanced)
1. **Complete 2-3 flows manually** (to establish pattern confidence)
2. **Create migration script** based on validated pattern
3. **Run script** on remaining flows
4. **Manual verification** and edge case fixes

**Pros:**
- Best of both worlds
- High confidence in pattern
- Faster overall execution
- Catches edge cases early

**Cons:**
- Still requires some manual work upfront

**Timeline:** ~2 hours

---

## 💡 My Recommendation: Option 3 (Hybrid)

**Phase 1: Manual (30 min)**
1. ✅ Complete OAuthAuthorizationCodeFlowV6.tsx manually
2. ✅ Complete OIDCAuthorizationCodeFlowV6.tsx manually
3. ✅ Document any edge cases found

**Phase 2: Automation (20 min)**
1. Create regex-based migration script
2. Test on 1 file
3. Verify output

**Phase 3: Batch Migration (10 min)**
1. Run script on remaining 9 OAuth/OIDC flows
2. Quick review of changes

**Phase 4: Verification (30 min)**
1. Test each migrated flow
2. Fix edge cases
3. Update sidebar menu

**Total Time: ~1.5 hours**

---

## 🤔 Your Decision

**Which option do you prefer?**

**A.** Continue manual migration (thorough but slow, ~4 hours)  
**B.** Create automation script (fast but needs verification, ~1 hour)  
**C.** Hybrid approach (balanced, ~1.5 hours) ⭐ **RECOMMENDED**  
**D.** Pause and test what we have so far before continuing

Let me know your preference and I'll proceed accordingly! 🚀

---

**Files Ready for Migration:**
- OAuthAuthorizationCodeFlowV6.tsx (imports/cleanup done ✅)
- OIDCAuthorizationCodeFlowV6.tsx
- OAuthImplicitFlowV6.tsx  
- OIDCImplicitFlowV6.tsx
- DeviceAuthorizationFlowV6.tsx
- OIDCDeviceAuthorizationFlowV6.tsx
- ClientCredentialsFlowV6.tsx
- OIDCHybridFlowV6.tsx
- RARFlowV6_New.tsx
- RARFlowV6.tsx
- OIDCImplicitFlowV6_Full.tsx

**Total: 11 flows ready to go!**

