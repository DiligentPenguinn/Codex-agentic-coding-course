@echo off
setlocal EnableExtensions

set "COURSE_ROOT=%~dp0"
set "COURSE_NODE=node"

echo.
echo        *       .       *
echo    +-----------------------+
echo    ^|   CONTENT BUILDER     ^|
echo    ^|       ACADEMY         ^|
echo    ^|                       ^|
echo    ^|      [ ^>_ ]  +        ^|
echo    +----------+------------+
echo               ^|
echo        Build something real.

echo.
echo Welcome to Content Builder Academy!
echo.
echo Thanks for trying our course. We'll help you get everything ready.
echo.
echo Here's what we'll do:
echo   1. Check that the required tools are available.
echo   2. Show you anything that needs to be installed.
echo   3. Ask for your permission before installing anything.
echo   4. Open the course setup app.
echo.
echo Nothing will be installed without your approval.
echo.
echo Checking your computer now...
echo.

if "%COURSE_MOCK_BOOTSTRAP_TEST%"=="1" if "%COURSE_MOCK_FORCE_NODE_MISSING%"=="1" goto :node_missing

where node >nul 2>&1
if errorlevel 1 goto :node_missing

for /f "usebackq delims=" %%V in (`node -p "Number(process.versions.node.split('.')[0])"`) do set "COURSE_NODE_MAJOR=%%V"
if not defined COURSE_NODE_MAJOR goto :node_missing
if %COURSE_NODE_MAJOR% LSS 22 goto :node_missing
goto :run_setup

:node_missing
echo.
echo Required: Node.js 22 or newer
echo Command: winget install --id OpenJS.NodeJS.LTS
echo Scope: system application
echo.

where winget >nul 2>&1
if errorlevel 1 (
  echo Automatic installation is unavailable because winget was not found.
  echo Manual download: https://nodejs.org/en/download
  echo No installation was run.
  exit /b 2
)

set "COURSE_INSTALL_NODE="
set /p "COURSE_INSTALL_NODE=Run the displayed Node.js installation? [y/N] "
if /I "%COURSE_INSTALL_NODE%"=="Y" goto :install_node
if /I "%COURSE_INSTALL_NODE%"=="YES" goto :install_node
echo No installation was run.
exit /b 2

:install_node
winget install --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
  echo Node.js installation failed.
  exit /b 3
)

if exist "%ProgramFiles%\nodejs\node.exe" (
  set "COURSE_NODE=%ProgramFiles%\nodejs\node.exe"
) else (
  where node >nul 2>&1
  if errorlevel 1 (
    echo Node.js installed, but this terminal cannot locate it yet.
    echo Open a new terminal and run .\start-course.cmd again.
    exit /b 3
  )
)

:run_setup
"%COURSE_NODE%" "%COURSE_ROOT%scripts\setup-and-start.mjs"
set "COURSE_RESULT=%ERRORLEVEL%"

if "%COURSE_RESULT%"=="0" exit /b 0
if "%COURSE_RESULT%"=="2" exit /b 2
if "%COURSE_RESULT%"=="3" exit /b 3
if "%COURSE_RESULT%"=="4" exit /b 4
if "%COURSE_RESULT%"=="5" exit /b 5
exit /b 5
