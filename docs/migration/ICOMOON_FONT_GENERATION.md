# IcoMoon Font Generation Guide

**Task:** Generate Material Design Icons subset for OAuth Playground

**Status:** Ready to start

---

## Step 1: Prepare Icon List

You need exactly **22 icons** from Material Design Icons. Copy this list:

```
account-key-outline
alert
alert-circle
alert-decagram
auto-fix
book-open-page-variant
cellphone
cellphone-key
check-circle
chevron-down
chevron-up
code-braces
comment-text-outline
email-outline
eye-off-outline
eye-outline
face-agent
fingerprint
flag
phone-outline
puzzle-outline
usb-flash-drive
```

---

## Step 2: Go to IcoMoon

1. Open https://icomoon.io/app
2. Click **"Import Icons"** button (top left)

---

## Step 3: Import Material Design Icons

**Option A: Use MDI SVG Set (Recommended)**

1. Download Material Design Icons SVG set:
   - Go to: https://github.com/Templarian/MaterialDesign-SVG/tree/master/svg
   - Or use: https://pictogrammers.com/library/mdi/

2. Download only the 22 icons you need (from the list above)

**Option B: Use Pre-built MDI Library**

1. In IcoMoon, click **"Add Icons from Library"**
2. Search for **"Material Design Icons"**
3. Select the MD Icons library
4. The full set will load (5000+ icons)

---

## Step 4: Select Your Icons

For each icon in your list, search and select it:

1. Use the search box in IcoMoon
2. Type the icon name (e.g., "check-circle")
3. Click the icon to select it (yellow border appears)
4. **Repeat for all 22 icons**

**Quick Selection Checklist:**
- [ ] account-key-outline
- [ ] alert
- [ ] alert-circle
- [ ] alert-decagram
- [ ] auto-fix
- [ ] book-open-page-variant
- [ ] cellphone
- [ ] cellphone-key
- [ ] check-circle ✓ (most important - fixes "ea09" issue)
- [ ] chevron-down
- [ ] chevron-up
- [ ] code-braces
- [ ] comment-text-outline
- [ ] email-outline
- [ ] eye-off-outline
- [ ] eye-outline
- [ ] face-agent
- [ ] fingerprint
- [ ] flag
- [ ] phone-outline
- [ ] puzzle-outline
- [ ] usb-flash-drive

---

## Step 5: Generate Font

1. Click **"Generate Font"** button (bottom right corner)
2. You should see all 22 icons in the preview

---

## Step 6: Configure Font Settings

1. Click **"Preferences"** (gear icon at the bottom)
2. Set these values:

   **Font Name:** `webfont`
   
   **Class Prefix:** `mdi-`
   
   **CSS Selector:** Use class
   
   **Enable these options:**
   - ✅ Support IE 8
   - ✅ Encode & Embed font in CSS
   
3. Click **"Close"**

---

## Step 7: Verify Unicode Mappings

**CRITICAL:** Make sure the Unicode values match your CSS file.

In the font generation view:
1. Find **"check-circle"** icon
2. Click the icon
3. Look at the **character code** field
4. Change it to: `ea09` (to match your CSS)

**Do this for ALL icons with these mappings:**

| Icon | Unicode | Hex |
|------|---------|-----|
| account-key-outline | ea01 | \ea01 |
| alert | ea02 | \ea02 |
| alert-circle | ea03 | \ea03 |
| alert-decagram | ea04 | \ea04 |
| auto-fix | ea05 | \ea05 |
| book-open-page-variant | ea06 | \ea06 |
| cellphone | ea07 | \ea07 |
| cellphone-key | ea08 | \ea08 |
| check-circle | **ea09** | **\ea09** |
| chevron-down | ea0a | \ea0a |
| chevron-up | ea0b | \ea0b |
| code-braces | ea0c | \ea0c |
| comment-text-outline | ea0d | \ea0d |
| email-outline | ea0e | \ea0e |
| eye-off-outline | ea0f | \ea0f |
| eye-outline | ea10 | \ea10 |
| face-agent | ea11 | \ea11 |
| fingerprint | ea12 | \ea12 |
| flag | ea13 | \ea13 |
| phone-outline | ea14 | \ea14 |
| puzzle-outline | ea15 | \ea15 |
| usb-flash-drive | ea16 | \ea16 |

