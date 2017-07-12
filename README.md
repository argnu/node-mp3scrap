# Mp3Scrap

Servidor Node.js que escanea carpetas (usando un script python) y sirve los datos a través de una API Restfull.

## Notas

* Para que funcionen las claves foráneas hay que habilitar PRAGMA en SQLite3.
* Comando para crear certificado http:

`openssl req -nodes -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365`

## TODO

* Descarga de Album y/o Artista en un archivo comprimido.
