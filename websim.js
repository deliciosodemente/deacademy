export default {
  "inputs": [
    { "type": "promptString", "id": "github-token", "description": "GitHub PAT con repo y workflow", "password": true },
    { "type": "promptString", "id": "stripe-key", "description": "STRIPE_SECRET_KEY (sk_test...)", "password": true },
    { "type": "promptString", "id": "aws_profile", "description": "Nombre de tu perfil AWS (~/.aws/credentials)", "password": false },
    { "type": "promptString", "id": "gcp_sa_json", "description": "Ruta a tu Service Account JSON (GCP)", "password": false },
    { "type": "promptString", "id": "zapier_mcp_url", "description": "Zapier MCP URL (opcional)", "password": true },
    { "type": "promptString", "id": "n8n_mcp_url", "description": "n8n MCP URL (opcional)", "password": true }
  ],
  "servers": {
    "GitHub": {
      "url": "https://api.githubcopilot.com/mcp/",
      "env": { "GITHUB_TOKEN": "${input:github-token}" }
    },

    "Stripe": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@stripe/mcp", "--tools=all"],
      "env": { "STRIPE_API_KEY": "${input:stripe-key}" }
    },

    "Terraform": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "terraform-mcp-server"]
    },

    "AWS Terraform (extra)": {
      "type": "http",
      "url": "https://awslabs.github.io/mcp/servers/terraform-mcp-server"
    },

    "GCP": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@playbooksai/gcp-mcp"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "${input:gcp_sa_json}"
      }
    },

    "Zapier (opcional)": {
      "type": "http",
      "url": "${input:zapier_mcp_url}"
    },

    "n8n (opcional)": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-remote", "${input:n8n_mcp_url}"]
    },

    "Ollama (ahorro de costos)": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-ollama"],
      "env": { "OLLAMA_HOST": "http://127.0.0.1:11434" }
    }
  }
}