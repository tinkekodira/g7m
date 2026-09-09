@echo off
rem ===========================================================================
rem  pnpm, for a Windows shell that has never heard of it.
rem
rem  Node ships Corepack and Corepack knows how to run the pnpm version pinned
rem  in package.json, but a plain `npm i -g pnpm` was never done on this machine
rem  and `pnpm` is therefore not a command. This file makes it one -- cmd.exe
rem  looks in the current directory before it looks at PATH, so `pnpm dev`
rem  typed in the repository root finds this and works.
rem
rem  It also puts the repository root on PATH for whatever it launches. That is
rem  the part that matters: the root scripts shell out to pnpm themselves
rem  (`dev` runs `pnpm --filter @g7m/web dev`), and without it the outer call
rem  succeeds and the inner one fails with the same message you started with.
rem
rem  Shadowing a globally installed pnpm is fine and slightly preferable:
rem  Corepack honours the `packageManager` field, so this runs the version the
rem  repository pins rather than whatever happens to be installed.
rem
rem  PowerShell does not search the current directory, so there it is
rem  `.\pnpm.cmd dev`. Git Bash finds it as `./pnpm.cmd`.
rem ===========================================================================

setlocal
set "PATH=%~dp0;%PATH%"

rem `where` rather than a hardcoded Program Files path: Node is commonly under
rem nvm, fnm or a user profile, and all of those put corepack on PATH.
for /f "delims=" %%C in ('where corepack.cmd 2^>nul') do (
  set "COREPACK=%%C"
  goto :found
)

echo pnpm could not be started: corepack was not found on PATH.
echo Install Node.js 22.12 or newer, which ships with it.
exit /b 1

:found
call "%COREPACK%" pnpm %*
exit /b %ERRORLEVEL%
