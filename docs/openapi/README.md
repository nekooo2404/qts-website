# QTS OpenAPI contracts

`qts-public-api.openapi.json` is the published contract for the Spring public
HTTP surface currently exposed by QTS.

Keep this file in lockstep with controller changes:

1. update the path, method, request and response contract in the same PR as the
   controller change;
2. keep Ory Hydra/Kratos protocol endpoints discoverable through issuer
   metadata instead of copying the upstream contract into this file;
3. validate JSON syntax before release:

   ```bash
   node -e "JSON.parse(require('fs').readFileSync('docs/openapi/qts-public-api.openapi.json', 'utf8'))"
   ```

