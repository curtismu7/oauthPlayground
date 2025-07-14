export class VersionManager {
    constructor() {
        this.version = '5.3'; // Update this with each new version
        console.log(`Version Manager initialized with version ${this.version}`);
    }

    getVersion() {
        return this.version;
    }

    getFormattedVersion() {
        return `v${this.version}`;
    }

    updateTitle() {
        // Update the main title
        const title = document.querySelector('h1');
        if (title) {
            // Remove any existing version number
            const baseTitle = title.textContent.replace(/\s*\(v\d+\.\d+\.\d+\)\s*$/, '').trim();
            title.textContent = `${baseTitle} (${this.getFormattedVersion()})`;
        }

        // Update the document title
        document.title = `PingOne User Import ${this.getFormattedVersion()}`;

        // Update the import button text
        this.updateImportButton();

        // Update the top version badge
        this.updateTopVersionBadge();

        // Add version badge to the sidebar above the Ping Identity logo
        this.addSidebarVersionBadge();
    }
    
    updateImportButton() {
        const importButton = document.getElementById('start-import-btn');
        if (importButton) {
            const baseText = importButton.textContent.replace(/\s*\(v\d+\.\d+\.\d+\)\s*$/, '').trim();
            importButton.innerHTML = `<i class="pi pi-upload"></i> ${baseText} (${this.getFormattedVersion()})`;
        }
    }

    updateTopVersionBadge() {
        const versionText = document.getElementById('version-text');
        if (versionText) {
            versionText.textContent = this.getFormattedVersion();
        }
    }

    addSidebarVersionBadge() {
        // Remove existing badges if they exist
        const existingTopLeftBadge = document.getElementById('top-left-version-badge');
        if (existingTopLeftBadge) {
            existingTopLeftBadge.remove();
        }

        const existingSidebarBadge = document.getElementById('sidebar-version-badge');
        if (existingSidebarBadge) {
            existingSidebarBadge.remove();
        }

        // Check if sidebar version badge already exists
        if (document.getElementById('sidebar-version-badge')) {
            return;
        }

        // Create sidebar version badge
        const badge = document.createElement('div');
        badge.id = 'sidebar-version-badge';
        badge.className = 'sidebar-version-badge';
        badge.textContent = this.getFormattedVersion();
        
        // Find the footer and insert the badge just above the Ping Identity logo
        const footer = document.querySelector('.ping-footer');
        if (footer) {
            const footerContainer = footer.querySelector('.footer-container');
            if (footerContainer) {
                // Insert the badge at the beginning of the footer container
                footerContainer.insertBefore(badge, footerContainer.firstChild);
            } else {
                // Fallback: insert at the beginning of the footer
                footer.insertBefore(badge, footer.firstChild);
            }
        } else {
            // Fallback: add to body if footer not found
            document.body.appendChild(badge);
        }
    }
}

// ES Module export
