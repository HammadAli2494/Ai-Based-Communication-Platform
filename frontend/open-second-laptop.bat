@echo off
REM Run this on the SECOND laptop. Set the host laptop IP below.
set "HOST_IP=192.168.1.10"

set "APP_URL=http://%HOST_IP%:5173"
set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "CHROME_X86=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"

if exist "%CHROME%" goto :launch_chrome
if exist "%CHROME_X86%" set "CHROME=%CHROME_X86%" & goto :launch_chrome
if exist "%EDGE%" goto :launch_edge

echo Install Chrome or Edge first.
pause
exit /b 1

:launch_chrome
echo Opening %APP_URL%
start "" "%CHROME%" --user-data-dir="%TEMP%\signbridge-client" --unsafely-treat-insecure-origin-as-secure=%APP_URL% %APP_URL%
exit /b 0

:launch_edge
echo Opening %APP_URL%
start "" "%EDGE%" --user-data-dir="%TEMP%\signbridge-client" --unsafely-treat-insecure-origin-as-secure=%APP_URL% %APP_URL%
exit /b 0
