---
name: filesystem-mcp
command: npx
args: ["@modelcontextprotocol/server-filesystem"]
env:
  FILESYSTEM_ROOT: "${FILESYSTEM_ROOT:-/}"
  FILESYSTEM_READONLY: "${FILESYSTEM_READONLY:-false}"
envFile: .claude/.env
description: Local filesystem access server for file operations
category: codebase
status: active
version: ">=1.0.0"
---

# Filesystem MCP Server

## Description

The Filesystem MCP Server provides secure, controlled access to the local filesystem through the Model Context Protocol. It enables file operations, directory navigation, and content management with configurable permissions and boundaries.

## Features

- **File Operations**: Read, write, create, delete files
- **Directory Navigation**: List, traverse, create directories
- **Permission Control**: Configurable read-only or read-write access
- **Path Restrictions**: Limit access to specific directories
- **Metadata Access**: File stats, permissions, timestamps
- **Search Capabilities**: Find files by name or content
- **Bulk Operations**: Batch file operations

## Configuration

### Environment Variables

- `FILESYSTEM_ROOT`: Root directory for filesystem access (default: /)
- `FILESYSTEM_READONLY`: Enable read-only mode (true/false)
- `FILESYSTEM_ALLOWED_PATHS`: Comma-separated list of allowed paths
- `FILESYSTEM_DENIED_PATHS`: Comma-separated list of denied paths
- `FILESYSTEM_MAX_FILE_SIZE`: Maximum file size for operations (bytes)

## Usage Examples

### Basic Setup

```bash
# Enable the server
autopm mcp enable filesystem-mcp

# Configure for project directory only
echo "FILESYSTEM_ROOT=$(pwd)" >> .claude/.env
echo "FILESYSTEM_READONLY=false" >> .claude/.env

# Sync configuration
autopm mcp sync
```

### Read-Only Configuration

```bash
# For safe exploration
echo "FILESYSTEM_READONLY=true" >> .claude/.env
echo "FILESYSTEM_ROOT=/Users/myuser/projects" >> .claude/.env
```

### Restricted Access

```bash
# Limit to specific directories
echo "FILESYSTEM_ALLOWED_PATHS=/project/src,/project/docs" >> .claude/.env
echo "FILESYSTEM_DENIED_PATHS=/project/.git,/project/node_modules" >> .claude/.env
```

## MCP Commands

### File Operations

```javascript
// Read file
filesystem.readFile({ path: "/project/README.md" })

// Write file
filesystem.writeFile({
  path: "/project/config.json",
  content: "{ \"version\": \"1.0.0\" }"
})

// Delete file
filesystem.deleteFile({ path: "/project/temp.txt" })

// Copy file
filesystem.copyFile({
  source: "/project/src/index.js",
  destination: "/project/src/index.backup.js"
})
```

### Directory Operations

```javascript
// List directory
filesystem.listDirectory({ path: "/project" })

// Create directory
filesystem.createDirectory({
  path: "/project/new-feature",
  recursive: true
})

// Remove directory
filesystem.removeDirectory({
  path: "/project/old-feature",
  recursive: true
})
```

### Search Operations

```javascript
// Find files by name
filesystem.findFiles({
  pattern: "*.test.js",
  directory: "/project/src"
})

// Search file content
filesystem.searchContent({
  query: "TODO",
  directory: "/project",
  filePattern: "*.js"
})
```

## Security Considerations

### Access Control

1. **Root Directory**: Always set appropriate root directory
2. **Path Validation**: Server validates all paths
3. **Symlink Handling**: Configurable symlink following
4. **Permission Checks**: Respects OS file permissions

### Best Practices

1. **Principle of Least Privilege**: Grant minimum necessary access
2. **Read-Only Default**: Start with read-only, enable write carefully
3. **Path Restrictions**: Always configure allowed/denied paths
4. **Audit Logging**: Monitor file operations
5. **Backup Strategy**: Maintain backups before write operations

## Integration with Agents

Commonly used with:
- `code-analyzer` - For code analysis
- `file-analyzer` - For file content analysis
- `test-runner` - For test file management

## Path Patterns

### Allowed Paths Example

```yaml
allowed_paths:
  - /project/src      # Source code
  - /project/tests    # Test files
  - /project/docs     # Documentation
  - /project/config   # Configuration files
```

### Denied Paths Example

```yaml
denied_paths:
  - /**/.git          # Git directories
  - /**/node_modules  # Dependencies
  - /**/.env          # Environment files
  - /**/*.key         # Private keys
  - /**/*.pem         # Certificates
```

## Performance Optimization

### Caching

- Metadata caching for frequent stat calls
- Directory listing cache with TTL
- Content caching for read operations

### Batch Operations

```javascript
// Batch read
filesystem.batchRead({
  files: [
    "/project/src/index.js",
    "/project/src/utils.js",
    "/project/package.json"
  ]
})

// Batch write
filesystem.batchWrite({
  operations: [
    { path: "/file1.txt", content: "Content 1" },
    { path: "/file2.txt", content: "Content 2" }
  ]
})
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Check file system permissions
   - Verify FILESYSTEM_READONLY setting
   - Ensure path is in allowed list

2. **Path Not Found**
   - Verify FILESYSTEM_ROOT setting
   - Check relative vs absolute paths
   - Ensure directory exists

3. **File Too Large**
   - Check FILESYSTEM_MAX_FILE_SIZE
   - Consider streaming for large files
   - Use pagination for directory listings

### Debug Mode

```bash
export FILESYSTEM_DEBUG=true
export FILESYSTEM_VERBOSE=true
```

## File Watching

```javascript
// Watch for changes
filesystem.watchFile({
  path: "/project/src",
  recursive: true,
  events: ["create", "change", "delete"]
})

// Stop watching
filesystem.unwatchFile({ path: "/project/src" })
```

## Metadata Operations

```javascript
// Get file stats
filesystem.getStats({ path: "/project/README.md" })
// Returns: size, mtime, ctime, permissions, isDirectory

// Get file permissions
filesystem.getPermissions({ path: "/project/script.sh" })
// Returns: readable, writable, executable

// Set file permissions
filesystem.setPermissions({
  path: "/project/script.sh",
  mode: "755"
})
```

## Version History

- **1.0.0**: Initial MCP integration
- **1.1.0**: Added batch operations
- **1.2.0**: Path restrictions support
- **1.3.0**: File watching capabilities
- **1.4.0**: Enhanced security features

## Related Resources

- [MCP Filesystem Spec](https://modelcontextprotocol.org/filesystem)
- [File Operations Best Practices](../guides/file-operations.md)
- [Security Guidelines](../security/filesystem-security.md)