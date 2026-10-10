@echo off
rem Windows launcher for scripts\sync-vercel-env.sh (uses Git Bash, not WSL).
rem Run from PowerShell:  .\scripts\sync-vercel-env.cmd   or double-click this file.

set "GITBASH=C:\Program Files\Git\bin\bash.exe"
if not exist "%GITBASH%" set "GITBASH=%LOCALAPPDATA%\Programs\Git\bin\bash.exe"
if not exist "%GITBASH%" (
  echo Git Bash was not found. Install Git for Windows, then run this again.
  pause
  exit /b 1
)

"%GITBASH%" "%~dp0sync-vercel-env.sh"
pause
