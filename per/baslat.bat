@echo off
echo ====================================================================
echo [1/3] Android APK Derleniyor (Ilk seferde 5-10 dk surebilir)...
echo ====================================================================
cd android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo Derleme basarisiz oldu!
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo ====================================================================
echo [2/3] Uygulama Emulatore Yukleniyor...
echo ====================================================================
C:\Users\Administrator\AppData\Local\Android\Sdk\platform-tools\adb.exe install -r android\app\build\outputs\apk\debug\app-debug.apk

echo.
echo ====================================================================
echo [3/3] Expo Metro Sunucusu Baslatiliyor...
echo ====================================================================
echo Acilan pencerede "a" tusuna basarak veya sadece bekleyerek uygulamanin emulatorde acilmasini saglayabilirsiniz.
npx expo start
