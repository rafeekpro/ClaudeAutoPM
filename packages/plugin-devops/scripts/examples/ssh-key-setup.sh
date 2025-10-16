#!/usr/bin/env bash
# SSH key generation and setup with best practices
# Usage: ./ssh-key-setup.sh [key-name] [email]

set -euo pipefail

KEY_NAME="${1:-id_ed25519}"
EMAIL="${2:-user@example.com}"
SSH_DIR="${HOME}/.ssh"
KEY_PATH="${SSH_DIR}/${KEY_NAME}"

echo "🔐 Setting up SSH key: ${KEY_NAME}..."

# Create .ssh directory if it doesn't exist
mkdir -p "${SSH_DIR}"
chmod 700 "${SSH_DIR}"

# Check if key already exists
if [ -f "${KEY_PATH}" ]; then
    echo "⚠️  Key already exists: ${KEY_PATH}"
    read -p "Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Generate ED25519 key (recommended for security and performance)
echo "🔑 Generating ED25519 SSH key..."
ssh-keygen -t ed25519 -C "${EMAIL}" -f "${KEY_PATH}" -N ""

# Set proper permissions
chmod 600 "${KEY_PATH}"
chmod 644 "${KEY_PATH}.pub"

echo "✅ SSH key generated successfully"
echo ""
echo "📋 Public key:"
cat "${KEY_PATH}.pub"

# Add to SSH agent
echo ""
echo "🔧 Adding key to SSH agent..."
eval "$(ssh-agent -s)"
ssh-add "${KEY_PATH}"

# Create/update SSH config
CONFIG_FILE="${SSH_DIR}/config"
if [ ! -f "${CONFIG_FILE}" ]; then
    echo "📝 Creating SSH config file..."
    cat > "${CONFIG_FILE}" <<EOF
# SSH Config
# Use this key by default
Host *
    IdentityFile ${KEY_PATH}
    AddKeysToAgent yes
    UseKeychain yes
EOF
    chmod 600 "${CONFIG_FILE}"
    echo "✅ SSH config created: ${CONFIG_FILE}"
fi

echo ""
echo "✅ SSH key setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the public key above and add it to:"
echo "   - GitHub: https://github.com/settings/keys"
echo "   - GitLab: https://gitlab.com/-/profile/keys"
echo "   - Your server's ~/.ssh/authorized_keys"
echo ""
echo "2. Test the connection:"
echo "   ssh -T git@github.com"
