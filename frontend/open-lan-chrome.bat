@echo off
setlocal

REM === EDIT THIS if you run this file on the SECOND laptop ===
set "HOST_IP="

if "%HOST_IP%"=="" (
  for /f "usebackq tokens=2 delims=:" %%a in (`ipconfig ^| findstr /c:"IPv4"`) do (
    set "HOST_IP=%%a"
    goto :ip_found
  )
)

:ip_found
set "HOST_IP=%HOST_IP: =%"
if "%HOST_IP%"=="" (
  echo Could not detect IP. Edit HOST_IP at the top of this file.
  pause
  exit /b 1
)

set "APP_URL=http://%HOST_IP%:5173"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "CHROME_X86=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"

if exist "%CHROME%" goto :launch_chrome
if exist "%CHROME_X86%" set "CHROME=%CHROME_X86%" & goto :launch_chrome
if exist "%EDGE%" goto :launch_edge

echo Install Google Chrome or Microsoft Edge, then run this file again.
pause
exit /b 1

:launch_chrome
echo Opening LAN demo in Chrome: %APP_URL%
start "" "%CHROME%" --user-data-dir="%TEMP%\signbridge-lan" --unsafely-treat-insecure-origin-as-secure=%APP_URL% --unsafely-treat-insecure-origin-as-secure=http://localhost:5173 %APP_URL%
exit /b 0

:launch_edge
echo Opening LAN demo in Edge: %APP_URL%
start "" "%EDGE%" --user-data-dir="%TEMP%\signbridge-lan" --unsafely-treat-insecure-origin-as-secure=%APP_URL% --unsafely-treat-insecure-origin-as-secure=http://localhost:5173 %APP_URL%
exit /b 0
