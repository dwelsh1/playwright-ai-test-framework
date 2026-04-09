# kill-test-processes.ps1
# Kills orphaned Playwright, ESLint, and npx processes related to the framework.
# Usage: powershell -ExecutionPolicy Bypass -File scripts/kill-test-processes.ps1

$repoNames = @("my-pw-ai-framework", "playwright-ai-test-framework")
$killed = 0

$processes = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object {
        $commandLine = $_.CommandLine
        ($repoNames | Where-Object { $commandLine -match [regex]::Escape($_) }).Count -gt 0 -and
        $_.CommandLine -match 'playwright|eslint|npx'
    }

if ($processes.Count -eq 0) {
    Write-Host "No orphaned framework processes found." -ForegroundColor Green
    exit 0
}

foreach ($proc in $processes) {
    try {
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
        Write-Host "Killed PID $($proc.ProcessId): $($proc.CommandLine.Substring(0, [Math]::Min(120, $proc.CommandLine.Length)))..." -ForegroundColor Yellow
        $killed++
    }
    catch {
        Write-Host "Failed to kill PID $($proc.ProcessId): $_" -ForegroundColor Red
    }
}

Write-Host "`nKilled $killed process(es)." -ForegroundColor Green
