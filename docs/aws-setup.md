# Configuración de AWS (S3 y CloudFront)

Esta guía explica cómo configurar un bucket de Amazon S3 y una distribución de Amazon CloudFront para alojar y distribuir de forma segura el contenido de video para la plataforma FluentLeap.

## 1. Requisitos Previos

- Una cuenta de AWS con permisos para crear buckets de S3 y distribuciones de CloudFront.
- AWS CLI configurada en tu máquina local (opcional, pero recomendado).

## 2. Configuración del Bucket de S3

Sigue estos pasos para crear y configurar tu bucket de S3:

1.  **Crear un Bucket de S3:**
    *   Ve a la consola de S3 en AWS.
    *   Haz clic en "Crear bucket".
    *   Elige un nombre de bucket único y una región.
    *   **Desmarca** la opción "Bloquear todo el acceso público". Necesitarás un acceso controlado, pero no completamente bloqueado.
    *   Confirma que entiendes los riesgos y crea el bucket.

2.  **Configurar la Política del Bucket:**
    *   Selecciona tu bucket y ve a la pestaña "Permisos".
    *   En la sección "Política de bucket", pega la siguiente política. **Asegúrate de reemplazar `YOUR_BUCKET_NAME` con el nombre de tu bucket y `YOUR_CLOUDFRONT_DISTRIBUTION_ID` con el ID de tu distribución de CloudFront (lo obtendrás más adelante).**

    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "AllowCloudFrontServicePrincipal",
                "Effect": "Allow",
                "Principal": {
                    "Service": "cloudfront.amazonaws.com"
                },
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*",
                "Condition": {
                    "StringEquals": {
                        "AWS:SourceArn": "arn:aws:cloudfront::YOUR_AWS_ACCOUNT_ID:distribution/YOUR_CLOUDFRONT_DISTRIBUTION_ID"
                    }
                }
            }
        ]
    }
    ```

3.  **Configurar CORS:**
    *   En la misma pestaña de "Permisos", desplázate hacia abajo hasta "Uso compartido de recursos entre orígenes (CORS)".
    *   Pega la siguiente configuración para permitir que tu aplicación web acceda al contenido del bucket:

    ```xml
    [
        {
            "AllowedHeaders": [
                "*"
            ],
            "AllowedMethods": [
                "GET"
            ],
            "AllowedOrigins": [
                "http://localhost:3000",
                "https://your-production-domain.com"
            ],
            "ExposeHeaders": []
        }
    ]
    ```
    *   **Reemplaza `https://your-production-domain.com` con el dominio de tu aplicación en producción.**

## 3. Configuración de CloudFront

CloudFront actuará como una red de entrega de contenido (CDN) para distribuir tus videos de forma rápida y segura.

1.  **Crear una Distribución de CloudFront:**
    *   Ve a la consola de CloudFront en AWS.
    *   Haz clic en "Crear distribución".
    *   En "Origen", selecciona tu bucket de S3.
    *   En "Acceso al bucket de S3", elige "Sí, usar OAI (identidad de acceso de origen)" y crea una nueva OAI.
    *   En "Política de bucket", elige "Sí, actualizar la política del bucket".

2.  **Configurar el Comportamiento de la Caché:**
    *   En "Configuración de comportamiento predeterminado", asegúrate de que "Métodos HTTP permitidos" esté configurado en `GET, HEAD`.
    *   En "Restringir el acceso del espectador", selecciona "Sí".
    *   En "Firmantes de confianza", elige "Solo yo".

3.  **Configurar URLs Firmadas:**
    *   Para restringir el acceso al contenido, usarás URLs firmadas. Esto se gestiona desde el backend de tu aplicación.
    *   Necesitarás crear un par de claves de CloudFront. Ve a "Pares de claves" en la sección "Seguridad" de tu cuenta de AWS y crea un nuevo par de claves. Descarga y guarda el archivo de clave privada de forma segura.

## 4. Configuración de Variables de Entorno

Añade las siguientes variables de entorno a tu archivo `.env` en el backend (`api/.env`):

```
# AWS S3/CloudFront
AWS_ACCESS_KEY_ID=tu-access-key-id
AWS_SECRET_ACCESS_KEY=tu-secret-access-key
AWS_REGION=tu-region
S3_BUCKET_NAME=tu-nombre-de-bucket
CLOUDFRONT_KEY_PAIR_ID=tu-key-pair-id
CLOUDFRONT_PRIVATE_KEY_PATH=ruta/a/tu/clave/privada.pem
```

-   `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`: Credenciales de un usuario de IAM con permisos para acceder a S3.
-   `S3_BUCKET_NAME`: El nombre de tu bucket de S3.
-   `CLOUDFRONT_KEY_PAIR_ID`: El ID de tu par de claves de CloudFront.
-   `CLOUDFRONT_PRIVATE_KEY_PATH`: La ruta al archivo de clave privada que descargaste.

Con esta configuración, tu aplicación podrá generar URLs firmadas para que los usuarios autenticados puedan acceder al contenido de video de forma segura a través de CloudFront.