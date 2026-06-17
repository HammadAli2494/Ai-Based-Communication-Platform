@echo off
cd /d "%~dp0"
echo Using backend venv Python...
venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
pause
