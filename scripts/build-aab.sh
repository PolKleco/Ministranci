#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BUMP_VERSION=false
if [[ "${1:-}" == "--bump" ]]; then
  BUMP_VERSION=true
fi

set_java17() {
  local bubblewrap_java_home="$HOME/.bubblewrap/jdk/jdk-17.0.11+9/Contents/Home"
  if [[ -x "$bubblewrap_java_home/bin/java" ]]; then
    export JAVA_HOME="$bubblewrap_java_home"
    export PATH="$JAVA_HOME/bin:$PATH"
    return 0
  fi

  if command -v /usr/libexec/java_home >/dev/null 2>&1; then
    local detected
    detected="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
    if [[ -n "$detected" ]]; then
      export JAVA_HOME="$detected"
      export PATH="$JAVA_HOME/bin:$PATH"
      return 0
    fi
  fi

  return 1
}

check_java_version() {
  if ! command -v java >/dev/null 2>&1; then
    echo "Brak Java w PATH. Zainstaluj Java 17."
    exit 1
  fi

  local spec
  spec="$(java -XshowSettings:properties -version 2>&1 | awk -F'= ' '/java.specification.version/{print $2; exit}')"
  if [[ -z "$spec" ]]; then
    echo "Nie udało się odczytać wersji Java."
    exit 1
  fi

  local major
  if [[ "$spec" == "1.8" ]]; then
    major=8
  else
    major="${spec%%.*}"
  fi

  if [[ "$major" -lt 11 ]]; then
    echo "Wykryto Java $spec. Ten build wymaga co najmniej Java 11 (zalecane Java 17)."
    exit 1
  fi
}

bump_android_version() {
  local build_file="$ROOT_DIR/app/build.gradle"
  local current_code current_name new_code new_name

  current_code="$(awk '/^[[:space:]]*versionCode[[:space:]]+[0-9]+/{print $2; exit}' "$build_file")"
  current_name="$(sed -n 's/^[[:space:]]*versionName[[:space:]]*"\([^"]*\)".*/\1/p' "$build_file" | head -n1)"

  if [[ -z "$current_code" || -z "$current_name" ]]; then
    echo "Nie udało się odczytać versionCode/versionName z app/build.gradle."
    exit 1
  fi

  new_code=$((current_code + 1))
  new_name="$current_name"
  if [[ "$current_name" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    new_name="${BASH_REMATCH[1]}.${BASH_REMATCH[2]}.$((BASH_REMATCH[3] + 1))"
  fi

  awk -v newCode="$new_code" -v newName="$new_name" '
    BEGIN { codeDone=0; nameDone=0 }
    {
      if (!codeDone && $1=="versionCode") {
        $2=newCode
        codeDone=1
      }
      if (!nameDone && $1=="versionName") {
        $2="\"" newName "\""
        nameDone=1
      }
      print
    }
  ' "$build_file" > "$build_file.tmp"
  mv "$build_file.tmp" "$build_file"

  echo "Podbito wersję: versionCode $current_code -> $new_code, versionName $current_name -> $new_name"
}

set_java17 || true
check_java_version

if [[ "$BUMP_VERSION" == "true" ]]; then
  bump_android_version
fi

./gradlew bundleRelease

output_src="app/build/outputs/bundle/release/app-release.aab"
if [[ ! -f "$output_src" ]]; then
  echo "Build zakończony, ale nie znaleziono pliku $output_src"
  exit 1
fi

timestamp="$(date +%Y-%m-%d-%H%M%S)"
output_dst="app-release-bundle-${timestamp}.aab"
cp "$output_src" "$output_dst"

echo
echo "Gotowe."
echo "Plik do Google Play: $ROOT_DIR/$output_dst"
