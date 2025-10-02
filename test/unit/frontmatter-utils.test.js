const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

describe('Frontmatter Utils - Special Character Handling', () => {
    let testDir;
    let testFile;
    const scriptsDir = path.join(__dirname, '../../autopm/.claude/scripts/lib');
    const frontmatterScript = path.join(scriptsDir, 'frontmatter-utils.sh');

    beforeEach(() => {
        // Create temporary test directory
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'frontmatter-test-'));
        testFile = path.join(testDir, 'test.md');

        // Create test markdown file with basic frontmatter
        fs.writeFileSync(testFile, `---
title: Test Document
status: open
---

# Test Content
`);
    });

    afterEach(() => {
        // Cleanup test directory
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    // Helper to escape shell arguments properly
    const shellEscape = (str) => {
        // Use single quotes and escape any single quotes in the string
        return "'" + str.replace(/'/g, "'\\''") + "'";
    };

    const updateFrontmatterField = (file, fieldName, fieldValue) => {
        const script = `source ${shellEscape(frontmatterScript)} && update_frontmatter_field ${shellEscape(file)} ${shellEscape(fieldName)} ${shellEscape(fieldValue)}`;
        try {
            execSync(script, { shell: '/bin/bash', stdio: 'pipe' });
        } catch (error) {
            throw new Error(`Failed to update frontmatter: ${error.message}`);
        }
    };

    const getFrontmatterField = (file, fieldName) => {
        const script = `source ${shellEscape(frontmatterScript)} && get_frontmatter_field ${shellEscape(file)} ${shellEscape(fieldName)}`;
        try {
            const result = execSync(script, { shell: '/bin/bash', encoding: 'utf8' });
            // Split by newlines and get the last line (the actual output)
            // Don't use trim() as it would remove leading/trailing spaces from the value
            const lines = result.split('\n');
            const lastLine = lines[lines.length - 1];
            // Return the line before the last empty line (if there is one), or the last line
            return lastLine === '' && lines.length > 1 ? lines[lines.length - 2] : lastLine;
        } catch (error) {
            throw new Error(`Failed to get frontmatter field: ${error.message}`);
        }
    };

    describe('Special Characters in Field Values', () => {
        test('should handle forward slashes in field value', () => {
            const valueWithSlash = 'path/to/resource';
            updateFrontmatterField(testFile, 'path', valueWithSlash);
            const result = getFrontmatterField(testFile, 'path');
            expect(result).toBe(valueWithSlash);
        });

        test('should handle ampersands in field value', () => {
            const valueWithAmpersand = 'Value with & symbol';
            updateFrontmatterField(testFile, 'description', valueWithAmpersand);
            const result = getFrontmatterField(testFile, 'description');
            expect(result).toBe(valueWithAmpersand);
        });

        test('should handle backslashes in field value', () => {
            const valueWithBackslash = 'C:\\Users\\Path\\File';
            updateFrontmatterField(testFile, 'windows_path', valueWithBackslash);
            const result = getFrontmatterField(testFile, 'windows_path');
            expect(result).toBe(valueWithBackslash);
        });

        test('should handle dots and special chars in field value', () => {
            const valueWithSpecialChars = 'user@example.com';
            updateFrontmatterField(testFile, 'email', valueWithSpecialChars);
            const result = getFrontmatterField(testFile, 'email');
            expect(result).toBe(valueWithSpecialChars);
        });

        test('should handle square brackets in field value', () => {
            const valueWithBrackets = '[tag1] [tag2]';
            updateFrontmatterField(testFile, 'tags', valueWithBrackets);
            const result = getFrontmatterField(testFile, 'tags');
            expect(result).toBe(valueWithBrackets);
        });

        test('should handle pipes in field value', () => {
            const valueWithPipe = 'option1 | option2';
            updateFrontmatterField(testFile, 'options', valueWithPipe);
            const result = getFrontmatterField(testFile, 'options');
            expect(result).toBe(valueWithPipe);
        });

        test('should handle dollar signs in field value', () => {
            const valueWithDollar = '$100.00';
            updateFrontmatterField(testFile, 'price', valueWithDollar);
            const result = getFrontmatterField(testFile, 'price');
            expect(result).toBe(valueWithDollar);
        });

        test('should handle asterisks in field value', () => {
            const valueWithAsterisk = '**bold** text';
            updateFrontmatterField(testFile, 'markdown', valueWithAsterisk);
            const result = getFrontmatterField(testFile, 'markdown');
            expect(result).toBe(valueWithAsterisk);
        });

        test('should handle quotes in field value', () => {
            const valueWithQuotes = 'She said "hello"';
            updateFrontmatterField(testFile, 'quote', valueWithQuotes);
            const result = getFrontmatterField(testFile, 'quote');
            expect(result).toBe(valueWithQuotes);
        });

        test('should handle mixed special characters', () => {
            const complexValue = '/path/to/file & "quoted" $VAR [tag]';
            updateFrontmatterField(testFile, 'complex', complexValue);
            const result = getFrontmatterField(testFile, 'complex');
            expect(result).toBe(complexValue);
        });
    });

    describe('Special Characters in Field Names', () => {
        test('should handle underscores in field name', () => {
            updateFrontmatterField(testFile, 'field_name', 'value');
            const result = getFrontmatterField(testFile, 'field_name');
            expect(result).toBe('value');
        });

        test('should handle hyphens in field name', () => {
            updateFrontmatterField(testFile, 'field-name', 'value');
            const result = getFrontmatterField(testFile, 'field-name');
            expect(result).toBe('value');
        });

        test('should handle dots in field name', () => {
            updateFrontmatterField(testFile, 'field.name', 'value');
            const result = getFrontmatterField(testFile, 'field.name');
            expect(result).toBe('value');
        });
    });

    describe('Update Existing Fields', () => {
        test('should update existing field with special characters', () => {
            // First update
            updateFrontmatterField(testFile, 'status', 'in-progress');
            expect(getFrontmatterField(testFile, 'status')).toBe('in-progress');

            // Update with special characters
            updateFrontmatterField(testFile, 'status', 'blocked: waiting/review');
            expect(getFrontmatterField(testFile, 'status')).toBe('blocked: waiting/review');
        });

        test('should preserve other fields when updating with special chars', () => {
            updateFrontmatterField(testFile, 'title', 'New & Updated Title');

            // Original fields should remain unchanged
            expect(getFrontmatterField(testFile, 'status')).toBe('open');
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty field value', () => {
            updateFrontmatterField(testFile, 'empty', '');
            const result = getFrontmatterField(testFile, 'empty');
            expect(result).toBe('');
        });

        test('should handle spaces in field value', () => {
            const valueWithSpaces = '   spaces   around   ';
            updateFrontmatterField(testFile, 'spaced', valueWithSpaces);
            const result = getFrontmatterField(testFile, 'spaced');
            expect(result).toBe(valueWithSpaces);
        });

        test('should handle numeric values', () => {
            updateFrontmatterField(testFile, 'count', '42');
            const result = getFrontmatterField(testFile, 'count');
            expect(result).toBe('42');
        });

        test('should handle URL values', () => {
            const url = 'https://example.com/path?param=value&other=123';
            updateFrontmatterField(testFile, 'url', url);
            const result = getFrontmatterField(testFile, 'url');
            expect(result).toBe(url);
        });
    });

    describe('File Integrity', () => {
        test('should not corrupt file when using special characters', () => {
            updateFrontmatterField(testFile, 'special', '/path/&/test');

            const content = fs.readFileSync(testFile, 'utf8');

            // Should have valid frontmatter
            expect(content).toMatch(/^---\n/);
            expect(content).toMatch(/\n---\n/);

            // Should have the content preserved
            expect(content).toContain('# Test Content');
        });

        test('should handle multiple updates with special characters', () => {
            updateFrontmatterField(testFile, 'field1', 'value/with/slashes');
            updateFrontmatterField(testFile, 'field2', 'value&with&ampersands');
            updateFrontmatterField(testFile, 'field3', 'value\\with\\backslashes');

            expect(getFrontmatterField(testFile, 'field1')).toBe('value/with/slashes');
            expect(getFrontmatterField(testFile, 'field2')).toBe('value&with&ampersands');
            expect(getFrontmatterField(testFile, 'field3')).toBe('value\\with\\backslashes');
        });
    });
});
