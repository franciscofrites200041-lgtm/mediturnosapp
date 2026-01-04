# 📋 Configuración de Google Sheets para n8n

## Estructura de la Hoja "Clinicas"

Crea un Google Sheet con el siguiente nombre: `MediTurnos Bot Config`

### Columnas requeridas:

| Columna | Tipo | Descripción | Ejemplo |
|---------|------|-------------|---------|
| `whatsapp_instance` | Texto | Nombre de la instancia en Evolution API | `clinica-san-martin` |
| `whatsapp_number` | Texto | Número de WhatsApp de la clínica | `+5491155551234` |
| `clinic_name` | Texto | Nombre visible de la clínica | `Clínica San Martín` |
| `clinic_id` | Texto | ID de la clínica en MediTurnos | `clm_abc123xyz` |
| `api_key` | Texto | API Key de la clínica | `mt_clinica-san-martin_a1b2c3d4` |
| `api_url` | Texto | URL base de la API | `https://api.mediturnos.com/api/v1/n8n` |
| `active` | Booleano | Si la clínica está activa | `TRUE` |
| `timezone` | Texto | Zona horaria | `America/Argentina/Buenos_Aires` |
| `welcome_message` | Texto | Mensaje personalizado de bienvenida | `¡Bienvenido a Clínica San Martín!` |

### Ejemplo de datos:

```csv
whatsapp_instance,whatsapp_number,clinic_name,clinic_id,api_key,api_url,active,timezone,welcome_message
clinica-san-martin,+5491155551234,Clínica San Martín,clm_abc123,mt_san-martin_xyz123,https://api.mediturnos.com/api/v1/n8n,TRUE,America/Argentina/Buenos_Aires,¡Bienvenido a Clínica San Martín! 🏥
clinica-del-norte,+5491155554321,Clínica del Norte,clm_def456,mt_del-norte_abc789,https://api.mediturnos.com/api/v1/n8n,TRUE,America/Argentina/Buenos_Aires,¡Hola! Soy el asistente de Clínica del Norte 👋
centro-medico-sur,+5491155559999,Centro Médico Sur,clm_ghi789,mt_sur_mno456,https://api.mediturnos.com/api/v1/n8n,TRUE,America/Argentina/Buenos_Aires,Bienvenido al Centro Médico Sur
```

---

## Configuración en n8n

### 1. Crear credencial de Google Sheets

1. Ve a **Settings** → **Credentials** → **Add Credential**
2. Selecciona **Google Sheets API**
3. Autoriza con tu cuenta de Google
4. Guarda la credencial como "MediTurnos Google Sheets"

### 2. Configurar el nodo Lookup

En el nodo "Lookup Clinic Config" del workflow:

```yaml
Operation: Lookup
Document ID: [Tu ID del documento de Google Sheets]
Sheet Name: Clinicas
Lookup Column: whatsapp_instance
Lookup Value: {{ $json.to_number }}
```

### 3. Mapeo de campos

Después del lookup, los campos disponibles serán:

- `{{ $json.clinic_name }}` - Nombre de la clínica
- `{{ $json.api_key }}` - API Key para la autenticación
- `{{ $json.api_url }}` - URL base de la API
- `{{ $json.welcome_message }}` - Mensaje de bienvenida personalizado

---

## Alternativa: Usar Airtable

Si prefieres Airtable en lugar de Google Sheets:

### Estructura de la tabla "Clinicas"

| Campo | Tipo |
|-------|------|
| WhatsApp Instance | Single line text |
| WhatsApp Number | Phone number |
| Clinic Name | Single line text |
| API Key | Single line text |
| API URL | URL |
| Active | Checkbox |
| Timezone | Single select |
| Welcome Message | Long text |

### Credencial en n8n

1. Ve a tu cuenta de Airtable
2. Genera un API Key o Personal Access Token
3. En n8n, crea una credencial de Airtable con ese token

---

## Alternativa: Variables de Entorno

Si solo tienes pocas clínicas, puedes usar variables de entorno en n8n:

### Configuración:

```env
CLINICS_CONFIG='[
  {
    "instance": "clinica-san-martin",
    "name": "Clínica San Martín",
    "apiKey": "mt_san-martin_xyz123",
    "apiUrl": "https://api.mediturnos.com/api/v1/n8n"
  },
  {
    "instance": "clinica-del-norte",
    "name": "Clínica del Norte",
    "apiKey": "mt_del-norte_abc789",
    "apiUrl": "https://api.mediturnos.com/api/v1/n8n"
  }
]'
```

### Nodo Function para buscar clínica:

```javascript
const clinicsConfig = JSON.parse($env.CLINICS_CONFIG);
const targetInstance = $input.first().json.to_number;

const clinic = clinicsConfig.find(c => c.instance === targetInstance);

if (!clinic) {
  return { error: 'Clinic not found' };
}

return {
  ...clinic,
  from_number: $input.first().json.from_number,
  message_text: $input.first().json.message_text
};
```

---

## Seguridad

### ⚠️ Importante

1. **Nunca** compartas el Google Sheet públicamente
2. Usa permisos específicos para la cuenta de servicio de n8n
3. Las API Keys son sensibles, tratarlas como contraseñas
4. Considera encriptar la columna de API Keys

### Permisos recomendados

- Solo la cuenta de n8n debe tener acceso al Sheet
- Usa una cuenta de servicio (Service Account) en lugar de tu cuenta personal
- Activa alertas de auditoría en Google Workspace
