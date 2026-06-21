---
'@rangka/client': patch
---

Revert lazy loading for built-in widgets. All built-in widgets are now eagerly registered at boot. Fixes widget loading failures when served by Fastify static.
