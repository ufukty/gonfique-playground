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
    config: `### Please note that this version of Gonfique is a pre-alpha
### version and it is still under development. 
### Its design and implementation will change before release.

### Gonfique Playground (where you are now) is a separate  
### projectthat puts Gonfique into your browser to let you 
### try it before installing to system, and it is under  
### development too.

### Use links to provide feedback on each project and ask 
### questions:
### https://github.com/ufukty/gonfique (switch dev for docs)
### https://github.com/ufukty/gonfique-live

### Toggle each comment block under rules section at once
### to switch between demos

rules:

  # "domain": { export: true }

  # "domain": { export: true, replace: "[]byte" }
  
  # "domain": { declare: "CustomDomainType", replace: "[]byte" }

  # "**": { export: true }

  # "**.endpoints.*": { declare: Endpoint }

  # "**.endpoints": { export: true }
  # "**.endpoints.*": { declare: Endpoint }

  # "**.path": { declare: Path }
  # "**.endpoints.*": { declare: Endpoint }
  # "<Endpoint>.path": { replace: Path }
  # "<Endpoint>.method": { replace: "http.Method module/http" }

  # "**.path": { declare: Path }
  # "**.endpoints": { dict: map, declare: Endpoints }
  # "**.endpoints.[value]": { declare: Endpoint }
  # "<Endpoint>.path": { declare: Path }
  # "<Endpoint>.method": { replace: "http.Method module/http" }
`,
};
