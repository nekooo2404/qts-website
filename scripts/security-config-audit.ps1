param()

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

$failures = [System.Collections.Generic.List[string]]::new()

function Add-Failure {
    param([string] $Message)
    [void] $failures.Add($Message)
}

function Get-NormalizedContent {
    param([string] $Path)
    (Get-Content -LiteralPath $Path -Raw) -replace "`r`n", "`n"
}

function Assert-IgnorePatterns {
    param(
        [string] $Path,
        [string[]] $Patterns
    )

    $content = Get-NormalizedContent -Path $Path
    foreach ($pattern in $Patterns) {
        $escaped = [regex]::Escape($pattern)
        if ($content -notmatch "(?m)^$escaped$") {
            Add-Failure "$Path is missing ignore pattern: $pattern"
        }
    }
}

function Get-GitLines {
    param([string[]] $Arguments)
    $output = & git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
    }

    @($output | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
}

Assert-IgnorePatterns -Path ".gitignore" -Patterns @(
    ".env",
    ".env.*",
    "!.env.example",
    ".envrc",
    ".envrc.local",
    ".secrets/",
    ".tmp/",
    "*.pem",
    "*.key",
    "*.p12",
    "*.pfx",
    ".npmrc",
    ".pypirc"
)

Assert-IgnorePatterns -Path ".dockerignore" -Patterns @(
    ".env",
    ".env.*",
    "**/.env*",
    ".envrc",
    ".envrc.local",
    ".secrets/",
    ".codex/",
    ".tmp/",
    "*.pem",
    "*.key",
    "*.p12",
    "*.pfx",
    ".npmrc",
    ".pypirc"
)

$trackedFiles = Get-GitLines -Arguments @("ls-files")
$forbiddenTrackedPath = "(?i)(^|/)(\.env($|\.)|\.envrc($|\.)|\.secrets(/|$)|id_rsa(\.|$)|id_ed25519(\.|$)|.*\.(pem|key|p12|pfx)$|\.(netrc|npmrc|pypirc)$)"

foreach ($path in $trackedFiles) {
    $normalized = $path -replace "\\", "/"
    if ($normalized -eq ".env.example") {
        continue
    }

    if ($normalized -match $forbiddenTrackedPath) {
        Add-Failure "tracked sensitive path must be removed or rotated if real: $normalized"
    }
}

$visibleSensitiveKeyPattern = "VITE_[A-Z0-9_]*(SECRET|PASSWORD|PASSPHRASE|PRIVATE|API_KEY|ACCESS_TOKEN|REFRESH_TOKEN|KC_)[A-Z0-9_]*"
$textExtensions = "\.(env\.example|ya?ml|json|md|ts|tsx|js|jsx|mjs|cjs|java|kt|sh|ps1|properties|toml)$"

foreach ($path in $trackedFiles) {
    $normalized = $path -replace "\\", "/"
    if ($normalized -notmatch $textExtensions) {
        continue
    }

    $content = Get-Content -LiteralPath $normalized -Raw -ErrorAction SilentlyContinue
    if ($null -eq $content) {
        continue
    }

    $matches = [regex]::Matches($content, $visibleSensitiveKeyPattern)
    foreach ($match in $matches) {
        Add-Failure "client-visible sensitive env name in ${normalized}: $($match.Value)"
    }
}

$composeFiles = @("docker-compose.yml") + @(Get-ChildItem -Path . -Filter "docker-compose.*.yml" | ForEach-Object { $_.Name } | Sort-Object)
$publicPortPattern = '^\s*-\s*"?((0\.0\.0\.0:)?|)(\$\{[A-Z0-9_:-]+\}|[0-9]+):[0-9]+'

foreach ($composeFile in $composeFiles) {
    $lineNumber = 0
    foreach ($line in Get-Content -LiteralPath $composeFile) {
        $lineNumber += 1
        if ($line -match $publicPortPattern -and $line -notmatch '^\s*-\s*"?127\.0\.0\.1:') {
            Add-Failure "compose port must bind to 127.0.0.1 or be reset in ${composeFile}:$lineNumber"
        }
    }
}

$unignoredSensitive = @(
    Get-GitLines -Arguments @("ls-files", "--others", "--exclude-standard") |
        ForEach-Object { $_ -replace "\\", "/" } |
        Where-Object {
            $_ -ne ".env.example" -and $_ -match $forbiddenTrackedPath
        }
)

foreach ($path in $unignoredSensitive) {
    Add-Failure "unignored sensitive filename visible to git: $path"
}

if ($failures.Count -gt 0) {
    Write-Error ("Security config audit failed:`n - " + ($failures -join "`n - "))
    exit 1
}

Write-Host "Security config audit passed."
