@echo off
REM ============================================
REM  Tossalisti - eins-smells deploy
REM  Tvismelltu a thessa skra til ad birta breytingar a tossalisti.is
REM ============================================
cd /d "%~dp0"

echo.
echo === 1/4  Set upp pakka (npm install) ===
call npm install
if errorlevel 1 goto :error

echo.
echo === 2/4  Bygg appid (npm run build) ===
call npm run build
if errorlevel 1 goto :error

echo.
echo === 3/4  Vista breytingar (git commit) ===
git add -A
set /p MSG="Skrifadu stutta lysingu a breytingunni (eda yttu Enter): "
if "%MSG%"=="" set MSG=Uppfaersla
git commit -m "%MSG%"

echo.
echo === 4/4  Yti i loftid (git push) ===
git push
if errorlevel 1 goto :error

echo.
echo ============================================
echo  KLARAD! Netlify uppfaerir tossalisti.is eftir ca 30-60 sek.
echo  Endurhladdu sidan med Ctrl+Shift+R.
echo ============================================
pause
exit /b 0

:error
echo.
echo *** Eitthvad for urskeidis - lestu villuna her ad ofan. ***
echo (Algengast: ovistadar breytingar - reyndu aftur, eda lattu Claude vita.)
pause
exit /b 1
