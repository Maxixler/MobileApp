# MobileApp - Deneyap Bluetooth Kontrol Uygulamasi

Bu proje, Deneyap karta Bluetooth uzerinden baglanip motor suruculerini kontrol eden ve sensorden veri okuyan bir mobil uygulamadir.

## Mevcut Durum Analizi

- Projede calisan uygulama kodu `per` klasoru altinda bir Expo React Native uygulamasi.
- Onceki surumde yalnizca yon tuslari ve hiz slider'i olan statik bir ekran bulunuyordu.
- Bluetooth tarama/eslestirme/veri iletimi altyapisi yoktu.
- Sensor veri modeli ve komut protokolu tanimli degildi.

## Yapilan Gelistirmeler

- BLE tarama, baglanma, ayrilma ve bildirim dinleme altyapisi eklendi.
- Android izinleri (`BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `ACCESS_FINE_LOCATION`) tanimlandi.
- Motor komutlari icin JSON tabanli bir komut protokolu eklendi.
- Motor pin atamalarini uygulama ekranindan degistirme ve karta gonderme eklendi.
- Sensor verileri icin tekil okuma ve otomatik periyodik okuma mekanizmasi eklendi.
- Canli log paneli ile TX/RX akisinin uygulama icinde gorulebilmesi saglandi.

## Mimari

- `per/App.js`: Ana kontrol paneli (baglanti, motor kontrolu, sensor paneli, loglar)
- `per/src/services/bleService.js`: BLE yonetimi (scan/connect/notify/write)
- `per/src/protocol/deneyapProtocol.js`: Komut olusturma ve gelen veriyi parse etme
- `per/src/config/bleConfig.js`: Service/Characteristic UUID ve isim filtresi ayarlari

## Donanim/Firmware Tarafi Beklentisi

Deneyap firmware'inin asagidaki turde JSON satirlari isleyebilmesi beklenir:

Motor komutu:

```json
{"type":"motor","leftPwm":60,"rightPwm":60,"leftDirection":"forward","rightDirection":"forward"}
```

Pin map komutu:

```json
{"type":"pin-map","motorPins":{"leftEnablePin":"D5","leftIn1Pin":"D6","leftIn2Pin":"D7","rightEnablePin":"D9","rightIn1Pin":"D10","rightIn2Pin":"D11"}}
```

Sensor okuma komutu:

```json
{"type":"sensor-read","sensor":"distance"}
```

Uygulamanin anlayacagi ornek sensor cevabi:

```json
{"type":"sensor-value","sensor":"distance","value":18.6}
```

Toplu sensor cevabi:

```json
{"type":"sensor","values":{"distance":18.6,"temperature":29.2,"light":412,"battery":3.9}}
```

## Calistirma

`npm` komutu bu ortamda tanimli olmadigi icin paket kurulumu terminalden yapilamadi. Kendi makinede su adimlari uygula:

1. `cd per`
2. `npm install`
3. `npx expo start`

## Onemli Notlar

- `react-native-ble-plx`, Expo Go yerine Development Build ile daha stabil calisir. Gerekirse `npx expo prebuild` + dev client kullan.
- Android tarafinda eslestirme (pairing), baglanma aninda sistem penceresi ile tetiklenir.
- `per/src/config/bleConfig.js` icindeki UUID alanlarini Deneyap firmware'indeki BLE servis/karakteristiklerle ayni olacak sekilde guncelle.

## Sonraki Akilli Eklentiler (Oneri)

- Joystick benzeri surekli hiz/yon kontrolu
- PID ayar paneli (Kp, Ki, Kd)
- Sensor alarm kurallari (mesafe kritik esik, sicaklik alarmi)
- Veri kaydi ve grafikleme (zaman serisi)
- Komut profilleri (hizli ileri, cizgi takip, engelden kac)