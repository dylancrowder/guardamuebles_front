# Instrucciones para el backend: fotografías de clientes con Cloudinary

## Objetivo
Permitir que el perfil de cada cliente liste fotografías guardadas en Cloudinary. El frontend envía archivos al backend; las credenciales y la carga a Cloudinary deben permanecer en el servidor.

## Endpoints requeridos

### Listar fotografías del cliente

`GET /api/clients/:clientId/photos`

Responder `200 OK` con un arreglo, también cuando el cliente aún no tenga fotos:

```json
[
  {
    "id": "photo-record-id",
    "url": "https://res.cloudinary.com/<cloud-name>/image/upload/v123/client-photos/photo.jpg"
  }
]
```

`id` debe ser el identificador de la foto guardada en la base de datos y `url` su URL HTTPS de entrega de Cloudinary. El frontend espera exactamente esos dos campos.

### Subir una fotografía

`POST /api/clients/:clientId/photos`

- `Content-Type: multipart/form-data`.
- Nombre del campo del archivo: `photo`.
- El frontend envía una foto por petición.
- Aceptar imágenes de hasta 10 MB.
- Validar en el servidor el tipo y contenido real de la imagen; no confiar únicamente en la extensión ni en el MIME enviado por el cliente.
- Comprobar que el cliente existe y que el usuario autenticado puede modificarlo.
- Subir el archivo a Cloudinary con una carpeta por ejemplo `guardamuebles/clientes/:clientId`.
- Guardar en la base de datos la relación entre cliente y foto junto con `public_id`, `secure_url`, formato y fecha de creación. No guardar el archivo binario ni la clave secreta de Cloudinary.
- Responder `201 Created` con el registro serializado:

```json
{
  "id": "photo-record-id",
  "url": "https://res.cloudinary.com/<cloud-name>/image/upload/v123/client-photos/photo.jpg"
}
```

Para que el frontend mantenga la galería actualizada, la respuesta de cada POST debe incluir la foto recién guardada en ese formato.

## Almacenamiento y seguridad

- Configurar `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` como variables privadas del backend; nunca exponerlas al frontend ni usar prefijo `NEXT_PUBLIC_`.
- Mantener la foto asociada al cliente en la base de datos. Puede usarse una colección de fotos con `clientId` e índice por cliente, o un arreglo de metadatos en el documento de cliente, según el modelo existente.
- Limitar tamaño y cantidad de archivos y autorizar cada solicitud antes de acceder o modificar fotos.
- Al eliminar un cliente, definir una política para sus fotos: borrar de Cloudinary y de la base de datos, o conservarlas deliberadamente. Si más adelante se agrega eliminación de fotos, borrar en ambos lugares y validar que la foto pertenezca al cliente.
- No devolver `public_id` ni metadatos internos si la API no los necesita; el contrato del frontend solo requiere `id` y `url`.

## Respuestas de error
Usar códigos HTTP coherentes y una respuesta JSON con `message`, por ejemplo:

```json
{ "message": "El archivo supera el límite de 10 MB" }
```

- `400`: archivo ausente, formato inválido o tamaño excedido.
- `401`/`403`: usuario sin sesión o sin permiso sobre el cliente.
- `404`: cliente no encontrado.
- `413`: petición demasiado grande, si el límite del servidor o proxy la rechaza antes de llegar al endpoint.
- `500`: error interno o de Cloudinary; no incluir claves ni secretos en el mensaje.

Si falla la subida a Cloudinary, no crear un registro de foto incompleto. Si falla el guardado en la base de datos después de subir a Cloudinary, intentar borrar el recurso de Cloudinary para evitar archivos huérfanos.

## Compatibilidad con el frontend

El frontend ya envía el archivo como `FormData` con el campo `photo` y usa estas rutas:

- `GET /api/clients/:clientId/photos`
- `POST /api/clients/:clientId/photos`

Configurar CORS para permitir el origen del frontend y sus credenciales si la autenticación las necesita. No establecer manualmente `Content-Type: multipart/form-data` en la petición: el navegador debe agregar el `boundary` de `FormData`.
