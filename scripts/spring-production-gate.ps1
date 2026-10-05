param(
    [string[]] $Services = @("lead-service", "event-service", "attendance-service", "identity-admin-service", "identity-bridge-service", "hrm-service"),
    [switch] $SkipDockerBuild,
    [switch] $UseLocalMaven,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $RemainingServices = @()
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$mavenImage = "maven:3.9.11-eclipse-temurin-21"
$defaultServices = @("lead-service", "event-service", "attendance-service", "identity-admin-service", "identity-bridge-service", "hrm-service")

function Normalize-ServiceList {
    param(
        [string[]] $Primary,
        [string[]] $Remaining
    )

    $normalized = [System.Collections.Generic.List[string]]::new()

    foreach ($raw in @($Primary + $Remaining)) {
        if ([string]::IsNullOrWhiteSpace($raw)) {
            continue
        }

        foreach ($part in ($raw -split ",")) {
            $item = $part.Trim()
            if ([string]::IsNullOrWhiteSpace($item)) {
                continue
            }

            if ($item -eq "-SkipDockerBuild") {
                $script:SkipDockerBuild = $true
                continue
            }
            if ($item -eq "-UseLocalMaven") {
                $script:UseLocalMaven = $true
                continue
            }
            if ($item.StartsWith("-")) {
                throw "Unknown Spring production gate argument: $item"
            }

            $normalized.Add($item)
        }
    }

    if ($normalized.Count -eq 0) {
        return $defaultServices
    }

    return $normalized.ToArray()
}

$Services = Normalize-ServiceList -Primary $Services -Remaining $RemainingServices

function Invoke-Step {
    param(
        [string] $Name,
        [scriptblock] $Command
    )
    Write-Host ""
    Write-Host "==> $Name"
    & $Command
}

Set-Location $repoRoot

function Assert-NoLegacyBackend {
    $legacyFilePattern = '(^|[\\/])(apps[\\/]api|infra[\\/]keycloak|infra[\\/]legacy)([\\/]|$)|(^|[\\/])manage\.py$|requirements.*\.txt$|Pipfile$|pyproject\.toml$|\.py$'
    $trackedFiles = & rg --files 2> $null
    if ($LASTEXITCODE -ne 0 -or !$trackedFiles) {
        $trackedFiles = & git ls-files 2> $null | Where-Object { Test-Path $_ }
    }
    if (!$trackedFiles) {
        $trackedFiles = & rg --files
    }

    $legacyFiles = @($trackedFiles | Where-Object { $_ -match $legacyFilePattern })
    if ($legacyFiles.Count -gt 0) {
        throw "Retired backend files are not allowed after Spring cutover:`n$($legacyFiles -join "`n")"
    }

    $legacyTextTargets = @(
        "backend/services",
        "docker-compose.yml",
        "docker-compose.prod.yml",
        "docker-compose.spring.yml",
        "docker-compose.spring.prod.yml",
        "docker-compose.spring.cutover.yml",
        "package.json",
        "README.md",
        "DEPLOYMENT.md",
        "docs/specs",
        "docs/architecture"
    )
    $existingTargets = @($legacyTextTargets | Where-Object { Test-Path $_ })
    if ($existingTargets.Count -eq 0) {
        return
    }

    $legacyText = & rg -n -i "keycloak|django|apps/api|manage\.py|requirements\.txt|gunicorn|celery|python backend|legacy backend" @existingTargets 2> $null
    if ($LASTEXITCODE -eq 0 -and $legacyText) {
        throw "Retired backend references are not allowed in active Spring/deployment surfaces:`n$($legacyText -join "`n")"
    }
}

Invoke-Step "Spring cutover guard: no retired backend" {
    Assert-NoLegacyBackend
}

function Assert-SpringDockerfileHardening {
    $dockerfiles = @(Get-ChildItem -Path "backend/services" -Filter "Dockerfile" -Recurse)
    if ($dockerfiles.Count -eq 0) {
        throw "No Spring service Dockerfiles found."
    }

    foreach ($dockerfile in $dockerfiles) {
        $content = Get-Content -Raw $dockerfile.FullName
        $relativePath = Resolve-Path -Relative $dockerfile.FullName
        foreach ($required in @(
            "FROM eclipse-temurin:21-jre-alpine",
            "adduser -S qts",
            "USER qts",
            "-XX:MaxRAMPercentage=75",
            "-XX:+ExitOnOutOfMemoryError",
            "-Dfile.encoding=UTF-8",
            "-Dsun.jnu.encoding=UTF-8"
        )) {
            if (!$content.Contains($required)) {
                throw "Spring Dockerfile hardening missing '$required' in $relativePath"
            }
        }
    }
}

Invoke-Step "Spring Dockerfile hardening guard" {
    Assert-SpringDockerfileHardening
}

function Assert-ApiNoStoreFilters {
    $serviceDirs = @(Get-ChildItem -Path "backend/services" -Directory)
    foreach ($serviceDir in $serviceDirs) {
        $mainJava = Join-Path $serviceDir.FullName "src/main/java"
        if (!(Test-Path $mainJava)) {
            continue
        }
        $hasController = (rg -l "@RestController|@Controller" $mainJava 2> $null | Measure-Object).Count -gt 0
        if (!$hasController) {
            continue
        }
        $hasNoStore = (rg -l "class NoStoreFilter|Cache-Control.*no-store|no-store" $mainJava 2> $null | Measure-Object).Count -gt 0
        if (!$hasNoStore) {
            throw "Spring API service '$($serviceDir.Name)' has controllers but no no-store response filter."
        }
    }
}

Invoke-Step "Spring API no-store guard" {
    Assert-ApiNoStoreFilters
}

function Test-DockerDaemon {
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if (!$docker) {
        return $false
    }

    try {
        docker version --format "{{.Server.Version}}" 1> $null 2> $null
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

function Resolve-LocalMaven {
    $portableJava = Join-Path $repoRoot ".tools/jdk-21"
    $portableMaven = Join-Path $repoRoot ".tools/apache-maven-3.9.11/bin/mvn.cmd"
    $mavenWrapper = Join-Path $repoRoot "mvnw.cmd"

    if (Test-Path $portableJava) {
        $env:JAVA_HOME = $portableJava
        $env:PATH = (Join-Path $portableJava "bin") + [IO.Path]::PathSeparator + $env:PATH
    }

    if (Test-Path $mavenWrapper) {
        return $mavenWrapper
    }

    if ((Test-Path $portableJava) -and (Test-Path $portableMaven)) {
        return $portableMaven
    }

    $mvn = Get-Command mvn -ErrorAction SilentlyContinue
    if ($mvn) {
        return $mvn.Source
    }

    throw "Maven not found. Install JDK 21 + Maven 3.9.x, or place portable tools in .tools/jdk-21 and .tools/apache-maven-3.9.11."
}

$validationDefaults = @{
    POSTGRES_DB = "qts"
    POSTGRES_USER = "postgres"
    POSTGRES_PASSWORD = "compose-validation-only"
    ORY_HYDRA_DB_PASSWORD = "hydra-validation-only"
    ORY_KRATOS_DB_PASSWORD = "kratos-validation-only"
    ORY_HYDRA_DSN = "postgres://hydra:hydra-validation-only@hydra-db:5432/hydra?sslmode=disable"
    ORY_KRATOS_DSN = "postgres://kratos:kratos-validation-only@kratos-db:5432/kratos?sslmode=disable"
    ORY_HYDRA_SYSTEM_SECRET = "hydra-system-validation-only"
    ORY_KRATOS_COOKIE_SECRET = "kratos-cookie-validation-only"
    ORY_KRATOS_CIPHER_SECRET = "kratos-cipher-validation-only"
    IDENTITY_SIGNING_KEY_PASSPHRASE = "identity-validation-only"
    CORS_ALLOWED_ORIGINS = "https://portal.example.invalid,https://hrm.example.invalid"
    IDENTITY_ISSUER = "https://api.example.invalid"
    IDENTITY_WEB_ORIGIN = "https://sso.example.invalid"
    ORY_HYDRA_ISSUER_BROWSER_URL = "https://sso.example.invalid/"
    ORY_KRATOS_BROWSER_URL = "https://sso.example.invalid/kratos"
    VITE_IDENTITY_ISSUER = "https://sso.example.invalid/"
    VITE_API_ISSUER = "https://api.example.invalid"
    VITE_HRM_API_ISSUER = "https://api.example.invalid"
    VITE_IDENTITY_WEB_ORIGIN = "https://sso.example.invalid"
    VITE_PORTAL_OIDC_CLIENT_ID = "qts-portal"
    VITE_PORTAL_OIDC_REDIRECT_URI = "https://portal.example.invalid/auth/callback"
    VITE_PORTAL_OIDC_POST_LOGOUT_REDIRECT_URI = "https://portal.example.invalid/"
    VITE_HRM_OIDC_CLIENT_ID = "qts-hrm"
    VITE_ALLOW_INSECURE_LOCAL_OIDC = "false"
    VITE_HRM_OIDC_REDIRECT_URI = "https://hrm.example.invalid/auth/callback"
    VITE_HRM_OIDC_POST_LOGOUT_REDIRECT_URI = "https://hrm.example.invalid/"
    QTS_SECURITY_ENABLED = "true"
    QTS_SECURITY_CORS_ALLOWED_ORIGINS = "https://sso.example.invalid,https://portal.example.invalid,https://hrm.example.invalid"
    QTS_IDENTITY_ISSUER = "https://sso.example.invalid/"
    QTS_IDENTITY_JWK_SET_URI = "https://sso.example.invalid/.well-known/jwks.json"
    QTS_IDENTITY_AUDIENCE = "qts-api"
    LEAD_FLYWAY_ENABLED = "true"
    EVENT_FLYWAY_ENABLED = "true"
    ATTENDANCE_FLYWAY_ENABLED = "true"
    IDENTITY_FLYWAY_ENABLED = "true"
    QTS_IDENTITY_BOOTSTRAP_ENABLED = "true"
    IDENTITY_PRIMARY_DOMAIN = "qts.com"
    IDENTITY_REQUIRE_MFA = "true"
    QTS_EVENT_POLL_ENABLED = "false"
    QTS_EVENT_MAIL_ENABLED = "false"
    QTS_IDENTITY_BRIDGE_ENABLED = "false"
    ORY_HYDRA_ADMIN_URL = "http://hydra:4445"
    ORY_KRATOS_INTERNAL_PUBLIC_URL = "http://kratos:4433"
    ORY_KRATOS_ADMIN_URL = "http://kratos:4434"
    ORY_KRATOS_SESSION_COOKIE = "ory_kratos_session"
    ORY_HYDRA_CLIENT_ID_PORTAL = "qts-portal"
    ORY_HYDRA_CLIENT_ID_HRM = "qts-hrm"
    ORY_HYDRA_LOGIN_URL = "https://sso.example.invalid/identity-api/oauth/ory/login"
    ORY_HYDRA_CONSENT_URL = "https://sso.example.invalid/identity-api/oauth/ory/consent"
    ORY_HYDRA_LOGOUT_URL = "https://sso.example.invalid/identity-api/oauth/ory/logout"
    ORY_API_AUDIENCE = "qts-api"
    HRM_FLYWAY_ENABLED = "true"
    HRM_MAX_PAGE_SIZE = "100"
    MANAGEMENT_ENDPOINTS_WEB_EXPOSURE_INCLUDE = "health,info"
}

function Clear-ValidationEnvironment {
    [Environment]::SetEnvironmentVariable("DEBUG", $null, "Process")

    foreach ($entry in $validationDefaults.GetEnumerator()) {
        [Environment]::SetEnvironmentVariable($entry.Key, $null, "Process")
    }
}

function Apply-ValidationDefaults {
    foreach ($entry in $validationDefaults.GetEnumerator()) {
        if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($entry.Key))) {
            [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, "Process")
        }
    }
}

function Test-IsDefaultServiceSet {
    if ($Services.Count -ne $defaultServices.Count) {
        return $false
    }

    $requested = $Services | Sort-Object
    $expected = $defaultServices | Sort-Object
    for ($i = 0; $i -lt $expected.Count; $i++) {
        if ($requested[$i] -ne $expected[$i]) {
            return $false
        }
    }

    return $true
}

function Invoke-MavenTests {
    param(
        [string] $Name,
        [string] $WorkingDirectory,
        [string] $ContainerVolumePath,
        [string[]] $MavenArguments
    )

    Invoke-Step $Name {
        if ($localMaven) {
            Push-Location $WorkingDirectory
            try {
                & $localMaven @MavenArguments
                if ($LASTEXITCODE -ne 0) {
                    throw "$Name failed with exit code $LASTEXITCODE."
                }
            }
            finally {
                Pop-Location
            }
        }
        else {
            docker run --rm `
                -e MAVEN_OPTS="-Xmx768m -XX:ActiveProcessorCount=2" `
                -v "${ContainerVolumePath}:/workspace" `
                -w /workspace `
                $mavenImage `
                mvn @MavenArguments
            if ($LASTEXITCODE -ne 0) {
                throw "$Name failed with exit code $LASTEXITCODE."
            }
        }
    }
}

$dockerDaemonAvailable = Test-DockerDaemon
if ($dockerDaemonAvailable) {
    Invoke-Step "Docker daemon availability" {
        docker version --format "{{.Server.Version}}" | Out-Host
    }
}
else {
    Write-Host ""
    Write-Host "==> Docker daemon unavailable; Maven tests will use local toolchain."
}

$localMaven = $null
if ($UseLocalMaven -or !$dockerDaemonAvailable) {
    $localMaven = Resolve-LocalMaven
}

Clear-ValidationEnvironment

$runReactorTests = Test-IsDefaultServiceSet
if ($runReactorTests) {
    Invoke-MavenTests `
        -Name "Maven tests: Spring reactor" `
        -WorkingDirectory $repoRoot `
        -ContainerVolumePath $repoRoot `
        -MavenArguments @("-B", "test")
}

foreach ($service in $Services) {
    $servicePath = Join-Path $repoRoot "backend/services/$service"
    if (!(Test-Path $servicePath)) {
        throw "Unknown Spring service: $service"
    }

    if (!$runReactorTests) {
        Invoke-MavenTests `
            -Name "Maven tests: $service" `
            -WorkingDirectory $repoRoot `
            -ContainerVolumePath $repoRoot `
            -MavenArguments @("-B", "-pl", "backend/services/$service", "-am", "test")
    }

    if (!$SkipDockerBuild) {
        if (!$dockerDaemonAvailable) {
            throw "Docker daemon unavailable. Start Docker Desktop or rerun with -SkipDockerBuild for local Maven and compose validation only."
        }

        Invoke-Step "Docker build: $service" {
            docker build `
                --file "backend/services/$service/Dockerfile" `
                --tag "qts-${service}:production-gate" `
                .
            if ($LASTEXITCODE -ne 0) {
                throw "Docker build failed for $service with exit code $LASTEXITCODE."
            }
        }
    }
}

Apply-ValidationDefaults

Invoke-Step "Compose overlay validation" {
    if (!$env:POSTGRES_PASSWORD) {
        $env:POSTGRES_PASSWORD = "compose-validation-only"
    }
    docker compose `
        --profile prod `
        --profile spring `
        --profile spring-events `
        --profile spring-attendance `
        --profile spring-identity-admin `
        --profile spring-identity-bridge `
        --profile spring-hrm `
        -f docker-compose.yml `
        -f docker-compose.prod.yml `
        -f docker-compose.spring.yml `
        -f docker-compose.spring.prod.yml `
        config --quiet
    if ($LASTEXITCODE -ne 0) {
        throw "Compose overlay validation failed with exit code $LASTEXITCODE."
    }
}

Invoke-Step "Optional Spring cutover overlay validation" {
    if (!$env:POSTGRES_PASSWORD) {
        $env:POSTGRES_PASSWORD = "compose-validation-only"
    }
    docker compose `
        --profile prod `
        --profile spring `
        --profile spring-events `
        --profile spring-attendance `
        --profile spring-identity-admin `
        --profile spring-identity-bridge `
        --profile spring-hrm `
        -f docker-compose.yml `
        -f docker-compose.prod.yml `
        -f docker-compose.spring.yml `
        -f docker-compose.spring.prod.yml `
        -f docker-compose.spring.cutover.yml `
        config --quiet
    if ($LASTEXITCODE -ne 0) {
        throw "Spring cutover overlay validation failed with exit code $LASTEXITCODE."
    }
}

Write-Host ""
Write-Host "Spring production gate passed."
