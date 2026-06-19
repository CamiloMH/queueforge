#!/usr/bin/env bash
# Crea un tag anotado con la versión indicada y lo publica en el remoto.
# Uso: pnpm release <version>   (ej. pnpm release 1.2.0)
set -euo pipefail

VERSION="${1:-}"

if [[ -z "$VERSION" ]]; then
  echo "Error: debes indicar la versión. Uso: pnpm release <version>" >&2
  exit 1
fi

# Valida que la versión sea un semver válido (x.y.z o x.y.z-prerelease).
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9._-]+)?$'; then
  echo "Error: versión inválida '$VERSION'. Formato esperado: x.y.z o x.y.z-prerelease" >&2
  exit 1
fi

TAG="v${VERSION}"

# Debe ejecutarse desde la rama principal.
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Error: debes estar en la rama 'main' para publicar (rama actual: $CURRENT_BRANCH)" >&2
  exit 1
fi

# El árbol de trabajo debe estar limpio.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Error: hay cambios sin commitear. Haz commit o stash antes de publicar." >&2
  exit 1
fi

# El tag no debe existir ya.
if git tag --list | grep -qx "$TAG"; then
  echo "Error: el tag '$TAG' ya existe." >&2
  exit 1
fi

echo "Creando tag anotado $TAG..."
git tag -a "$TAG" -m "Release $TAG"

echo "Publicando $TAG en origin..."
git push origin "$TAG"

echo ""
echo "✓ $TAG publicado correctamente."
echo "  https://github.com/CamiloMH/queueforge/releases/tag/$TAG"