**To set character codes in IcoMoon:**
- Click each icon in the font preview
- Enter the hex value in the "Code" field (e.g., ea09)
- Press Enter

---

## Step 8: Download Font

1. Click **"Download"** button (bottom right)
2. A ZIP file will download: `icomoon.zip`

---

## Step 9: Extract and Install

Open Terminal and run:

```bash
# Navigate to Downloads
cd ~/Downloads

# Extract the ZIP
unzip -o icomoon.zip -d icomoon-font

# Navigate to fonts directory
cd icomoon-font/fonts

# Copy files to your project
cp icomoon.woff2 /Users/cmuir/P1Import-apps/oauth-playground/public/icons/materialdesignicons-subset.woff2

cp icomoon.woff /Users/cmuir/P1Import-apps/oauth-playground/public/icons/materialdesignicons-subset.woff

cp icomoon.ttf /Users/cmuir/P1Import-apps/oauth-playground/public/icons/materialdesignicons-subset.ttf

cp icomoon.eot /Users/cmuir/P1Import-apps/oauth-playground/public/icons/materialdesignicons-subset.eot

cp icomoon.svg /Users/cmuir/P1Import-apps/oauth-playground/public/icons/materialdesignicons-subset.svg

# Verify files were copied
ls -lh /Users/cmuir/P1Import-apps/oauth-playground/public/icons/
```

---

## Step 10: Verify Installation

```bash
# Start dev server
cd /Users/cmuir/P1Import-apps/oauth-playground
npm run dev
```

1. Open https://api.pingdemo.com:3000/dashboard
2. Look for the status badge that previously showed "ea09"
3. It should now show a **check-circle icon** ✓
4. Open DevTools → Network tab
5. Filter by "woff"
6. You should see `materialdesignicons-subset.woff2` with **200 status**

---

## Troubleshooting

### "Icon still shows ea09"

**Cause:** Font file not loading or Unicode mapping wrong

**Fix:**
1. Check Network tab - is the .woff2 file loading? (200 status)
2. Check the character code for check-circle in IcoMoon matches `ea09`
3. Clear browser cache
4. Hard refresh: Cmd+Shift+R

### "Font file returns 404"

**Cause:** File not in correct location

**Fix:**
```bash
# Verify files exist
ls -la /Users/cmuir/P1Import-apps/oauth-playground/public/icons/

# Should see all 5 files:
# materialdesignicons-subset.woff2
# materialdesignicons-subset.woff
# materialdesignicons-subset.ttf
# materialdesignicons-subset.eot
# materialdesignicons-subset.svg
```

### "Wrong icons appear"

**Cause:** Unicode mappings don't match CSS

**Fix:**
- Re-download from IcoMoon
- Double-check character codes match the table in Step 7

---

## Success Criteria

✅ All 5 font files in `public/icons/`  
✅ Dashboard shows ✓ icon instead of "ea09"  
✅ Network tab shows .woff2 file loads successfully (200)  
✅ No console errors related to fonts  
✅ All Icon components render correctly site-wide  

---

## File Size Expectations

Your subset font should be very small:

- **woff2:** ~3-5 KB (smallest, modern browsers)
- **woff:** ~4-6 KB (older browsers)
- **ttf:** ~5-8 KB (fallback)
- **eot:** ~5-8 KB (IE8-11)
- **svg:** ~8-12 KB (legacy iOS)

If files are >50KB, you may have selected too many icons.

---

## Next Steps After Completion

Once font files are installed:

1. Update migration doc status:
   - Mark Task 1.1 as COMPLETE ✅
   - Mark Task 1.4 (smoke test) as COMPLETE ✅

2. Test on multiple pages:
   - Dashboard
   - Auto-Discover page
   - Any page using `<Icon />` component

3. Commit the changes:
   ```bash
   git add public/icons/
   git commit -m "feat: Add Material Design Icons font subset (22 icons, ~20KB total)"
   ```

---

**Last Updated:** February 27, 2026
