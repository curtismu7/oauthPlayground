# Migration Guides

Guides for migrating between versions and updating to new systems.

## Available Migrations

### [V5 to V6](v5-to-v6/)
Major version upgrade with breaking changes:
- New credential storage system
- Updated flow components
- API changes
- Configuration updates

### [V6 to V7](v6-to-v7/)
Latest version with enhanced features:
- Improved credential isolation
- Worker token management
- Enhanced UI components
- Performance improvements

### [Credential Storage](credential-storage/)
Migrating to the new credential storage system:
- From old credentialManager to CredentialStorageManager
- Flow-specific credential migration
- Worker token credential migration
- Data backup and recovery

## Migration Process

### Before You Start

1. **Backup your data**: Export all credentials
2. **Review breaking changes**: Read the migration guide
3. **Test in development**: Never migrate production first
4. **Plan downtime**: Some migrations require brief downtime

### General Steps

1. Read the specific migration guide
2. Backup current configuration and credentials
3. Update dependencies
4. Run migration scripts
5. Test all flows
6. Verify credentials
7. Deploy to production

### Rollback Plan

Each migration guide includes:
- Rollback instructions
- Data recovery procedures
- Common issues and fixes
- Support contacts

## Migration Tools

- **Credential Export/Import**: Backup and restore credentials
- **Migration Scripts**: Automated data migration
- **Validation Tools**: Verify migration success
- **Debug Panel**: Inspect storage state

## Getting Help

If you encounter issues during migration:
1. Check the troubleshooting section in the migration guide
2. Review the [troubleshooting guides](../guides/troubleshooting/)
3. Check for known issues in the changelog
4. Contact support with debug information

## Post-Migration

After successful migration:
- Verify all flows work correctly
- Test credential persistence
- Check worker token functionality
- Update documentation
- Train team members on changes
