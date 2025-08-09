export const examples = {
  input: `domain: localhost
gateways:
  public:
    path: /api/v1.0.0
    services:
      document:
        path: document
        endpoints:
          get: { method: "GET", path: "/" }
          create: { method: "POST", path: "/" }
          delete: { method: "DELETE", path: "/" }
          patch: { method: "PATCH", path: "/" }
      objectives:
        path: tasks
        endpoints:
          get: { method: "GET", path: "/" }
          create: { method: "POST", path: "/" }
          delete: { method: "DELETE", path: "/" }
          patch: { method: "PATCH", path: "/" }
          put: { method: "PUT", path: "/" }
      tags:
        path: tags
        endpoints:
          get: { method: "GET", path: "/" }
          create: { method: "POST", path: "/" }
          delete: { method: "DELETE", path: "/" }
`,
  config: `rules:

  # below 4 lines create a common type "Endpoints"
  # for multiple type-matching values then
  # further customizes it's belongings.
  "**.endpoints": { dict: map, declare: Endpoints }
  "<Endpoints>.[value]": {declare: Endpoint}
  "<Endpoint>.method": { replace: http.Method net/http }
  "<Endpoint>.path": { declare: Path }

  # exporting create types with automatically
  # choosen shortest and non-colliding type names.
  "domain": { export: true }
  "**.services.*": { export: true }

  # you can still use path matching for values whose
  # parents are previously exported.
  "**.services.*.path": { declare: Path }`,
};
