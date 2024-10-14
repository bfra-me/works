import RuleSource from './RuleSource.js';

const CloudflareWorkerRulePost = {
  "additionalProperties": false,
  "properties": {
    "requestMode": {
      "description": "This is Single Request mode or Batch Request mode. Single Request mode sends each event separately to the endpoint specified by the rule. Batch Request mode rolls up multiple events into the same request. You can read more about the difference between single and batched events in the Ably <a href=\"https://ably.com/documentation/general/events#batching\">documentation</a>.",
      "enum": [
        "single",
        "batch"
      ],
      "type": "string",
      "examples": [
        "single"
      ]
    },
    "ruleType": {
      "description": "The type of rule. In this case Cloudflare Worker. See the <a href=\"https://ably.com/integrations\">documentation</a> for further information.",
      "enum": [
        "http/cloudflare-worker"
      ],
      "type": "string"
    },
    "source": RuleSource,
    "status": {
      "description": "The status of the rule. Rules can be enabled or disabled.",
      "enum": [
        "enabled",
        "disabled"
      ],
      "type": "string",
      "examples": [
        "enabled"
      ]
    },
    "target": {
      "additionalProperties": false,
      "properties": {
        "headers": {
          "description": "If you have additional information to send, you'll need to include the relevant headers.",
          "items": {
            "properties": {
              "name": {
                "description": "The name of the header.",
                "type": "string"
              },
              "value": {
                "description": "The value of the header.",
                "type": "string"
              }
            },
            "type": "object"
          },
          "type": "array"
        },
        "signingKeyId": {
          "description": "The signing key ID for use in `batch` mode. Ably will optionally sign the payload using an API key ensuring your servers can validate the payload using the private API key. See the <a href=\"https://ably.com/documentation/general/events#security\">webhook security docs</a> for more information.",
          "type": [
            "string",
            "null"
          ]
        },
        "url": {
          "type": "string"
        }
      },
      "required": [
        "url"
      ],
      "type": "object"
    }
  },
  "required": [
    "ruleType",
    "requestMode",
    "source",
    "target"
  ],
  "type": "object",
  "title": "cloudflare_worker_rule_post",
  "x-readme-ref-name": "cloudflare_worker_rule_post"
} as const;
export default CloudflareWorkerRulePost
