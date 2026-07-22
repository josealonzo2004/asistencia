# Backend - Control de Asistencia Universitaria

API desarrollada con Laravel y PostgreSQL para manejar usuarios, materias, asignaciones y registros de asistencia con validacion por QR y GPS.

Este backend es consumido por la app movil hecha en React Native con Expo.

## Tecnologias principales

- Laravel
- PHP 8.3+
- PostgreSQL
- Laravel Sanctum para autenticacion por tokens
- Migraciones de base de datos
- Controladores REST para la app movil

## Como ejecutar

Instalar dependencias:

```bash
composer install
```

Configurar el archivo `.env` con los datos de PostgreSQL:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=asiste_u
DB_USERNAME=postgres
DB_PASSWORD=tu_password
```

Generar la llave de Laravel si todavia no existe:

```bash
php artisan key:generate
```

Ejecutar migraciones:

```bash
php artisan migrate
```

Levantar el servidor para usarlo desde el celular:

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

El frontend debe apuntar a la IP local de la computadora, por ejemplo:

```text
http://192.168.100.11:8000/api
```

## Flujo general del backend

1. El usuario inicia sesion desde la app movil.
2. Laravel valida correo, contrasena y si el usuario esta activo.
3. Si todo esta correcto, genera un token con Sanctum.
4. La app usa ese token para consultar y modificar informacion.
5. Cada rol usa endpoints segun su flujo:
   - Admin gestiona usuarios, materias y asignaciones.
   - Docente genera y cierra sesiones de asistencia.
   - Estudiante valida asistencia escaneando QR y enviando GPS.

## Roles del sistema

### Administrador

Puede:

- Crear usuarios administradores, docentes y estudiantes.
- Editar usuarios.
- Activar y desactivar usuarios.
- Crear y editar materias.
- Asignar docentes a materias.
- Asignar estudiantes a materias.
- Revisar reportes generales.

### Docente

Puede:

- Ver solo las materias que tiene asignadas.
- Crear una sesion de asistencia.
- Generar un QR para esa sesion.
- Registrar la ubicacion GPS de referencia desde su telefono.
- Cerrar la sesion de asistencia.

Cuando cierra una sesion, el backend marca como ausentes a los estudiantes asignados que no registraron asistencia.

### Estudiante

Puede:

- Ver sus materias.
- Escanear el QR generado por el docente.
- Enviar su ubicacion GPS.
- Consultar sus asistencias y faltas.

## Validacion de asistencia

Cuando un estudiante escanea el QR, el backend valida:

- Que el codigo QR sea valido.
- Que la sesion de asistencia exista.
- Que la sesion siga abierta.
- Que el estudiante este asignado a la materia.
- Que la ubicacion del estudiante este dentro del rango permitido.

Si pasa las validaciones, se crea o actualiza un registro de asistencia como presente.

Si el estudiante no registra asistencia y el docente cierra la sesion, queda como ausente.

## Endpoints principales

```text
POST /api/login
```

Inicia sesion y devuelve token de autenticacion.

```text
POST /api/logout
```

Cierra sesion del usuario autenticado.

```text
GET /api/mobile/bootstrap
```

Devuelve los datos necesarios para cargar la app movil: usuarios, estudiantes, materias, asignaciones, sesiones y asistencias.

```text
POST /api/users
PUT /api/users/{user}
PATCH /api/users/{user}/active
```

Crea, edita y activa/desactiva usuarios.

```text
POST /api/students
PUT /api/students/{student}
DELETE /api/students/{student}
```

Gestiona estudiantes.

```text
POST /api/courses
PUT /api/courses/{course}
DELETE /api/courses/{course}
```

Gestiona materias.

```text
GET /api/courses/{course}/enrollments
PUT /api/courses/{course}/enrollments
```

Consulta y sincroniza estudiantes asignados a una materia.

```text
POST /api/attendance/sessions
POST /api/attendance/sessions/{session}/close
POST /api/attendance/validate
```

Crea sesion de asistencia, cierra sesion y valida asistencia de estudiante.

## Estructura de archivos

```text
routes/api.php
```

Define las rutas de la API que usa la app movil.

```text
app/Models/User.php
```

Modelo principal de usuarios. Maneja rol, correo, contrasena, estado activo y datos academicos.

```text
app/Models/Course.php
```

Modelo de materias o cursos.

```text
app/Models/Enrollment.php
```

Modelo que representa la asignacion de estudiantes a una materia.

```text
app/Models/AttendanceSession.php
```

Modelo de una sesion de asistencia creada por el docente.

```text
app/Models/AttendanceRecord.php
```

Modelo de cada registro individual de asistencia de un estudiante.

```text
app/Http/Controllers/AuthController.php
```

Controla login y logout. Tambien evita que usuarios desactivados puedan iniciar sesion.

```text
app/Http/Controllers/MobileDataController.php
```

Entrega al frontend los datos iniciales que necesita para cargar la app.

```text
app/Http/Controllers/UserController.php
```

Gestiona usuarios: crear, editar, activar y desactivar.

```text
app/Http/Controllers/StudentController.php
```

Gestiona estudiantes desde el flujo administrativo.

```text
app/Http/Controllers/CourseController.php
```

Gestiona materias.

```text
app/Http/Controllers/EnrollmentController.php
```

Gestiona la asignacion de estudiantes a materias.

```text
app/Http/Controllers/AttendanceController.php
```

Gestiona sesiones de asistencia, generacion de QR, validacion por GPS y cierre de registros.

```text
database/migrations
```

Contiene la estructura de la base de datos: usuarios, materias, asignaciones, sesiones, asistencias y campo activo.

```text
database/seeders/DatabaseSeeder.php
```

Archivo para crear datos iniciales de prueba si se desea preparar una demo rapidamente.

## Tablas principales

- `users`: usuarios del sistema, incluyendo admin, docentes y estudiantes.
- `courses`: materias.
- `enrollments`: estudiantes asignados a materias.
- `attendance_sessions`: sesiones de asistencia creadas por docentes.
- `attendance_records`: registros de asistencia por estudiante.
- `personal_access_tokens`: tokens de Sanctum.

## Recomendacion para presentar

Antes de la presentacion, preparar:

- Un usuario administrador.
- Un docente activo.
- Dos o tres estudiantes activos.
- Una materia asignada al docente.
- Estudiantes asignados a esa materia.

Luego mostrar el flujo:

1. Admin crea y asigna datos.
2. Docente genera QR.
3. Estudiante escanea QR.
4. Docente cierra asistencia.
5. Estudiante y admin revisan resultados.

